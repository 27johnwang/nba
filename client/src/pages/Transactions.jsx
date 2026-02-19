import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { format } from 'date-fns'
import {
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  AlertCircle
} from 'lucide-react'

const Transactions = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set())

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter === 'buying') params.append('role', 'buyer')
      if (filter === 'selling') params.append('role', 'seller')

      const response = await api.get(`/transactions?${params.toString()}`)
      setTransactions(response.data.transactions)
    } catch (err) {
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/transactions/${id}/status`, { status })
      fetchTransactions()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update transaction')
    }
  }

  const handleReviewSubmit = async () => {
    setReviewLoading(true)
    try {
      await api.post('/reviews', {
        transaction_id: reviewModal.id,
        rating: reviewData.rating,
        comment: reviewData.comment
      })
      setReviewModal(null)
      setReviewData({ rating: 5, comment: '' })
      fetchTransactions()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review')
    } finally {
      setReviewLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const dismissReviewNotification = (txId) => {
    setDismissedNotifications(prev => new Set([...prev, txId]))
  }

  const shouldShowReviewNotification = (tx) => {
    return tx.status === 'completed' &&
           !tx.has_reviewed &&
           !dismissedNotifications.has(tx.id)
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <p className="text-gray-600">Manage your buying and selling history</p>
        </div>

        <div className="flex gap-2 mt-4 md:mt-0">
          {['all', 'buying', 'selling'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-nyu-violet text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No transactions yet</h2>
          <p className="text-gray-600 mb-4">
            {filter === 'buying'
              ? 'Browse listings to buy meal swipes'
              : filter === 'selling'
              ? 'Create a listing to start selling'
              : 'Start buying or selling meal swipes'}
          </p>
          <Link to="/listings" className="btn-primary">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => {
            const isBuyer = tx.user_role === 'buyer'
            const otherUser = isBuyer ? tx.seller_name : tx.buyer_name

            return (
              <div key={tx.id} className="bg-white rounded-xl shadow-md p-6">
                {/* Review notification banner */}
                {shouldShowReviewNotification(tx) && (
                  <button
                    onClick={() => dismissReviewNotification(tx.id)}
                    className="w-full mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between hover:bg-yellow-100 transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <Star size={18} className="text-yellow-500 mr-2" fill="currentColor" />
                      <span className="text-yellow-800 text-sm">
                        How was your experience with <strong>{isBuyer ? tx.seller_name : tx.buyer_name}</strong>? Leave a review!
                      </span>
                    </div>
                    <XCircle size={16} className="text-yellow-600 hover:text-yellow-800 shrink-0 ml-2" />
                  </button>
                )}

                <div className="flex flex-col lg:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`p-2 rounded-lg mr-3 ${
                        isBuyer ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {isBuyer ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{tx.listing_title}</h3>
                        <p className="text-sm text-gray-500">
                          {isBuyer ? 'Buying from' : 'Selling to'} <strong>{otherUser}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="ml-12 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-2 text-gray-400" />
                        {tx.dining_hall}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                      {tx.seller_venmo && isBuyer && (
                        <div className="text-nyu-violet">
                          Pay via Venmo: {tx.seller_venmo}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 lg:text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(tx.status)}`}>
                      {tx.status}
                    </span>
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">{tx.quantity} swipe{tx.quantity > 1 ? 's' : ''}</span>
                      <span className="text-xl font-bold text-gray-800 ml-2">${tx.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                  {/* Seller actions */}
                  {!isBuyer && tx.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(tx.id, 'confirmed')}
                        className="btn-primary flex items-center"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(tx.id, 'cancelled')}
                        className="btn-secondary flex items-center text-red-600"
                      >
                        <XCircle size={16} className="mr-1" />
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Both can mark as completed */}
                  {tx.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(tx.id, 'completed')}
                      className="btn-primary flex items-center"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Mark Complete
                    </button>
                  )}

                  {/* Review button for completed transactions */}
                  {tx.status === 'completed' && (
                    <button
                      onClick={() => setReviewModal(tx)}
                      className="btn-outline flex items-center"
                    >
                      <Star size={16} className="mr-1" />
                      Leave Review
                    </button>
                  )}

                  {/* Message button */}
                  <Link
                    to={`/messages/${isBuyer ? tx.seller_id : tx.buyer_id}?dining_hall=${encodeURIComponent(tx.dining_hall)}&price=${tx.unit_price}&role=${isBuyer ? 'buyer' : 'seller'}&listing_id=${tx.listing_id}`}
                    className="btn-secondary flex items-center"
                  >
                    <MessageSquare size={16} className="mr-1" />
                    Message
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Leave a Review</h2>
            <p className="text-gray-600 mb-4">
              How was your experience with{' '}
              {reviewModal.user_role === 'buyer' ? reviewModal.seller_name : reviewModal.buyer_name}?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="p-1"
                  >
                    <Star
                      size={32}
                      className={star <= reviewData.rating ? 'text-yellow-500' : 'text-gray-300'}
                      fill={star <= reviewData.rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional)
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReviewModal(null)
                  setReviewData({ rating: 5, comment: '' })
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={reviewLoading}
                className="btn-primary flex-1"
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions
