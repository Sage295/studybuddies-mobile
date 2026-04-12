import { useEffect, useRef, useState } from "react";
import { chatWithNotes, deleteNote, getNotes, uploadNote } from "../../api/note";
import { useGroups } from "../../context/GroupsContext";
import type { FileItem } from "../../types";
import "./FilesPage.css";

interface AiMsg {
  role: "user" | "ai";
  text: string;
}

interface NoteRecord {
  _id: string;
  title: string;
  filename: string;
  fileType: string;
  uploadedAt: string;
  groupId?: number | string | null;
  groupName?: string | null;
  extractedText?: string | null;
  summary?: string | null;
}

function formatUploadedDate(value: string) {
  const uploadedDate = new Date(value);
  if (Number.isNaN(uploadedDate.getTime())) {
    return "Recently";
  }

  const today = new Date();
  const isSameDay =
    uploadedDate.getFullYear() === today.getFullYear() &&
    uploadedDate.getMonth() === today.getMonth() &&
    uploadedDate.getDate() === today.getDate();

  if (isSameDay) {
    return "Today";
  }

  return uploadedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatSizeFromText(content?: string | null) {
  if (!content) {
    return "Stored in Mongo";
  }

  const bytes = new Blob([content]).size;
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeFromMime(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/msword") return "doc";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (mimeType === "text/plain") return "txt";
  return "file";
}

function toFileItem(note: NoteRecord): FileItem {
  return {
    id: note._id,
    name: note.title || note.filename,
    type: fileTypeFromMime(note.fileType),
    size: formatSizeFromText(note.extractedText),
    group: note.groupName || null,
    uploaded: formatUploadedDate(note.uploadedAt),
    content: note.extractedText || undefined,
    summary: note.summary || undefined,
  };
}

function GeminiIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5L14.05 7.95L19.5 10L14.05 12.05L12 17.5L9.95 12.05L4.5 10L9.95 7.95L12 2.5Z"
        fill="currentColor"
      />
      <path
        d="M18.25 14.75L19.1 17.15L21.5 18L19.1 18.85L18.25 21.25L17.4 18.85L15 18L17.4 17.15L18.25 14.75Z"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  );
}

function FileIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3.5H13.5L18 8V20.5H7V3.5Z"
        fill="#F3EDF8"
        fillOpacity="0.92"
      />
      <path
        d="M13.5 3.5V8H18"
        fill="#DDD1EA"
      />
      <path
        d="M13.5 3.5V8H18"
        stroke="#D2C2E5"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M7 3.5H13.5L18 8V20.5H7V3.5Z"
        stroke="#E2D7EE"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9.5 11H15.5" stroke="#B7A6CC" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M9.5 13.5H15.5" stroke="#B7A6CC" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M9.5 16H13.5" stroke="#B7A6CC" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export default function FilesPage() {
  const { groups, loadingGroups } = useGroups();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filter, setFilter] = useState("All Files");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("personal");
  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);
  const [aiOpen, setAiOpen] = useState(true);
  const [aiMsgs, setAiMsgs] = useState<AiMsg[]>([
    { role: "ai", text: "Select a note with the Gemini icon, then ask a question. Replies come from Gemini using your uploaded file as context." },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiFiles, setAiFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sendingAi, setSendingAi] = useState(false);
  const [pageError, setPageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterTabs = ["All Files", "Personal", ...groups.map((group) => group.name)];

  const filtered =
    filter === "All Files" ? files : files.filter((f) => (filter === "Personal" ? f.group === null : f.group === filter));

  async function loadNotes() {
    setLoading(true);
    setPageError("");

    const response = await getNotes();
    if (response?.error) {
      setPageError(response.error);
      setLoading(false);
      return;
    }

    const nextFiles = Array.isArray(response) ? response.map(toFileItem) : [];
    setFiles(nextFiles);
    setLoading(false);
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function handleUpload() {
    if (!selectedUpload) {
      setPageError("Choose a file before uploading.");
      return;
    }

    setUploading(true);
    setPageError("");

    const selectedGroup =
      selectedGroupId === "personal"
        ? null
        : groups.find((group) => String(group.id) === selectedGroupId) || null;

    const response = await uploadNote(selectedUpload, {
      groupId: selectedGroup?.id ?? null,
      groupName: selectedGroup?.name ?? null,
    });
    if (response?.error) {
      setPageError(response.error);
      setUploading(false);
      return;
    }

    setShowUpload(false);
    setSelectedGroupId("personal");
    setSelectedUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await loadNotes();
    setUploading(false);
  }

  async function handleDelete(fileId: string | number) {
    const response = await deleteNote(String(fileId));
    if (response?.error) {
      setPageError(response.error);
      return;
    }

    setFiles((prev) => prev.filter((file) => file.id !== fileId));
    setAiFiles((prev) => prev.filter((id) => id !== String(fileId)));
  }

  async function sendAi() {
    if (!aiInput.trim() || sendingAi) return;

    const msg = aiInput.trim();
    setAiMsgs((prev) => [...prev, { role: "user", text: msg }]);
    setAiInput("");

    if (aiFiles.length === 0) {
      setAiMsgs((prev) => [
        ...prev,
        { role: "ai", text: "Add at least one uploaded note to context with the Gemini button first." },
      ]);
      return;
    }

    setSendingAi(true);
    const response = await chatWithNotes(msg, aiFiles);
    setSendingAi(false);

    setAiMsgs((prev) => [
      ...prev,
      {
        role: "ai",
        text: response?.reply || response?.error || "Gemini could not answer that right now.",
      },
    ]);
  }

  return (
    <div className="files-wrap">
      <div className="topbar">
        <div className="topbar-left"><h2>Files</h2></div>
        <div className="topbar-right">
          <button className="btn-primary" onClick={() => setShowUpload(true)}>+ Upload File</button>
        </div>
      </div>

      <div className="files-body">
        <div className="files-main page-scroll">
          <div className="files-filters">
            {filterTabs.map((g) => (
              <button key={g} className={`filter-tab ${filter === g ? "active" : ""}`} onClick={() => setFilter(g)}>{g}</button>
            ))}
          </div>

          {pageError && <div className="files-empty">{pageError}</div>}
          {loading && <div className="files-empty">Loading notes...</div>}

          {!loading && (
            <div className="file-list">
              {filtered.length === 0 && <div className="files-empty">No files here yet</div>}
              {filtered.map((file) => (
                <div key={file.id} className="file-row">
                  <span className="file-icon"><FileIcon /></span>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {file.size} · {file.uploaded}
                      {file.group && <span className="file-group-tag">{file.group}</span>}
                    </div>
                  </div>
                  <div className="file-actions">
                    <button
                      className="icon-btn gemini-action-btn"
                      title="Add to AI"
                      aria-label={`Add ${file.name} to AI`}
                      onClick={() =>
                        setAiFiles((prev) => (prev.includes(String(file.id)) ? prev : [...prev, String(file.id)]))
                      }
                    >
                      <GeminiIcon />
                    </button>
                    <button className="icon-btn danger-btn" title="Remove" onClick={() => handleDelete(file.id)}>X</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`ai-panel ${aiOpen ? "open" : "closed"}`}>
          <button className="ai-toggle" onClick={() => setAiOpen(!aiOpen)}>
            <span className="ai-toggle-icon">AI</span>
            <span className="ai-toggle-label">AI Assistant</span>
            <span className="ai-toggle-arrow">{aiOpen ? ">" : "<"}</span>
          </button>
          {aiOpen && (
            <div className="ai-body">
              <div className="ai-files-section">
                <div className="ai-section-label">Files in context</div>
                {aiFiles.length === 0 ? (
                  <div className="ai-no-files">Add an uploaded note to context</div>
                ) : (
                  <div className="ai-file-chips">
                    {aiFiles.map((fileId) => {
                      const file = files.find((entry) => String(entry.id) === fileId);
                      if (!file) return null;

                      return (
                        <div key={fileId} className="ai-file-chip">
                          <span>{file.name}</span>
                          <button onClick={() => setAiFiles((prev) => prev.filter((id) => id !== fileId))}>X</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="ai-messages">
                {aiMsgs.map((m, i) => (
                  <div key={i} className={`ai-msg ${m.role}`}>
                    {m.role === "ai" && <div className="ai-badge">AI</div>}
                    <div className="ai-msg-text">{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="ai-input-row">
                <input
                  className="ai-input"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void sendAi()}
                  placeholder="Ask Gemini about your uploaded notes..."
                />
                <button className="btn-primary ai-send-btn" onClick={() => void sendAi()} disabled={sendingAi}>
                  {sendingAi ? "Thinking..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload File</h3>
              <button className="icon-btn" onClick={() => setShowUpload(false)}>X</button>
            </div>
            <div className="upload-drop-zone" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-icon">Upload</div>
              <div className="upload-text">Click to select a file</div>
              <div className="upload-sub">PDF, DOC, DOCX, TXT supported</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setSelectedUpload(file);
                  setPageError("");
                }}
              />
            </div>
            {selectedUpload && <div className="selected-file">{selectedUpload.name}</div>}
            <div className="field field-mt">
              <label>Assign to Group</label>
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                <option value="personal">Personal</option>
                {groups.map((group) => (
                  <option key={group.id} value={String(group.id)}>
                    {group.name}
                  </option>
                ))}
              </select>
              {loadingGroups && <div className="upload-sub">Loading groups...</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn-primary" type="button" onClick={() => void handleUpload()} disabled={uploading || !selectedUpload}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
