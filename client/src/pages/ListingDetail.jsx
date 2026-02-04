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
  AlertCircle
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

  useEffect(() => {
    fetchListing()
  }, [id])

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
              <div className="text-center">
                <p className="text-gray-600 mb-4">This is your listing</p>
                <Link
                  to="/my-listings"
                  className="btn-outline w-full block text-center"
                >
                  Manage Your Listings
                </Link>
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
