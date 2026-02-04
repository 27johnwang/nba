import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { reviewValidation } from '../middleware/validation.js';

const router = express.Router();

// Create review for a completed transaction
router.post('/', authenticateToken, reviewValidation, (req, res) => {
  try {
    const { transaction_id, rating, comment } = req.body;

    // Get transaction
    const transaction = db.prepare(`
      SELECT * FROM transactions WHERE id = ? AND status = 'completed'
    `).get(transaction_id);

    if (!transaction) {
      return res.status(404).json({ error: 'Completed transaction not found' });
    }

    // Check if user is part of transaction
    const isBuyer = transaction.buyer_id === req.user.id;
    const isSeller = transaction.seller_id === req.user.id;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Not authorized to review this transaction' });
    }

    // Determine who is being reviewed
    const reviewed_user_id = isBuyer ? transaction.seller_id : transaction.buyer_id;

    // Check if already reviewed
    const existingReview = db.prepare(`
      SELECT id FROM reviews
      WHERE transaction_id = ? AND reviewer_id = ?
    `).get(transaction_id, req.user.id);

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this transaction' });
    }

    const reviewId = uuidv4();

    db.prepare(`
      INSERT INTO reviews (id, transaction_id, reviewer_id, reviewed_user_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(reviewId, transaction_id, req.user.id, reviewed_user_id, rating, comment || null);

    // Update user's average rating
    const ratingStats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total
      FROM reviews
      WHERE reviewed_user_id = ?
    `).get(reviewed_user_id);

    db.prepare(`
      UPDATE users
      SET rating = ?, total_reviews = ?
      WHERE id = ?
    `).run(ratingStats.avg_rating, ratingStats.total, reviewed_user_id);

    const review = db.prepare(`
      SELECT r.*, u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = ?
    `).get(reviewId);

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Error creating review' });
  }
});

// Get reviews for a user
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, t.id as transaction_id,
             l.title as listing_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN transactions t ON r.transaction_id = t.id
      JOIN listings l ON t.listing_id = l.id
      WHERE r.reviewed_user_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    const stats = db.prepare(`
      SELECT AVG(rating) as average, COUNT(*) as total,
             SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
             SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
             SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
             SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
             SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
      WHERE reviewed_user_id = ?
    `).get(userId);

    res.json({ reviews, stats });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

// Check if user can review a transaction
router.get('/can-review/:transactionId', authenticateToken, (req, res) => {
  try {
    const transaction = db.prepare(`
      SELECT * FROM transactions WHERE id = ? AND status = 'completed'
    `).get(req.params.transactionId);

    if (!transaction) {
      return res.json({ canReview: false, reason: 'Transaction not found or not completed' });
    }

    if (transaction.buyer_id !== req.user.id && transaction.seller_id !== req.user.id) {
      return res.json({ canReview: false, reason: 'Not part of this transaction' });
    }

    const existingReview = db.prepare(`
      SELECT id FROM reviews WHERE transaction_id = ? AND reviewer_id = ?
    `).get(req.params.transactionId, req.user.id);

    if (existingReview) {
      return res.json({ canReview: false, reason: 'Already reviewed' });
    }

    res.json({ canReview: true });
  } catch (error) {
    console.error('Can review check error:', error);
    res.status(500).json({ error: 'Error checking review status' });
  }
});

export default router;
