import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = express.Router();

// Register new user (Step 1: Create unverified account and send code)
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { email, password, name, phone, venmo_handle } = req.body;

    // Validate NYU email
    if (!email.endsWith('@nyu.edu')) {
      return res.status(400).json({ error: 'Must use an NYU email address (@nyu.edu)' });
    }

    // Check if user already exists
    const existingUser = await db.prepare('SELECT id, is_verified FROM users WHERE email = $1').get(email);

    if (existingUser && existingUser.is_verified === 1) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser && existingUser.is_verified === 0) {
      // Update existing unverified user
      await db.prepare(`
        UPDATE users
        SET password = $1, name = $2, phone = $3, venmo_handle = $4,
            verification_code = $5, verification_code_expires = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `).run(hashedPassword, name, phone || null, venmo_handle || null, verificationCode, codeExpires, existingUser.id);
    } else {
      // Create new user
      const userId = uuidv4();
      await db.prepare(`
        INSERT INTO users (id, email, password, name, phone, venmo_handle, verification_code, verification_code_expires, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
      `).run(userId, email, hashedPassword, name, phone || null, venmo_handle || null, verificationCode, codeExpires);
    }

    // Send verification email
    await sendVerificationEmail(email, verificationCode, name);

    res.status(201).json({
      message: 'Verification code sent to your email',
      email: email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Verify email with code (Step 2: Verify and complete registration)
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await db.prepare(`
      SELECT * FROM users WHERE email = $1 AND is_verified = 0
    `).get(email);

    if (!user) {
      return res.status(404).json({ error: 'User not found or already verified' });
    }

    // Check if code matches and hasn't expired
    if (user.verification_code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date(user.verification_code_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please register again.' });
    }

    // Verify the user
    await db.prepare(`
      UPDATE users
      SET is_verified = 1, verification_code = NULL, verification_code_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `).run(user.id);

    // Generate token and return user
    const token = generateToken(user);

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        venmo_handle: user.venmo_handle,
        rating: user.rating,
        seller_rating: user.seller_rating,
        seller_reviews: user.seller_reviews,
        buyer_rating: user.buyer_rating,
        buyer_reviews: user.buyer_reviews,
        created_at: user.created_at,
        is_verified: 1
      },
      token
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Error verifying email' });
  }
});

// Resend verification code
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await db.prepare(`
      SELECT * FROM users WHERE email = $1 AND is_verified = 0
    `).get(email);

    if (!user) {
      return res.status(404).json({ error: 'User not found or already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await db.prepare(`
      UPDATE users
      SET verification_code = $1, verification_code_expires = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `).run(verificationCode, codeExpires, user.id);

    // Send verification email
    await sendVerificationEmail(email, verificationCode, user.name);

    res.json({ message: 'Verification code resent to your email' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Error resending verification code' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.prepare('SELECT * FROM users WHERE email = $1').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if verified
    if (user.is_verified !== 1) {
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email: email
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    // Remove sensitive fields from response
    const { password: _, verification_code: __, password_reset_code: ___, ...userWithoutSensitive } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutSensitive,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await db.prepare('SELECT * FROM users WHERE email = $1').get(email);

    // Don't reveal if user exists or not
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await db.prepare(`
      UPDATE users
      SET password_reset_code = $1, password_reset_expires = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `).run(resetCode, codeExpires, user.id);

    // Send reset email
    await sendPasswordResetEmail(email, resetCode, user.name);

    res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const user = await db.prepare(`
      SELECT * FROM users WHERE email = $1 AND password_reset_code = $2
    `).get(email, code);

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (new Date(user.password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    res.json({ message: 'Code verified', valid: true });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Error verifying code' });
  }
});

// Reset password with code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await db.prepare(`
      SELECT * FROM users WHERE email = $1 AND password_reset_code = $2
    `).get(email, code);

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (new Date(user.password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.prepare(`
      UPDATE users
      SET password = $1, password_reset_code = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `).run(hashedPassword, user.id);

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.prepare(`
      SELECT id, email, name, phone, venmo_handle, profile_image,
             dining_hall_preference, rating, total_reviews,
             seller_rating, seller_reviews, buyer_rating, buyer_reviews,
             created_at, is_verified
      FROM users WHERE id = $1
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
router.get('/user/:id', authenticateToken, async (req, res) => {
  try {
    const user = await db.prepare(`
      SELECT id, name, profile_image, seller_rating, seller_reviews,
             buyer_rating, buyer_reviews, created_at
      FROM users WHERE id = $1
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

    await db.prepare(`
      UPDATE users
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          venmo_handle = COALESCE($3, venmo_handle),
          dining_hall_preference = COALESCE($4, dining_hall_preference),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `).run(name, phone, venmo_handle, dining_hall_preference, req.user.id);

    const user = await db.prepare(`
      SELECT id, email, name, phone, venmo_handle, profile_image,
             dining_hall_preference, rating, total_reviews,
             seller_rating, seller_reviews, buyer_rating, buyer_reviews,
             created_at
      FROM users WHERE id = $1
    `).get(req.user.id);

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Change password (when logged in)
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await db.prepare('SELECT password FROM users WHERE id = $1').get(req.user.id);

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.prepare('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2')
      .run(hashedPassword, req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Verify password
    const user = await db.prepare('SELECT password FROM users WHERE id = $1').get(req.user.id);
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Check for active listings
    const activeListings = await db.prepare(`
      SELECT COUNT(*) as count FROM listings WHERE seller_id = $1 AND status = 'active'
    `).get(req.user.id);

    if (parseInt(activeListings.count) > 0) {
      return res.status(400).json({
        error: 'Please delete or deactivate all active listings before deleting your account'
      });
    }

    // Check for pending transactions
    const pendingTransactions = await db.prepare(`
      SELECT COUNT(*) as count FROM transactions
      WHERE (buyer_id = $1 OR seller_id = $2) AND status IN ('pending', 'confirmed')
    `).get(req.user.id, req.user.id);

    if (parseInt(pendingTransactions.count) > 0) {
      return res.status(400).json({
        error: 'Please complete or cancel all pending transactions before deleting your account'
      });
    }

    // Soft delete: anonymize user data instead of hard delete to preserve transaction history
    const anonymousEmail = `deleted_${req.user.id}@deleted.com`;
    await db.prepare(`
      UPDATE users
      SET email = $1,
          password = 'DELETED',
          name = 'Deleted User',
          phone = NULL,
          venmo_handle = NULL,
          profile_image = NULL,
          is_verified = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `).run(anonymousEmail, req.user.id);

    // Delete archived conversations
    await db.prepare('DELETE FROM archived_conversations WHERE user_id = $1 OR partner_id = $2')
      .run(req.user.id, req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

export default router;
