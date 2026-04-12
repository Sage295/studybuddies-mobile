const express = require('express');
const router = express.Router();
const upload = require('./upload-file');
const Note = require('./file-info');
const authMiddleware = require('../auth');

// POST /api/notes/upload
router.post('/upload', authMiddleware, (req, res, next) => {
  upload.single('note')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    let extractedText = null;
    let summary = null;

    try {
      const textExtraction = require('./ai-integration/extract-text');
      const contentSummary = require('./ai-integration/summarize');
      extractedText = await textExtraction(req.file.path, req.file.mimetype);
      summary = await contentSummary(req.file.path, req.file.mimetype, extractedText);
    } catch (processingError) {
      console.warn('Note processing failed, saving uploaded file without extracted text:', processingError.message);
    }

    const note = await Note.create({
      user: String(req.user.id),
      title: req.file.originalname,
      filename: req.file.originalname,
      storedName: req.file.filename,
      fileType: req.file.mimetype,
      filePath: req.file.path,
      groupId: req.body.groupId ? String(req.body.groupId) : null,
      groupName: req.body.groupName ? String(req.body.groupName) : null,
      extractedText,
      summary
    });

    res.status(201).json({ message: 'Note uploaded successfully.', note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes: retrieve all notes for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ user: String(req.user.id) }).sort({ uploadedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/:id/download — stream a file back to the user
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const noteIds = [...new Set((req.body.noteIds || []).map((noteId) => String(noteId).trim()).filter(Boolean))];
    const prompt = String(req.body.prompt || '').trim();

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    if (noteIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one note before chatting.' });
    }

    const notes = await Note.find({
      _id: { $in: noteIds },
      user: String(req.user.id),
    }).sort({ uploadedAt: -1 });

    if (notes.length === 0) {
      return res.status(404).json({ error: 'No matching notes were found for this account.' });
    }

    const chatWithNotes = require('./ai-integration/chat-with-notes');
    const reply = await chatWithNotes({ notes, prompt });

    return res.status(200).json({
      reply,
      notesUsed: notes.map(note => ({
        id: String(note._id),
        title: note.title,
      })),
    });
  } catch (err) {
    const statusCode = Number(err.statusCode) || 500;
    return res.status(statusCode).json({ error: err.message || 'Unable to chat with notes.' });
  }
});

router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: String(req.user.id) });
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    res.download(note.filePath, note.filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:id
const fs = require('fs');
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: String(req.user.id) });
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    fs.unlink(note.filePath, err => {
      if (err) console.error('File deletion error:', err);
    });

    res.json({ message: 'Note deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
