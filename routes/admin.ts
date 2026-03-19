import express from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import db from '../db.js';

const router = express.Router();

router.get('/stats', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const totalUsers = (db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`).get() as any).count;
    const totalAnalyses = (db.prepare(`SELECT COUNT(*) as count FROM documents`).get() as any).count;
    const textInputs = (db.prepare(`SELECT COUNT(*) as count FROM documents WHERE inputType = 'text'`).get() as any).count;
    const fileUploads = (db.prepare(`SELECT COUNT(*) as count FROM documents WHERE inputType = 'file'`).get() as any).count;
    const voiceInputs = (db.prepare(`SELECT COUNT(*) as count FROM documents WHERE inputType = 'voice'`).get() as any).count;

    res.json({
      totalUsers,
      totalAnalyses,
      textInputs,
      fileUploads,
      voiceInputs
    });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/users', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, medId, createdAt
      FROM users
      WHERE role = 'user'
      ORDER BY createdAt DESC
    `).all();
    res.json(users);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/user/:medId', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { medId } = req.params;

    const user = db.prepare(`
      SELECT id, name, email, medId, createdAt
      FROM users
      WHERE medId = ?
    `).get(medId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const documents = db.prepare(`
      SELECT id, inputType, fileUrl, createdAt
      FROM documents
      WHERE userId = ?
      ORDER BY createdAt DESC
    `).all(user.id);

    const stats = {
      total: documents.length,
      file: documents.filter((d: any) => d.inputType === 'file').length,
      text: documents.filter((d: any) => d.inputType === 'text').length,
      voice: documents.filter((d: any) => d.inputType === 'voice').length,
    };

    res.json({
      user,
      documents,
      stats
    });
  } catch (error) {
    console.error('Admin user fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

router.get('/document/:id', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const documentId = req.params.id;

    const document = db.prepare(`
      SELECT *
      FROM documents
      WHERE id = ?
    `).get(documentId) as any;

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      ...document,
      overview: JSON.parse(document.overview)
    });
  } catch (error) {
    console.error('Admin document fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

export default router;
