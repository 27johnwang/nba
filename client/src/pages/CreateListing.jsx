import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Hash,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const DINING_HALLS = [
  'Lipton Dining Hall',
  'Weinstein Passport Dining',
  'Palladium Dining Hall',
  'Third North Dining',
  'Kimmel Marketplace',
  'Jasper Kane (Brooklyn)',
  'Other'
]

const CreateListing = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    quantity: 1,
    dining_hall: '',
    available_date: '',
    available_time_start: '',
    available_time_end: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/listings', {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      })

      setSuccess(true)
      setTimeout(() => {
        navigate(`/listings/${response.data.listing.id}`)
      }, 1500)
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'Failed to create listing'
      )
    } finally {
      setLoading(false)
    }
  }

  // Generate a default title based on quantity and dining hall
  useEffect(() => {
    if (!formData.title && formData.quantity && formData.dining_hall) {
      const hall = formData.dining_hall.split(' ')[0]
      setFormData(prev => ({
        ...prev,
        title: `${prev.quantity} Meal Swipe${prev.quantity > 1 ? 's' : ''} at ${hall}`
      }))
    }
  }, [formData.quantity, formData.dining_hall])

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Listing Created!</h2>
        <p className="text-gray-600">Redirecting to your listing...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Sell Your Meal Swipes</h1>
          <p className="text-gray-600 mt-2">
            Create a listing to sell your unused meal swipes to fellow students
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dining Hall */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dining Hall <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                name="dining_hall"
                value={formData.dining_hall}
                onChange={handleChange}
                className="input-field pl-10"
                required
              >
                <option value="">Select a dining hall</option>
                {DINING_HALLS.map((hall) => (
                  <option key={hall} value={hall}>{hall}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="date"
                name="available_date"
                value={formData.available_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available From
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="time"
                  name="available_time_start"
                  value={formData.available_time_start}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Until
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="time"
                  name="available_time_end"
                  value={formData.available_time_end}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Swipes <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Swipe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.50"
                  placeholder="8.00"
                  className="input-field pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Typical price: $6-10 per swipe</p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., 2 Meal Swipes at Lipton"
              maxLength={100}
              className="input-field"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add any extra details about timing, meeting preferences, etc."
                className="input-field"
              />
            </div>
          </div>

          {/* Summary */}
          {formData.price && formData.quantity && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Listing Summary</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  {formData.quantity} swipe{formData.quantity > 1 ? 's' : ''} @ ${parseFloat(formData.price || 0).toFixed(2)} each
                </p>
                <p className="text-lg font-bold text-nyu-violet">
                  Total: ${(parseFloat(formData.price || 0) * parseInt(formData.quantity || 1)).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>

      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Tips for Selling</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Be flexible with meeting times for more buyers</li>
          <li>Respond quickly to messages</li>
          <li>Meet at the dining hall entrance</li>
          <li>Accept Venmo or cash for easy payment</li>
        </ul>
      </div>
    </div>
  )
}

export default CreateListing
