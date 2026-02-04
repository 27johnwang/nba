import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, DollarSign, Users, Shield, ArrowRight } from 'lucide-react'

const Home = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-nyu-violet to-nyu-violet-dark text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Don't Let Your Meal Swipes Go to Waste
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-8">
            Connect with fellow NYU students to buy and sell unused meal swipes.
            Save money, reduce waste, help each other out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/listings"
              className="bg-white text-nyu-violet px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <Search className="mr-2" size={20} />
              Browse Swipes
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white hover:text-nyu-violet transition-colors"
              >
                Get Started
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/listings/new"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white hover:text-nyu-violet transition-colors"
              >
                Sell Your Swipes
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up with NYU Email</h3>
              <p className="text-gray-600">
                Create an account using your @nyu.edu email to verify you're a real NYU student.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">List or Browse</h3>
              <p className="text-gray-600">
                Have extra swipes? List them for sale. Need swipes? Browse available listings.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Meet & Exchange</h3>
              <p className="text-gray-600">
                Coordinate with your match, meet at the dining hall, and complete the swap!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Why Use NYU Mealswipe?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <DollarSign className="text-nyu-violet mb-4" size={32} />
              <h3 className="text-lg font-semibold mb-2">Save Money</h3>
              <p className="text-gray-600 text-sm">
                Buy swipes at discounted prices instead of paying full price for meals.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Users className="text-nyu-violet mb-4" size={32} />
              <h3 className="text-lg font-semibold mb-2">NYU Students Only</h3>
              <p className="text-gray-600 text-sm">
                Only verified NYU students can use the platform. Safe and trusted community.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Shield className="text-nyu-violet mb-4" size={32} />
              <h3 className="text-lg font-semibold mb-2">Ratings & Reviews</h3>
              <p className="text-gray-600 text-sm">
                Build trust through our rating system. See seller reviews before buying.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Search className="text-nyu-violet mb-4" size={32} />
              <h3 className="text-lg font-semibold mb-2">Easy to Use</h3>
              <p className="text-gray-600 text-sm">
                Filter by dining hall, date, and price. Find exactly what you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dining Halls */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            Available at All NYU Dining Halls
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Lipton Dining Hall',
              'Weinstein Passport Dining',
              'Palladium Dining Hall',
              'Third North Dining',
              'Kimmel Marketplace',
              'Jasper Kane (Brooklyn)'
            ].map((hall) => (
              <span
                key={hall}
                className="bg-purple-100 text-nyu-violet px-4 py-2 rounded-full text-sm font-medium"
              >
                {hall}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-nyu-violet text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Trading Swipes?
          </h2>
          <p className="text-xl text-purple-200 mb-8">
            Join hundreds of NYU students already using the marketplace.
          </p>
          {!isAuthenticated ? (
            <Link
              to="/register"
              className="inline-flex items-center bg-white text-nyu-violet px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Create Free Account
              <ArrowRight className="ml-2" size={20} />
            </Link>
          ) : (
            <Link
              to="/listings"
              className="inline-flex items-center bg-white text-nyu-violet px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Browse Listings
              <ArrowRight className="ml-2" size={20} />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
