import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { format } from 'date-fns'
import {
  MapPin,
  Calendar,
  Clock,
  Star,
  User,
  DollarSign,
  MessageSquare,
  ShoppingCart,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

const ListingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showBuyModal, setShowBuyModal] = useState(false)
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [buyLoading, setBuyLoading] = useState(false)

  const [message, setMessage] = useState('')
  const [messageLoading, setMessageLoading] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  const [pendingBuyers, setPendingBuyers] = useState([])
  const [buyersLoading, setBuyersLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchListing()
  }, [id])

  useEffect(() => {
    if (listing?.is_owner) {
      fetchPendingBuyers()
    }
  }, [listing])

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`)
      setListing(response.data.listing)
    } catch (err) {
      setError('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingBuyers = async () => {
    setBuyersLoading(true)
    try {
      const response = await api.get(`/transactions/listing/${id}`)
      setPendingBuyers(response.data.transactions)
    } catch (err) {
      console.error('Failed to fetch pending buyers:', err)
    } finally {
      setBuyersLoading(false)
    }
  }

  const handleConfirmSale = async (transactionId) => {
    setActionLoading(transactionId)
    try {
      await api.put(`/transactions/${transactionId}/status`, { status: 'confirmed' })
      fetchPendingBuyers()
      fetchListing()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm sale')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkComplete = async (transactionId) => {
    setActionLoading(transactionId)
    try {
      await api.put(`/transactions/${transactionId}/status`, { status: 'completed' })
      fetchPendingBuyers()
      fetchListing()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark complete')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelTransaction = async (transactionId) => {
    setActionLoading(transactionId)
    try {
      await api.put(`/transactions/${transactionId}/status`, { status: 'cancelled' })
      fetchPendingBuyers()
      fetchListing()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setBuyLoading(true)
    try {
      await api.post('/transactions', {
        listing_id: id,
        quantity: buyQuantity
      })
      navigate('/transactions')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create transaction')
    } finally {
      setBuyLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setMessageLoading(true)
    try {
      await api.post('/messages', {
        receiver_id: listing.seller_id,
        listing_id: id,
        content: message
      })
      setMessageSent(true)
      setMessage('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message')
    } finally {
      setMessageLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet"></div>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Listing Not Found</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/listings" className="btn-primary">
          Browse All Listings
        </Link>
      </div>
    )
  }

  const isOwner = listing?.is_owner

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={20} className="mr-1" />
        Back to listings
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{listing.title}</h1>
              <span className="bg-nyu-violet text-white text-2xl font-bold px-4 py-2 rounded-lg">
                ${listing.price.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin size={20} className="mr-3 text-nyu-violet" />
                <span className="font-medium">{listing.dining_hall}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar size={20} className="mr-3 text-nyu-violet" />
                <span>{format(new Date(listing.available_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>

              {listing.available_time_start && (
                <div className="flex items-center text-gray-600">
                  <Clock size={20} className="mr-3 text-nyu-violet" />
                  <span>
                    {listing.available_time_start}
                    {listing.available_time_end && ` - ${listing.available_time_end}`}
                  </span>
                </div>
              )}

              <div className="flex items-center text-gray-600">
                <ShoppingCart size={20} className="mr-3 text-nyu-violet" />
                <span>
                  <strong>{listing.quantity}</strong> swipe{listing.quantity > 1 ? 's' : ''} available
                </span>
              </div>
            </div>

            {listing.description && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-4">Seller Information</h3>

            <div className="flex items-start">
              <div className="bg-nyu-violet text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                {listing.seller_name.charAt(0)}
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-800">{listing.seller_name}</p>
                <div className="flex items-center mt-1">
                  {listing.seller_rating > 0 ? (
                    <>
                      <Star size={16} className="text-yellow-500" fill="currentColor" />
                      <span className="ml-1 text-gray-600">
                        {listing.seller_rating.toFixed(1)} ({listing.seller_reviews} review{listing.seller_reviews !== 1 ? 's' : ''})
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm">New seller</span>
                  )}
                </div>
                {listing.seller_venmo && (
                  <p className="text-sm text-gray-500 mt-1">
                    Venmo: {listing.seller_venmo}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            {isOwner ? (
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Buyer Requests</h3>

                {buyersLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-nyu-violet"></div>
                  </div>
                ) : pendingBuyers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No buyer requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingBuyers.filter(tx => tx.status !== 'cancelled' && tx.status !== 'completed').map((tx) => (
                      <div
                        key={tx.id}
                        className={`p-4 rounded-lg border-2 ${
                          tx.status === 'confirmed'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <Link
                            to={`/user/${tx.buyer_id}`}
                            className="bg-nyu-violet text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm hover:bg-nyu-violet-dark"
                          >
                            {tx.buyer_name.charAt(0)}
                          </Link>
                          <div className="ml-2 flex-1">
                            <Link
                              to={`/user/${tx.buyer_id}`}
                              className={`font-medium hover:text-nyu-violet ${
                                tx.status === 'confirmed' ? 'text-green-700' : 'text-gray-800'
                              }`}
                            >
                              {tx.buyer_name}
                            </Link>
                            <div className="flex items-center text-xs text-gray-500">
                              {tx.buyer_rating > 0 ? (
                                <>
                                  <Star size={10} className="text-yellow-500 mr-0.5" fill="currentColor" />
                                  {tx.buyer_rating.toFixed(1)}
                                </>
                              ) : (
                                'New buyer'
                              )}
                            </div>
                          </div>
                          {tx.status === 'confirmed' && (
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                              Interested
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {tx.quantity} swipe{tx.quantity > 1 ? 's' : ''} · ${tx.total_price.toFixed(2)}
                        </p>

                        <div className="flex gap-2">
                          {tx.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirmSale(tx.id)}
                                disabled={actionLoading === tx.id}
                                className="flex-1 btn-primary text-sm py-1.5 flex items-center justify-center"
                              >
                                <CheckCircle size={14} className="mr-1" />
                                {actionLoading === tx.id ? '...' : 'Mark Interest'}
                              </button>
                              <button
                                onClick={() => handleCancelTransaction(tx.id)}
                                disabled={actionLoading === tx.id}
                                className="btn-secondary text-sm py-1.5 text-red-600"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {tx.status === 'confirmed' && (
                            <button
                              onClick={() => handleMarkComplete(tx.id)}
                              disabled={actionLoading === tx.id}
                              className="flex-1 btn-primary text-sm py-1.5 bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === tx.id ? '...' : 'Confirm Transaction'}
                            </button>
                          )}
                          <Link
                            to={`/messages/${tx.buyer_id}?dining_hall=${encodeURIComponent(listing.dining_hall)}&price=${listing.price}&role=seller`}
                            className="btn-secondary text-sm py-1.5"
                          >
                            <MessageSquare size={14} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <Link
                    to="/my-listings"
                    className="btn-outline w-full block text-center text-sm"
                  >
                    Manage All Listings
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <select
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(parseInt(e.target.value))}
                    className="input-field"
                  >
                    {[...Array(listing.quantity)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} swipe{i > 0 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-b py-4 mb-4">
                  <div className="flex justify-between text-lg">
                    <span>Total</span>
                    <span className="font-bold text-nyu-violet">
                      ${(listing.price * buyQuantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowBuyModal(true)}
                  className="btn-primary w-full py-3 mb-3"
                >
                  Request to Buy
                </button>

                {isAuthenticated ? (
                  <div>
                    <p className="text-center text-gray-500 text-sm mb-3">or</p>

                    {messageSent ? (
                      <div className="text-center text-green-600 py-2">
                        Message sent! Check your messages.
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage}>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Send a message to the seller..."
                          className="input-field mb-2 min-h-[80px]"
                        />
                        <button
                          type="submit"
                          disabled={messageLoading || !message.trim()}
                          className="btn-outline w-full flex items-center justify-center"
                        >
                          <MessageSquare size={18} className="mr-2" />
                          {messageLoading ? 'Sending...' : 'Send Message'}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    <Link to="/login" className="text-nyu-violet hover:underline">
                      Sign in
                    </Link>{' '}
                    to contact the seller
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Purchase</h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium">{listing.title}</p>
              <p className="text-sm text-gray-600">
                {buyQuantity} swipe{buyQuantity > 1 ? 's' : ''} × ${listing.price.toFixed(2)}
              </p>
              <p className="text-lg font-bold text-nyu-violet mt-2">
                Total: ${(listing.price * buyQuantity).toFixed(2)}
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              By requesting to buy, you agree to meet the seller at{' '}
              <strong>{listing.dining_hall}</strong> on{' '}
              <strong>{format(new Date(listing.available_date), 'MMM d')}</strong>.
              The seller will confirm and provide meeting details.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBuyModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                disabled={buyLoading}
                className="btn-primary flex-1"
              >
                {buyLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListingDetail
