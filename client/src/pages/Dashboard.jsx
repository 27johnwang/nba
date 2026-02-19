import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { format } from 'date-fns'
import {
  PlusCircle,
  List,
  ArrowLeftRight,
  MessageSquare,
  Star,
  TrendingUp,
  Calendar
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    unreadMessages: 0,
    pendingReviews: 0
  })
  const [recentListings, setRecentListings] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [listingsRes, transactionsRes, messagesRes] = await Promise.all([
        api.get('/listings/user/me'),
        api.get('/transactions'),
        api.get('/messages/unread-count')
      ])

      const listings = listingsRes.data.listings
      const transactions = transactionsRes.data.transactions

      // Check when user last visited transactions page
      const lastVisit = localStorage.getItem('lastTransactionsVisit')
      const lastVisitTime = lastVisit ? parseInt(lastVisit) : 0

      // Only show pending reviews notification if there are unreviewed transactions
      // completed after the user's last visit to the transactions page
      const newPendingReviews = transactions.filter(t => {
        if (t.status !== 'completed' || t.has_reviewed) return false
        // If completed_at exists and is after last visit, it's new
        if (t.completed_at) {
          const completedTime = new Date(t.completed_at).getTime()
          return completedTime > lastVisitTime
        }
        return !lastVisit // If no last visit, show all
      }).length

      setStats({
        activeListings: listings.filter(l => l.status === 'active').length,
        pendingTransactions: transactions.filter(t => t.status === 'pending' || t.status === 'confirmed').length,
        completedTransactions: transactions.filter(t => t.status === 'completed').length,
        unreadMessages: messagesRes.data.unreadCount,
        pendingReviews: newPendingReviews
      })

      setRecentListings(listings.slice(0, 3))
      setRecentTransactions(transactions.slice(0, 5))
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your mealswipe trades.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/listings/new"
          className="bg-nyu-violet text-white rounded-xl p-4 hover:bg-nyu-violet-dark transition-colors"
        >
          <PlusCircle size={24} className="mb-2" />
          <span className="font-medium">Sell Swipes</span>
        </Link>
        <Link
          to="/listings"
          className="bg-white border-2 border-nyu-violet text-nyu-violet rounded-xl p-4 hover:bg-purple-50 transition-colors"
        >
          <List size={24} className="mb-2" />
          <span className="font-medium">Browse</span>
        </Link>
        <Link
          to="/transactions"
          className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl p-4 hover:bg-gray-50 transition-colors relative"
        >
          <ArrowLeftRight size={24} className="mb-2" />
          <span className="font-medium">Transactions</span>
          {stats.pendingReviews > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {stats.pendingReviews}
            </span>
          )}
        </Link>
        <Link
          to="/messages"
          className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl p-4 hover:bg-gray-50 transition-colors relative"
        >
          <MessageSquare size={24} className="mb-2" />
          <span className="font-medium">Messages</span>
          {stats.unreadMessages > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {stats.unreadMessages}
            </span>
          )}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-3xl font-bold text-nyu-violet">{stats.activeListings}</div>
          <div className="text-gray-600 text-sm">Active Listings</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-3xl font-bold text-yellow-500">{stats.pendingTransactions}</div>
          <div className="text-gray-600 text-sm">Pending Trades</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-3xl font-bold text-green-500">{stats.completedTransactions}</div>
          <div className="text-gray-600 text-sm">Completed</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center">
            <Star size={24} className="text-yellow-500" fill="currentColor" />
            <span className="text-3xl font-bold ml-2">
              {user?.rating > 0 ? user.rating.toFixed(1) : '-'}
            </span>
          </div>
          <div className="text-gray-600 text-sm">Your Rating</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Listings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Listings</h2>
            <Link to="/my-listings" className="text-nyu-violet hover:underline text-sm">
              View all
            </Link>
          </div>

          {recentListings.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">No listings yet</p>
              <Link to="/listings/new" className="btn-primary inline-block">
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listings/${listing.id}`}
                  className="block border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{listing.title}</p>
                      <p className="text-sm text-gray-500">
                        {listing.quantity} swipe{listing.quantity > 1 ? 's' : ''} • {listing.dining_hall}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      listing.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
            <Link to="/transactions" className="text-nyu-violet hover:underline text-sm">
              View all
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">No transactions yet</p>
              <Link to="/listings" className="btn-outline inline-block">
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <Link
                  key={tx.id}
                  to="/transactions"
                  className="block border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{tx.listing_title}</p>
                      <p className="text-sm text-gray-500">
                        {tx.user_role === 'buyer' ? `From ${tx.seller_name}` : `To ${tx.buyer_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : tx.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : tx.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tx.status}
                      </span>
                      <p className="text-sm font-medium text-gray-800 mt-1">
                        ${tx.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
