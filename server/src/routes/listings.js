import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { listingValidation } from '../middleware/validation.js';

const router = express.Router();

// NYU Dining Halls
const DINING_HALLS = [
  'Lipton Dining Hall',
  'Weinstein Passport Dining',
  'Palladium Dining Hall',
  'Third North Dining',
  'Kimmel Marketplace',
  'Jasper Kane (Brooklyn)',
  'Other'
];

// Get dining halls list
router.get('/dining-halls', (req, res) => {
  res.json({ diningHalls: DINING_HALLS });
});

// Get all active listings
router.get('/', optionalAuth, (req, res) => {
  try {
    const { dining_hall, date, min_price, max_price, sort } = req.query;

    let query = `
      SELECT l.*, u.name as seller_name, u.rating as seller_rating, u.total_reviews as seller_reviews
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      WHERE l.status = 'active'
        AND l.available_date >= date('now')
        AND l.quantity > 0
    `;
    const params = [];

    if (dining_hall) {
      query += ' AND l.dining_hall = ?';
      params.push(dining_hall);
    }

    if (date) {
      query += ' AND l.available_date = ?';
      params.push(date);
    }

    if (min_price) {
      query += ' AND l.price >= ?';
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      query += ' AND l.price <= ?';
      params.push(parseFloat(max_price));
    }

    // Exclude current user's own listings if authenticated
    if (req.user) {
      query += ' AND l.seller_id != ?';
      params.push(req.user.id);
    }

    // Sorting
    switch (sort) {
      case 'price_low':
        query += ' ORDER BY l.price ASC';
        break;
      case 'price_high':
        query += ' ORDER BY l.price DESC';
        break;
      case 'date':
        query += ' ORDER BY l.available_date ASC';
        break;
      default:
        query += ' ORDER BY l.created_at DESC';
    }

    const listings = db.prepare(query).all(...params);

    res.json({ listings });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Error fetching listings' });
  }
});

// Get single listing
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const listing = db.prepare(`
      SELECT l.*, u.name as seller_name, u.rating as seller_rating,
             u.total_reviews as seller_reviews, u.venmo_handle as seller_venmo,
             u.phone as seller_phone
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Only show contact info if not own listing
    if (req.user && listing.seller_id === req.user.id) {
      listing.is_owner = true;
    } else {
      // Hide contact info from non-authenticated or for privacy
      delete listing.seller_phone;
      listing.is_owner = false;
    }

    res.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Error fetching listing' });
  }
});

// Create new listing
router.post('/', authenticateToken, listingValidation, (req, res) => {
  try {
    const {
      title,
      description,
      price,
      quantity,
      dining_hall,
      available_date,
      available_time_start,
      available_time_end
    } = req.body;

    const listingId = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO listings (
        id, seller_id, title, description, price, quantity,
        dining_hall, available_date, available_time_start, available_time_end
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      listingId,
      req.user.id,
      title,
      description || null,
      price,
      quantity,
      dining_hall,
      available_date,
      available_time_start || null,
      available_time_end || null
    );

    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);

    res.status(201).json({ message: 'Listing created', listing });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Error creating listing' });
  }
});

// Update listing
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const {
      title,
      description,
      price,
      quantity,
      dining_hall,
      available_date,
      available_time_start,
      available_time_end,
      status
    } = req.body;

    const stmt = db.prepare(`
      UPDATE listings
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          quantity = COALESCE(?, quantity),
          dining_hall = COALESCE(?, dining_hall),
          available_date = COALESCE(?, available_date),
          available_time_start = COALESCE(?, available_time_start),
          available_time_end = COALESCE(?, available_time_end),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      title,
      description,
      price,
      quantity,
      dining_hall,
      available_date,
      available_time_start,
      available_time_end,
      status,
      req.params.id
    );

    const updatedListing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);

    res.json({ message: 'Listing updated', listing: updatedListing });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Error updating listing' });
  }
});

// Delete listing
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    // Soft delete by setting status to deleted
    db.prepare('UPDATE listings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('deleted', req.params.id);

    res.json({ message: 'Listing deleted' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Error deleting listing' });
  }
});

// Get user's own listings
router.get('/user/me', authenticateToken, (req, res) => {
  try {
    const listings = db.prepare(`
      SELECT * FROM listings
      WHERE seller_id = ? AND status != 'deleted'
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ listings });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ error: 'Error fetching listings' });
  }
});

export default router;
