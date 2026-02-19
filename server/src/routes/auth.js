import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';

const router = express.Router();

// Register new user
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { email, password, name, phone, venmo_handle } = req.body;

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const verificationToken = uuidv4();

    // Insert user
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, phone, venmo_handle, verification_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, email, hashedPassword, name, phone || null, venmo_handle || null, verificationToken);

    // Get created user
    const user = db.prepare('SELECT id, email, name, phone, venmo_handle, rating, seller_rating, seller_reviews, buyer_rating, buyer_reviews, created_at FROM users WHERE id = ?').get(userId);

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    // Remove password from response
    const { password: _, verification_token: __, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, phone, venmo_handle, profile_image,
             dining_hall_preference, rating, total_reviews,
             seller_rating, seller_reviews, buyer_rating, buyer_reviews,
             created_at, is_verified
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Get user by ID (public profile)
router.get('/user/:id', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, profile_image, seller_rating, seller_reviews,
             buyer_rating, buyer_reviews, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, venmo_handle, dining_hall_preference } = req.body;

    const stmt = db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          venmo_handle = COALESCE(?, venmo_handle),
          dining_hall_preference = COALESCE(?, dining_hall_preference),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, phone, venmo_handle, dining_hall_preference, req.user.id);

    const user = db.prepare(`
      SELECT id, email, name, phone, venmo_handle, profile_image,
             dining_hall_preference, rating, total_reviews,
             seller_rating, seller_reviews, buyer_rating, buyer_reviews,
             created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

export default router;
