import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { messageValidation } from '../middleware/validation.js';

const router = express.Router();

// Send a message
router.post('/', authenticateToken, messageValidation, (req, res) => {
  try {
    const { receiver_id, content, listing_id } = req.body;

    if (receiver_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Verify receiver exists
    const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_id);
    if (!receiver) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Verify listing if provided
    if (listing_id) {
      const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(listing_id);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }
    }

    const messageId = uuidv4();

    db.prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, listing_id, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(messageId, req.user.id, receiver_id, listing_id || null, content);

    const message = db.prepare(`
      SELECT m.*, sender.name as sender_name, receiver.name as receiver_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.id = ?
    `).get(messageId);

    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
});

// Get conversations list (unique users)
router.get('/conversations', authenticateToken, (req, res) => {
  try {
    // Get unique conversations with last message
    const conversations = db.prepare(`
      WITH conversation_partners AS (
        SELECT DISTINCT
          CASE
            WHEN sender_id = ? THEN receiver_id
            ELSE sender_id
          END as partner_id,
          listing_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
      ),
      last_messages AS (
        SELECT
          cp.partner_id,
          cp.listing_id as conv_listing_id,
          m.id,
          m.content,
          m.created_at,
          m.is_read,
          m.sender_id,
          m.listing_id,
          ROW_NUMBER() OVER (PARTITION BY cp.partner_id, cp.listing_id ORDER BY m.created_at DESC) as rn
        FROM conversation_partners cp
        JOIN messages m ON
          ((m.sender_id = ? AND m.receiver_id = cp.partner_id) OR
          (m.receiver_id = ? AND m.sender_id = cp.partner_id))
          AND (m.listing_id = cp.listing_id OR (m.listing_id IS NULL AND cp.listing_id IS NULL))
      )
      SELECT
        lm.partner_id,
        u.name as partner_name,
        u.profile_image as partner_image,
        u.seller_rating as partner_seller_rating,
        u.seller_reviews as partner_seller_reviews,
        u.buyer_rating as partner_buyer_rating,
        u.buyer_reviews as partner_buyer_reviews,
        lm.content as last_message,
        lm.created_at as last_message_at,
        lm.sender_id as last_message_sender_id,
        lm.listing_id,
        l.title as listing_title,
        l.dining_hall as listing_dining_hall,
        l.price as listing_price,
        l.seller_id as listing_seller_id,
        (
          SELECT COUNT(*)
          FROM messages
          WHERE sender_id = lm.partner_id
            AND receiver_id = ?
            AND is_read = 0
        ) as unread_count,
        ac.archived_at as is_archived
      FROM last_messages lm
      JOIN users u ON lm.partner_id = u.id
      LEFT JOIN listings l ON lm.listing_id = l.id
      LEFT JOIN archived_conversations ac ON (
        ac.user_id = ? AND ac.partner_id = lm.partner_id AND
        (ac.listing_id = lm.listing_id OR (ac.listing_id IS NULL AND lm.listing_id IS NULL))
      )
      WHERE lm.rn = 1
      ORDER BY
        CASE WHEN ac.archived_at IS NOT NULL THEN 0 ELSE 1 END,
        ac.archived_at DESC,
        lm.created_at DESC
    `).all(
      req.user.id, req.user.id, req.user.id,
      req.user.id, req.user.id, req.user.id,
      req.user.id
    );

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Error fetching conversations' });
  }
});

// Get messages with a specific user
router.get('/with/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;
    const { listing_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT m.*, sender.name as sender_name, receiver.name as receiver_name,
             l.title as listing_title, l.dining_hall as listing_dining_hall, l.price as listing_price
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      LEFT JOIN listings l ON m.listing_id = l.id
      WHERE (
        (m.sender_id = ? AND m.receiver_id = ?) OR
        (m.sender_id = ? AND m.receiver_id = ?)
      )
    `;
    const params = [req.user.id, userId, userId, req.user.id];

    if (listing_id) {
      query += ' AND m.listing_id = ?';
      params.push(listing_id);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const messages = db.prepare(query).all(...params);

    // Mark messages as read
    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(userId, req.user.id);

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, (req, res) => {
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = ? AND is_read = 0
    `).get(req.user.id);

    res.json({ unreadCount: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Error fetching unread count' });
  }
});

// Mark messages as read
router.put('/read/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;

    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(userId, req.user.id);

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Error marking messages as read' });
  }
});

// Archive a conversation
router.post('/archive', authenticateToken, (req, res) => {
  try {
    const { partner_id, listing_id } = req.body;

    if (!partner_id) {
      return res.status(400).json({ error: 'Partner ID is required' });
    }

    // Check if already archived
    const existing = db.prepare(`
      SELECT id FROM archived_conversations
      WHERE user_id = ? AND partner_id = ? AND (listing_id = ? OR (listing_id IS NULL AND ? IS NULL))
    `).get(req.user.id, partner_id, listing_id || null, listing_id || null);

    if (existing) {
      return res.json({ message: 'Conversation already archived' });
    }

    const archiveId = uuidv4();
    db.prepare(`
      INSERT INTO archived_conversations (id, user_id, partner_id, listing_id)
      VALUES (?, ?, ?, ?)
    `).run(archiveId, req.user.id, partner_id, listing_id || null);

    res.json({ message: 'Conversation archived' });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ error: 'Error archiving conversation' });
  }
});

// Unarchive a conversation
router.delete('/archive/:partnerId', authenticateToken, (req, res) => {
  try {
    const { partnerId } = req.params;
    const { listing_id } = req.query;

    db.prepare(`
      DELETE FROM archived_conversations
      WHERE user_id = ? AND partner_id = ? AND (listing_id = ? OR (listing_id IS NULL AND ? IS NULL))
    `).run(req.user.id, partnerId, listing_id || null, listing_id || null);

    res.json({ message: 'Conversation unarchived' });
  } catch (error) {
    console.error('Unarchive conversation error:', error);
    res.status(500).json({ error: 'Error unarchiving conversation' });
  }
});

export default router;
