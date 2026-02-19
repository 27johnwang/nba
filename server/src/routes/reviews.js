import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { reviewValidation } from '../middleware/validation.js';

const router = express.Router();

// Create review for a completed transaction
router.post('/', authenticateToken, reviewValidation, async (req, res) => {
  try {
    const { transaction_id, rating, comment } = req.body;

    // Get transaction
    const transaction = await db.prepare(`
      SELECT * FROM transactions WHERE id = $1 AND status = 'completed'
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

    // Determine who is being reviewed and what type of review
    const reviewed_user_id = isBuyer ? transaction.seller_id : transaction.buyer_id;
    const review_type = isBuyer ? 'seller' : 'buyer';

    // Check if already reviewed
    const existingReview = await db.prepare(`
      SELECT id FROM reviews
      WHERE transaction_id = $1 AND reviewer_id = $2
    `).get(transaction_id, req.user.id);

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this transaction' });
    }

    const reviewId = uuidv4();

    await db.prepare(`
      INSERT INTO reviews (id, transaction_id, reviewer_id, reviewed_user_id, review_type, rating, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `).run(reviewId, transaction_id, req.user.id, reviewed_user_id, review_type, rating, comment || null);

    // Update user's role-specific rating
    const ratingStats = await db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total
      FROM reviews
      WHERE reviewed_user_id = $1 AND review_type = $2
    `).get(reviewed_user_id, review_type);

    if (review_type === 'seller') {
      await db.prepare(`
        UPDATE users
        SET seller_rating = $1, seller_reviews = $2
        WHERE id = $3
      `).run(ratingStats.avg_rating || 0, ratingStats.total || 0, reviewed_user_id);
    } else {
      await db.prepare(`
        UPDATE users
        SET buyer_rating = $1, buyer_reviews = $2
        WHERE id = $3
      `).run(ratingStats.avg_rating || 0, ratingStats.total || 0, reviewed_user_id);
    }

    // Also update overall rating
    const overallStats = await db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total
      FROM reviews
      WHERE reviewed_user_id = $1
    `).get(reviewed_user_id);

    await db.prepare(`
      UPDATE users
      SET rating = $1, total_reviews = $2
      WHERE id = $3
    `).run(overallStats.avg_rating || 0, overallStats.total || 0, reviewed_user_id);

    const review = await db.prepare(`
      SELECT r.*, u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = $1
    `).get(reviewId);

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Error creating review' });
  }
});

// Get reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await db.prepare(`
      SELECT r.*, u.name as reviewer_name, t.id as transaction_id,
             l.title as listing_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN transactions t ON r.transaction_id = t.id
      JOIN listings l ON t.listing_id = l.id
      WHERE r.reviewed_user_id = $1
      ORDER BY r.created_at DESC
    `).all(userId);

    const stats = await db.prepare(`
      SELECT AVG(rating) as average, COUNT(*) as total,
             SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
             SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
             SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
             SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
             SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
      WHERE reviewed_user_id = $1
    `).get(userId);

    res.json({ reviews, stats });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

// Check if user can review a transaction
router.get('/can-review/:transactionId', authenticateToken, async (req, res) => {
  try {
    const transaction = await db.prepare(`
      SELECT * FROM transactions WHERE id = $1 AND status = 'completed'
    `).get(req.params.transactionId);

    if (!transaction) {
      return res.json({ canReview: false, reason: 'Transaction not found or not completed' });
    }

    if (transaction.buyer_id !== req.user.id && transaction.seller_id !== req.user.id) {
      return res.json({ canReview: false, reason: 'Not part of this transaction' });
    }

    const existingReview = await db.prepare(`
      SELECT id FROM reviews WHERE transaction_id = $1 AND reviewer_id = $2
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
