import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { format } from 'date-fns'
import {
  PlusCircle,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Users,
  Clock,
  CheckCircle,
  ChevronRight
} from 'lucide-react'

const MyListings = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [activeTab, setActiveTab] = useState('pending') // 'pending' or 'active' or 'completed'

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const response = await api.get('/listings/user/me')
      setListings(response.data.listings)
    } catch (err) {
      setError('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/listings/${id}`)
      setListings(listings.filter(l => l.id !== id))
      setDeleteId(null)
    } catch (err) {
      setError('Failed to delete listing')
    }
  }

  const handleStatusToggle = async (listing) => {
    const newStatus = listing.status === 'active' ? 'paused' : 'active'
    try {
      await api.put(`/listings/${listing.id}`, { status: newStatus })
      setListings(listings.map(l =>
        l.id === listing.id ? { ...l, status: newStatus } : l
      ))
    } catch (err) {
      setError('Failed to update listing')
    }
  }

  // Filter listings based on active tab
  const pendingListings = listings.filter(l =>
    (l.status === 'active' || l.status === 'paused') && (l.pending_count > 0 || l.confirmed_count > 0)
  )
  const activeListings = listings.filter(l =>
    l.status === 'active' || l.status === 'paused'
  )
  const completedListings = listings.filter(l => l.status === 'sold')

  const getDisplayedListings = () => {
    switch (activeTab) {
      case 'pending':
        return pendingListings
      case 'active':
        return activeListings
      case 'completed':
        return completedListings
      default:
        return listings
    }
  }

  const displayedListings = getDisplayedListings()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
          <p className="text-gray-600">Manage your meal swipe listings</p>
        </div>
        <Link to="/listings/new" className="btn-primary flex items-center">
          <PlusCircle size={20} className="mr-2" />
          New Listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-nyu-violet text-nyu-violet'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={18} />
          Pending Requests
          {pendingListings.length > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
              {pendingListings.reduce((acc, l) => acc + l.pending_count + l.confirmed_count, 0)}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-nyu-violet text-nyu-violet'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign size={18} />
          Active Listings
          <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">
            {activeListings.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'border-nyu-violet text-nyu-violet'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle size={18} />
          Completed
          <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">
            {completedListings.length}
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {displayedListings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <div className="text-6xl mb-4">
            {activeTab === 'pending' ? '📬' : activeTab === 'completed' ? '✅' : '📝'}
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {activeTab === 'pending'
              ? 'No pending requests'
              : activeTab === 'completed'
              ? 'No completed sales yet'
              : 'No listings yet'}
          </h2>
          <p className="text-gray-600 mb-4">
            {activeTab === 'pending'
              ? 'When someone requests to buy your meal swipes, they\'ll appear here'
              : activeTab === 'completed'
              ? 'Completed transactions will appear here'
              : 'Create your first listing to start selling meal swipes'}
          </p>
          {activeTab === 'active' && (
            <Link to="/listings/new" className="btn-primary inline-flex items-center">
              <PlusCircle size={20} className="mr-2" />
              Create Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedListings.map((listing) => (
            <Link
              key={listing.id}
              to={`/listings/${listing.id}`}
              className={`block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-2 ${
                listing.confirmed_count > 0
                  ? 'border-green-500'
                  : listing.pending_count > 0
                  ? 'border-orange-300'
                  : 'border-transparent'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between md:justify-start">
                    <h3 className="text-lg font-semibold text-gray-800">{listing.title}</h3>
                    <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${
                      listing.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : listing.status === 'sold'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {listing.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2 text-gray-400" />
                      {listing.dining_hall}
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      {format(new Date(listing.available_date), 'EEE, MMM d, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <DollarSign size={16} className="mr-2 text-gray-400" />
                      ${listing.price.toFixed(2)} × {listing.quantity} swipes
                    </div>
                  </div>

                  {/* Pending/Confirmed counts */}
                  {(listing.pending_count > 0 || listing.confirmed_count > 0) && (
                    <div className="mt-4 flex gap-3">
                      {listing.confirmed_count > 0 && (
                        <span className="inline-flex items-center bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                          <CheckCircle size={14} className="mr-1" />
                          {listing.confirmed_count} confirmed
                        </span>
                      )}
                      {listing.pending_count > 0 && (
                        <span className="inline-flex items-center bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full">
                          <Users size={14} className="mr-1" />
                          {listing.pending_count} pending
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center mt-4 md:mt-0 md:ml-6">
                  {activeTab === 'active' && listing.status !== 'sold' && (
                    <div className="flex gap-2 mr-4" onClick={(e) => e.preventDefault()}>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleStatusToggle(listing)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          listing.status === 'active'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {listing.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setDeleteId(listing.id)
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                  <ChevronRight size={24} className="text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Delete Listing?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this listing? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyListings
