const { GoogleGenerativeAI } = require('@google/generative-ai');

function buildFallbackSummary(text) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'No text content could be extracted from this file.';
  }

  const excerpt = normalized.slice(0, 600);
  return excerpt.length < normalized.length ? `${excerpt}...` : excerpt;
}

async function summarizeContent(filePath, mimeType, extractedText) {
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text content found in file.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackSummary(extractedText);
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const truncated = extractedText.slice(0, 20000);
    const result = await model.generateContent(
      `The following is a student's notes. Please provide a concise summary of the key points covered:\n\n${truncated}`
    );

    return result.response.text();
  } catch (error) {
    console.warn('AI summarization failed, using local fallback summary:', error.message);
    return buildFallbackSummary(extractedText);
  }
}

module.exports = summarizeContent;
