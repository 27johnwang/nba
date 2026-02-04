import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create transaction (request to buy)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { listing_id, quantity, meeting_location, meeting_time } = req.body;

    // Get listing
    const listing = db.prepare(`
      SELECT * FROM listings WHERE id = ? AND status = 'active'
    `).get(listing_id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found or not available' });
    }

    if (listing.seller_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot buy your own listing' });
    }

    if (quantity > listing.quantity) {
      return res.status(400).json({ error: 'Requested quantity exceeds available' });
    }

    const transactionId = uuidv4();
    const totalPrice = listing.price * quantity;

    const stmt = db.prepare(`
      INSERT INTO transactions (
        id, listing_id, buyer_id, seller_id, quantity, total_price,
        meeting_location, meeting_time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      transactionId,
      listing_id,
      req.user.id,
      listing.seller_id,
      quantity,
      totalPrice,
      meeting_location || null,
      meeting_time || null
    );

    // Update listing quantity
    const newQuantity = listing.quantity - quantity;
    if (newQuantity === 0) {
      db.prepare('UPDATE listings SET quantity = 0, status = ? WHERE id = ?')
        .run('sold', listing_id);
    } else {
      db.prepare('UPDATE listings SET quantity = ? WHERE id = ?')
        .run(newQuantity, listing_id);
    }

    const transaction = db.prepare(`
      SELECT t.*, l.title as listing_title, l.dining_hall,
             buyer.name as buyer_name, seller.name as seller_name
      FROM transactions t
      JOIN listings l ON t.listing_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE t.id = ?
    `).get(transactionId);

    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

// Get user's transactions (as buyer or seller)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { role, status } = req.query;

    let query = `
      SELECT t.*, l.title as listing_title, l.dining_hall, l.price as unit_price,
             buyer.name as buyer_name, buyer.email as buyer_email,
             seller.name as seller_name, seller.email as seller_email,
             seller.venmo_handle as seller_venmo
      FROM transactions t
      JOIN listings l ON t.listing_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'buyer') {
      query += ' AND t.buyer_id = ?';
      params.push(req.user.id);
    } else if (role === 'seller') {
      query += ' AND t.seller_id = ?';
      params.push(req.user.id);
    } else {
      query += ' AND (t.buyer_id = ? OR t.seller_id = ?)';
      params.push(req.user.id, req.user.id);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const transactions = db.prepare(query).all(...params);

    // Add role flag to each transaction
    const enrichedTransactions = transactions.map(t => ({
      ...t,
      user_role: t.buyer_id === req.user.id ? 'buyer' : 'seller'
    }));

    res.json({ transactions: enrichedTransactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// Get single transaction
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const transaction = db.prepare(`
      SELECT t.*, l.title as listing_title, l.dining_hall, l.description,
             buyer.name as buyer_name, buyer.email as buyer_email, buyer.phone as buyer_phone,
             seller.name as seller_name, seller.email as seller_email, seller.phone as seller_phone,
             seller.venmo_handle as seller_venmo
      FROM transactions t
      JOIN listings l ON t.listing_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only buyer or seller can view
    if (transaction.buyer_id !== req.user.id && transaction.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this transaction' });
    }

    transaction.user_role = transaction.buyer_id === req.user.id ? 'buyer' : 'seller';

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Error fetching transaction' });
  }
});

// Update transaction status
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check authorization
    const isBuyer = transaction.buyer_id === req.user.id;
    const isSeller = transaction.seller_id === req.user.id;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Not authorized to update this transaction' });
    }

    // Status transition rules
    if (status === 'confirmed' && !isSeller) {
      return res.status(403).json({ error: 'Only seller can confirm transaction' });
    }

    if (status === 'completed') {
      // Both parties can mark as completed
      db.prepare(`
        UPDATE transactions
        SET status = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, req.params.id);
    } else if (status === 'cancelled') {
      // Restore listing quantity on cancellation
      if (transaction.status !== 'completed') {
        const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(transaction.listing_id);
        if (listing) {
          const newQuantity = listing.quantity + transaction.quantity;
          db.prepare('UPDATE listings SET quantity = ?, status = ? WHERE id = ?')
            .run(newQuantity, 'active', listing.id);
        }
      }
      db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run(status, req.params.id);
    } else {
      db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run(status, req.params.id);
    }

    const updated = db.prepare(`
      SELECT t.*, l.title as listing_title
      FROM transactions t
      JOIN listings l ON t.listing_id = l.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json({ message: 'Transaction updated', transaction: updated });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

export default router;
