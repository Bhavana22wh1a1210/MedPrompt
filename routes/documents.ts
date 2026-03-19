import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import db from '../db.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/save', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { inputType, text, language, overview, summary, file, fileName, mimeType } = req.body;
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let extractedText = text ? decodeURIComponent(Buffer.from(text, 'base64').toString('utf-8')) : '';
    let fileUrl = null;

    if (inputType === 'file' && file) {
      const buffer = Buffer.from(file, 'base64');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = fileName ? path.extname(fileName) : '.bin';
      const savedFileName = 'file-' + uniqueSuffix + ext;
      fs.writeFileSync(path.join(process.cwd(), 'uploads', savedFileName), buffer);
      fileUrl = `/uploads/${savedFileName}`;
      extractedText = 'Extracted from image';
    }

    if (!extractedText && inputType === 'text') {
      return res.status(400).json({ error: 'No text provided' });
    }

    const decodedOverview = decodeURIComponent(Buffer.from(overview, 'base64').toString('utf-8'));
    const decodedSummary = decodeURIComponent(Buffer.from(summary, 'base64').toString('utf-8'));

    // Store in DB
    const stmt = db.prepare(`
      INSERT INTO documents (userId, inputType, fileUrl, extractedText, overview, summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      userId,
      inputType,
      fileUrl,
      extractedText,
      decodedOverview,
      decodedSummary
    );

    res.json({
      id: info.lastInsertRowid,
      overview: JSON.parse(decodedOverview),
      summary: decodedSummary,
      fileUrl,
      extractedText
    });
  } catch (error: any) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message || 'Failed to save document' });
  }
});

router.get('/history', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const documents = db.prepare(`
      SELECT id, inputType, fileUrl, createdAt
      FROM documents
      WHERE userId = ?
      ORDER BY createdAt DESC
    `).all(userId);

    res.json(documents);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const documentId = req.params.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const document = db.prepare(`
      SELECT *
      FROM documents
      WHERE id = ? AND userId = ?
    `).get(documentId, userId) as any;

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      ...document,
      overview: JSON.parse(document.overview)
    });
  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

export default router;
