# NYU Mealswipe Marketplace

A peer-to-peer marketplace for NYU students to buy and sell unused meal swipes.

## Features

- **User Authentication**: Sign up with your NYU email (@nyu.edu) to verify student status
- **Browse Listings**: Search and filter meal swipe listings by dining hall, date, and price
- **Create Listings**: List your unused meal swipes for sale
- **Messaging**: Built-in messaging to coordinate with buyers/sellers
- **Transactions**: Track your buying and selling history
- **Reviews & Ratings**: Build trust with the community through ratings

## Tech Stack

### Backend
- Node.js with Express.js
- SQLite with better-sqlite3
- JWT authentication
- express-validator for input validation

### Frontend
- React 18 with Vite
- React Router for navigation
- TailwindCSS for styling
- Axios for API calls
- Lucide React for icons

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd nba
```

2. Install all dependencies
```bash
npm run install-all
```

3. Set up environment variables
```bash
cp server/.env.example server/.env
```

4. Seed the database with test data (optional)
```bash
cd server && npm run seed
```

5. Start the development servers
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Test Credentials

After running the seed script, you can log in with:
- Email: `alice@nyu.edu`, Password: `password123`
- Email: `bob@nyu.edu`, Password: `password123`
- Email: `charlie@nyu.edu`, Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Listings
- `GET /api/listings` - Browse all listings
- `GET /api/listings/:id` - Get single listing
- `POST /api/listings` - Create listing (auth required)
- `PUT /api/listings/:id` - Update listing (auth required)
- `DELETE /api/listings/:id` - Delete listing (auth required)
- `GET /api/listings/user/me` - Get user's listings (auth required)

### Transactions
- `GET /api/transactions` - Get user's transactions (auth required)
- `POST /api/transactions` - Create transaction (auth required)
- `PUT /api/transactions/:id/status` - Update status (auth required)

### Messages
- `GET /api/messages/conversations` - Get conversations (auth required)
- `GET /api/messages/with/:userId` - Get messages with user (auth required)
- `POST /api/messages` - Send message (auth required)

### Reviews
- `POST /api/reviews` - Create review (auth required)
- `GET /api/reviews/user/:userId` - Get user reviews

## Project Structure

```
nba/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context (Auth)
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utilities (API client)
│   └── public/
├── server/                 # Express backend
│   ├── src/
│   │   ├── db/             # Database setup
│   │   ├── middleware/     # Auth & validation
│   │   └── routes/         # API routes
│   └── data/               # SQLite database
└── package.json            # Root package.json
```

## Supported Dining Halls

- Lipton Dining Hall
- Weinstein Passport Dining
- Palladium Dining Hall
- Third North Dining
- Kimmel Marketplace
- Jasper Kane (Brooklyn)

## License

MIT
