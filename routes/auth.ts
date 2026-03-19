import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const ADMIN_EMAIL = 'snehat2277@gmail.com';

function generateMedId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let id = '';
  for (let i = 0; i < 3; i++) id += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) id += digits.charAt(Math.floor(Math.random() * digits.length));
  return id;
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let medId = generateMedId();
    
    // Ensure unique MedID
    while (db.prepare('SELECT * FROM users WHERE medId = ?').get(medId)) {
      medId = generateMedId();
    }

    const role = normalizedEmail === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

    const stmt = db.prepare('INSERT INTO users (medId, name, email, password, role) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(medId, name, normalizedEmail, hashedPassword, role);

    const token = jwt.sign({ id: info.lastInsertRowid, medId, role, email: normalizedEmail }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ token, user: { id: info.lastInsertRowid, medId, name, email: normalizedEmail, role } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials (User not found)' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials (Incorrect password)' });
    }

    const token = jwt.sign({ id: user.id, medId: user.medId, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { id: user.id, medId: user.medId, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
