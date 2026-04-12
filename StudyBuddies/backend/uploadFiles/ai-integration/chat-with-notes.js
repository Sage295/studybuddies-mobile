const { GoogleGenerativeAI } = require("@google/generative-ai");

const MAX_CONTEXT_CHARS = 30000;
const MAX_NOTE_CHARS = 12000;
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1200;

function getGeminiClient() {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the backend.");
    error.statusCode = 503;
    throw error;
  }

  return new GoogleGenerativeAI(apiKey);
}

function normalizeText(value) {
  return String(value || "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function buildNotesContext(notes) {
  const sections = [];
  let remaining = MAX_CONTEXT_CHARS;

  for (const note of notes) {
    if (remaining <= 0) break;

    const baseText = normalizeText(note.extractedText || note.summary);
    if (!baseText) continue;

    const title = String(note.title || note.filename || "Untitled note").trim();
    const perNoteBudget = Math.min(MAX_NOTE_CHARS, remaining);
    const excerpt = baseText.slice(0, perNoteBudget);
    const truncated = excerpt.length < baseText.length ? "\n[Context truncated]" : "";
    const section = `File: ${title}\n${excerpt}${truncated}`;

    sections.push(section);
    remaining -= section.length + 8;
  }

  return sections.join("\n\n---\n\n");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatusCode(error) {
  return Number(
    error?.statusCode ||
    error?.status ||
    error?.response?.status ||
    error?.cause?.status ||
    0
  );
}

function isRetryableGeminiError(error) {
  const statusCode = getErrorStatusCode(error);
  const message = String(error?.message || "").toLowerCase();

  return (
    statusCode === 429 ||
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 503 ||
    statusCode === 504 ||
    message.includes("high demand") ||
    message.includes("service unavailable") ||
    message.includes("temporarily unavailable")
  );
}

function buildUserFacingGeminiError(error) {
  const statusCode = getErrorStatusCode(error);

  if (statusCode === 429 || statusCode === 503 || isRetryableGeminiError(error)) {
    const friendlyError = new Error(
      "AI is busy right now. Please try again in a few moments."
    );
    friendlyError.statusCode = 503;
    return friendlyError;
  }

  const fallbackError = new Error("Unable to chat with notes right now.");
  fallbackError.statusCode = statusCode || 500;
  return fallbackError;
}

async function generateContentWithRetry(model, prompt) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt === MAX_RETRIES) {
        break;
      }

      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw buildUserFacingGeminiError(lastError);
}

async function chatWithNotes({ notes, prompt }) {
  const cleanPrompt = String(prompt || "").trim();
  if (!cleanPrompt) {
    const error = new Error("Prompt is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(notes) || notes.length === 0) {
    const error = new Error("Select at least one note before chatting.");
    error.statusCode = 400;
    throw error;
  }

  const notesContext = buildNotesContext(notes);
  if (!notesContext) {
    const error = new Error("The selected notes do not contain readable text yet.");
    error.statusCode = 400;
    throw error;
  }

  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });

  return generateContentWithRetry(model, `
You are StudyBuddies' note assistant. Answer the user's question using the uploaded note context below.

Rules:
- Give a direct, helpful answer to the user's question.
- Prefer the provided notes over outside assumptions.
- If the answer is incomplete in the notes, say that clearly.
- Keep formatting clean and readable.

User question:
${cleanPrompt}

Uploaded note context:
${notesContext}
  `);
}

module.exports = chatWithNotes;
