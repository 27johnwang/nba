import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db/index.js';

const seedData = async () => {
  console.log('Seeding database...');

  // Create test users
  const users = [
    {
      id: uuidv4(),
      email: 'alice@nyu.edu',
      password: await bcrypt.hash('password123', 10),
      name: 'Alice Chen',
      phone: '212-555-0101',
      venmo_handle: '@alice-chen',
      dining_hall_preference: 'Lipton Dining Hall',
      is_verified: 1
    },
    {
      id: uuidv4(),
      email: 'bob@nyu.edu',
      password: await bcrypt.hash('password123', 10),
      name: 'Bob Smith',
      phone: '212-555-0102',
      venmo_handle: '@bob-smith',
      dining_hall_preference: 'Palladium Dining Hall',
      is_verified: 1
    },
    {
      id: uuidv4(),
      email: 'charlie@nyu.edu',
      password: await bcrypt.hash('password123', 10),
      name: 'Charlie Davis',
      phone: '212-555-0103',
      venmo_handle: '@charlie-d',
      dining_hall_preference: 'Weinstein Passport Dining',
      is_verified: 1
    }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password, name, phone, venmo_handle, dining_hall_preference, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    insertUser.run(
      user.id, user.email, user.password, user.name,
      user.phone, user.venmo_handle, user.dining_hall_preference, user.is_verified
    );
  }

  console.log('Created test users');

  // Create test listings
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const listings = [
    {
      id: uuidv4(),
      seller_id: users[0].id,
      title: '2 Meal Swipes at Lipton',
      description: 'Have 2 extra meal swipes. Happy to meet at Lipton anytime between 5-8pm.',
      price: 8.00,
      quantity: 2,
      dining_hall: 'Lipton Dining Hall',
      available_date: formatDate(today),
      available_time_start: '17:00',
      available_time_end: '20:00'
    },
    {
      id: uuidv4(),
      seller_id: users[0].id,
      title: 'Breakfast Swipe Available',
      description: 'Extra breakfast swipe. Can meet early morning.',
      price: 6.00,
      quantity: 1,
      dining_hall: 'Palladium Dining Hall',
      available_date: formatDate(tomorrow),
      available_time_start: '08:00',
      available_time_end: '10:00'
    },
    {
      id: uuidv4(),
      seller_id: users[1].id,
      title: '3 Swipes at Weinstein',
      description: 'Have 3 swipes expiring soon. Great for lunch!',
      price: 7.50,
      quantity: 3,
      dining_hall: 'Weinstein Passport Dining',
      available_date: formatDate(today),
      available_time_start: '11:00',
      available_time_end: '14:00'
    },
    {
      id: uuidv4(),
      seller_id: users[1].id,
      title: 'Dinner Swipe - Third North',
      description: 'One dinner swipe at Third North. Flexible timing.',
      price: 9.00,
      quantity: 1,
      dining_hall: 'Third North Dining',
      available_date: formatDate(dayAfter),
      available_time_start: '17:00',
      available_time_end: '21:00'
    },
    {
      id: uuidv4(),
      seller_id: users[2].id,
      title: 'Multiple Swipes Available!',
      description: 'Have 5 swipes to sell. Buy as many as you need. Price per swipe.',
      price: 7.00,
      quantity: 5,
      dining_hall: 'Kimmel Marketplace',
      available_date: formatDate(today),
      available_time_start: '12:00',
      available_time_end: '22:00'
    }
  ];

  const insertListing = db.prepare(`
    INSERT OR IGNORE INTO listings (
      id, seller_id, title, description, price, quantity,
      dining_hall, available_date, available_time_start, available_time_end
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const listing of listings) {
    insertListing.run(
      listing.id, listing.seller_id, listing.title, listing.description,
      listing.price, listing.quantity, listing.dining_hall, listing.available_date,
      listing.available_time_start, listing.available_time_end
    );
  }

  console.log('Created test listings');
  console.log('Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log('  Email: alice@nyu.edu, Password: password123');
  console.log('  Email: bob@nyu.edu, Password: password123');
  console.log('  Email: charlie@nyu.edu, Password: password123');
};

seedData().catch(console.error);
