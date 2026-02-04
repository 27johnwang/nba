import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Clock,
  X,
  ChevronDown
} from 'lucide-react'

const DINING_HALLS = [
  'All Locations',
  'Lipton Dining Hall',
  'Weinstein Passport Dining',
  'Palladium Dining Hall',
  'Third North Dining',
  'Kimmel Marketplace',
  'Jasper Kane (Brooklyn)',
  'Other'
]

const Listings = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    dining_hall: '',
    date: '',
    min_price: '',
    max_price: '',
    sort: 'newest'
  })

  useEffect(() => {
    fetchListings()
  }, [filters])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.dining_hall && filters.dining_hall !== 'All Locations') {
        params.append('dining_hall', filters.dining_hall)
      }
      if (filters.date) params.append('date', filters.date)
      if (filters.min_price) params.append('min_price', filters.min_price)
      if (filters.max_price) params.append('max_price', filters.max_price)
      if (filters.sort) params.append('sort', filters.sort)

      const response = await api.get(`/listings?${params.toString()}`)
      setListings(response.data.listings)
    } catch (err) {
      setError('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setFilters({
      dining_hall: '',
      date: '',
      min_price: '',
      max_price: '',
      sort: 'newest'
    })
  }

  const activeFilterCount = Object.values(filters).filter(
    (v, i) => v && Object.keys(filters)[i] !== 'sort'
  ).length

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Available Meal Swipes</h1>
          <p className="text-gray-600 mt-1">
            {listings.length} swipe{listings.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-4 md:mt-0 flex items-center gap-2 btn-secondary"
        >
          <Filter size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-nyu-violet text-white text-xs rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={18} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Filter Listings</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-nyu-violet hover:underline">
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dining Hall
              </label>
              <select
                value={filters.dining_hall}
                onChange={(e) => handleFilterChange('dining_hall', e.target.value)}
                className="input-field"
              >
                {DINING_HALLS.map((hall) => (
                  <option key={hall} value={hall === 'All Locations' ? '' : hall}>
                    {hall}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                placeholder="$0"
                min="0"
                step="0.50"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                placeholder="$20"
                min="0"
                step="0.50"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="input-field"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="date">Date: Soonest</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && listings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No listings found</h3>
          <p className="text-gray-600 mb-4">
            {activeFilterCount > 0
              ? 'Try adjusting your filters to find more listings.'
              : 'Be the first to list your meal swipes!'}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-outline">
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Listings Grid */}
      {!loading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/listings/${listing.id}`}
              className="card p-6 block hover:border-nyu-violet border-2 border-transparent"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">
                  {listing.title}
                </h3>
                <span className="bg-nyu-violet text-white text-lg font-bold px-3 py-1 rounded-lg">
                  ${listing.price.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2 text-gray-400" />
                  <span>{listing.dining_hall}</span>
                </div>

                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <span>{format(new Date(listing.available_date), 'EEE, MMM d')}</span>
                </div>

                {listing.available_time_start && (
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-gray-400" />
                    <span>
                      {listing.available_time_start}
                      {listing.available_time_end && ` - ${listing.available_time_end}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center pt-2 border-t mt-3">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800">{listing.seller_name}</span>
                    {listing.seller_rating > 0 && (
                      <span className="flex items-center ml-2 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="ml-1 text-gray-600">
                          {listing.seller_rating.toFixed(1)}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="ml-auto text-nyu-violet font-medium">
                    {listing.quantity} swipe{listing.quantity > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Listings
