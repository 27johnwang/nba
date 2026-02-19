import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create transaction (request to buy)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { listing_id, quantity, meeting_location, meeting_time } = req.body;

    // Get listing
    const listing = await db.prepare(`
      SELECT * FROM listings WHERE id = $1 AND status = 'active'
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

    await db.prepare(`
      INSERT INTO transactions (
        id, listing_id, buyer_id, seller_id, quantity, total_price,
        meeting_location, meeting_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `).run(
      transactionId,
      listing_id,
      req.user.id,
      listing.seller_id,
      quantity,
      totalPrice,
      meeting_location || null,
      meeting_time || null
    );

    // Unarchive any existing conversation with this seller (move from archives to active)
    await db.prepare(`
      DELETE FROM archived_conversations
      WHERE (user_id = $1 AND partner_id = $2) OR (user_id = $3 AND partner_id = $4)
    `).run(req.user.id, listing.seller_id, listing.seller_id, req.user.id);

    // Send an automatic message to start/continue the conversation
    const messageId = uuidv4();
    await db.prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, listing_id, content)
      VALUES ($1, $2, $3, $4, $5)
    `).run(
      messageId,
      req.user.id,
      listing.seller_id,
      listing_id,
      `Hi! I'd like to buy ${quantity} meal swipe${quantity > 1 ? 's' : ''} from your ${listing.dining_hall} listing.`
    );

    const transaction = await db.prepare(`
      SELECT t.*, l.title as listing_title, l.dining_hall,
             buyer.name as buyer_name, seller.name as seller_name
      FROM transactions t
      JOIN listings l ON t.listing_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE t.id = $1
    `).get(transactionId);

    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

// Get user's transactions (as buyer or seller)
router.get('/', authenticateToken, async (req, res) => {
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
    let paramIndex = 1;

    if (role === 'buyer') {
      query += ` AND t.buyer_id = $${paramIndex++}`;
      params.push(req.user.id);
    } else if (role === 'seller') {
      query += ` AND t.seller_id = $${paramIndex++}`;
      params.push(req.user.id);
    } else {
      query += ` AND (t.buyer_id = $${paramIndex++} OR t.seller_id = $${paramIndex++})`;
      params.push(req.user.id, req.user.id);
    }

    if (status) {
      query += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const transactions = await db.prepare(query).all(...params);

    // Add role flag and review status to each transaction
    const enrichedTransactions = await Promise.all(transactions.map(async (t) => {
      // Check if user has already reviewed this transaction
      const existingReview = await db.prepare(`
        SELECT id FROM reviews WHERE transaction_id = $1 AND reviewer_id = $2
      `).get(t.id, req.user.id);

      return {
        ...t,
        user_role: t.buyer_id === req.user.id ? 'buyer' : 'seller',
        has_reviewed: !!existingReview
      };
    }));

    res.json({ transactions: enrichedTransactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// Get transactions for a specific listing (for sellers to see pending buyers)
router.get('/listing/:listingId', authenticateToken, async (req, res) => {
  try {
    const { listingId } = req.params;

    // Verify the listing exists and user is the seller
    const listing = await db.prepare('SELECT * FROM listings WHERE id = $1').get(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view these transactions' });
    }

    const transactions = await db.prepare(`
      SELECT t.*,
             buyer.id as buyer_id, buyer.name as buyer_name, buyer.email as buyer_email,
             buyer.buyer_rating, buyer.buyer_reviews
      FROM transactions t
      JOIN users buyer ON t.buyer_id = buyer.id
      WHERE t.listing_id = $1
      ORDER BY
        CASE t.status
          WHEN 'confirmed' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'completed' THEN 3
          ELSE 4
        END,
        t.created_at ASC
    `).all(listingId);

    res.json({ transactions });
  } catch (error) {
    console.error('Get listing transactions error:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// Get single transaction
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await db.prepare(`
      SELECT t.*, l.title as listing_title, l.dining_hall, l.description,
             buyer.name as buyer_name, buyer.email as buyer_email, buyer.phone as buyer_phone,
             seller.name as seller_name, seller.email as seller_email, seller.phone as seller_phone,
             seller.venmo_handle as seller_venmo
      FROM transactions t
      JOIN listings l ON t.listing_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE t.id = $1
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
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const transaction = await db.prepare('SELECT * FROM transactions WHERE id = $1').get(req.params.id);

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
      return res.status(403).json({ error: 'Only seller can favorite a buyer' });
    }

    if (status === 'confirmed' && transaction.status === 'pending') {
      // Seller is favoriting this buyer - just update status, don't touch listing
      await db.prepare('UPDATE transactions SET status = $1 WHERE id = $2').run(status, req.params.id);
    } else if (status === 'completed') {
      // Complete the trade - now decrease listing quantity and mark sold if needed
      const listing = await db.prepare('SELECT * FROM listings WHERE id = $1').get(transaction.listing_id);
      if (listing) {
        const newQuantity = listing.quantity - transaction.quantity;
        if (newQuantity <= 0) {
          await db.prepare('UPDATE listings SET quantity = 0, status = $1 WHERE id = $2')
            .run('sold', listing.id);
        } else {
          await db.prepare('UPDATE listings SET quantity = $1 WHERE id = $2')
            .run(newQuantity, listing.id);
        }

        // Get all other pending/confirmed transactions for this listing before cancelling
        const otherTransactions = await db.prepare(`
          SELECT buyer_id FROM transactions
          WHERE listing_id = $1 AND id != $2 AND status IN ('pending', 'confirmed')
        `).all(listing.id, req.params.id);

        // Cancel all other pending/confirmed transactions for this listing
        await db.prepare(`
          UPDATE transactions
          SET status = 'cancelled'
          WHERE listing_id = $1 AND id != $2 AND status IN ('pending', 'confirmed')
        `).run(listing.id, req.params.id);

        // Archive the conversation with the completed buyer (for seller) - by partner only
        const existingArchive = await db.prepare(`
          SELECT id FROM archived_conversations WHERE user_id = $1 AND partner_id = $2
        `).get(transaction.seller_id, transaction.buyer_id);

        if (!existingArchive) {
          const archiveId = uuidv4();
          await db.prepare(`
            INSERT INTO archived_conversations (id, user_id, partner_id, listing_id)
            VALUES ($1, $2, $3, NULL)
          `).run(archiveId, transaction.seller_id, transaction.buyer_id);
        }

        // Archive the conversation for the buyer as well
        const existingBuyerArchive = await db.prepare(`
          SELECT id FROM archived_conversations WHERE user_id = $1 AND partner_id = $2
        `).get(transaction.buyer_id, transaction.seller_id);

        if (!existingBuyerArchive) {
          const buyerArchiveId = uuidv4();
          await db.prepare(`
            INSERT INTO archived_conversations (id, user_id, partner_id, listing_id)
            VALUES ($1, $2, $3, NULL)
          `).run(buyerArchiveId, transaction.buyer_id, transaction.seller_id);
        }

        // Archive conversations with rejected buyers (for seller)
        for (const tx of otherTransactions) {
          const existingRejectedArchive = await db.prepare(`
            SELECT id FROM archived_conversations WHERE user_id = $1 AND partner_id = $2
          `).get(transaction.seller_id, tx.buyer_id);

          if (!existingRejectedArchive) {
            const rejectedArchiveId = uuidv4();
            await db.prepare(`
              INSERT INTO archived_conversations (id, user_id, partner_id, listing_id)
              VALUES ($1, $2, $3, NULL)
            `).run(rejectedArchiveId, transaction.seller_id, tx.buyer_id);
          }
        }
      }
      await db.prepare(`
        UPDATE transactions
        SET status = $1, completed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `).run(status, req.params.id);
    } else if (status === 'cancelled') {
      // Cancel the transaction and archive the conversation
      await db.prepare('UPDATE transactions SET status = $1 WHERE id = $2').run(status, req.params.id);

      // Archive conversation with this buyer (for seller)
      const existingArchive = await db.prepare(`
        SELECT id FROM archived_conversations WHERE user_id = $1 AND partner_id = $2
      `).get(transaction.seller_id, transaction.buyer_id);

      if (!existingArchive) {
        const archiveId = uuidv4();
        await db.prepare(`
          INSERT INTO archived_conversations (id, user_id, partner_id, listing_id)
          VALUES ($1, $2, $3, NULL)
        `).run(archiveId, transaction.seller_id, transaction.buyer_id);
      }

      // Archive conversation for the buyer as well
      const existingBuyerArchive = await db.prepare(`
        SELECT id FROM archived_conversations WHERE user_id = $1 AND partner_id = $2
      `).get(transaction.buyer_id, transaction.seller_id);

      if (!existingBuyerArchive) {
        const buyerArchiveId = uuidv4();
        await db.prepare(`
          INSERT INTO archived_conversations (id, user_id, partner_id, listing_id)
          VALUES ($1, $2, $3, NULL)
        `).run(buyerArchiveId, transaction.buyer_id, transaction.seller_id);
      }
    } else {
      await db.prepare('UPDATE transactions SET status = $1 WHERE id = $2').run(status, req.params.id);
    }

    const updated = await db.prepare(`
      SELECT t.*, l.title as listing_title
      FROM transactions t
      JOIN listings l ON t.listing_id = l.id
      WHERE t.id = $1
    `).get(req.params.id);

    res.json({ message: 'Transaction updated', transaction: updated });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

export default router;
