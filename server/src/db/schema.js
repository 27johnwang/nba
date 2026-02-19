// Database schema for NYU Mealswipe Marketplace (PostgreSQL)

export const createTables = async (pool) => {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        venmo_handle TEXT,
        profile_image TEXT,
        dining_hall_preference TEXT,
        rating REAL DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        seller_rating REAL DEFAULT 0,
        seller_reviews INTEGER DEFAULT 0,
        buyer_rating REAL DEFAULT 0,
        buyer_reviews INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_verified INTEGER DEFAULT 0,
        verification_token TEXT
      )
    `);

    // Listings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        dining_hall TEXT NOT NULL,
        available_date DATE NOT NULL,
        available_time_start TEXT,
        available_time_end TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL REFERENCES listings(id),
        buyer_id TEXT NOT NULL REFERENCES users(id),
        seller_id TEXT NOT NULL REFERENCES users(id),
        quantity INTEGER NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        meeting_location TEXT,
        meeting_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL REFERENCES users(id),
        receiver_id TEXT NOT NULL REFERENCES users(id),
        listing_id TEXT REFERENCES listings(id),
        content TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL REFERENCES transactions(id),
        reviewer_id TEXT NOT NULL REFERENCES users(id),
        reviewed_user_id TEXT NOT NULL REFERENCES users(id),
        review_type TEXT NOT NULL DEFAULT 'seller',
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Archived conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS archived_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        partner_id TEXT NOT NULL REFERENCES users(id),
        listing_id TEXT REFERENCES listings(id),
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
      CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
      CREATE INDEX IF NOT EXISTS idx_listings_date ON listings(available_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
    `);

    console.log('Database tables created successfully');
  } finally {
    client.release();
  }
};
