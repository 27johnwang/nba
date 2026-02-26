import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import {
  Menu,
  X,
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  User,
  LogOut,
  LayoutDashboard,
  List,
  ArrowLeftRight
} from 'lucide-react'
import api from '../utils/api'

const Layout = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Check if user is in an active chat (messages with a userId) - hide bottom nav only then
  const isInActiveChat = location.pathname.startsWith('/messages/') && location.pathname !== '/messages/'
  // Check if on messages page at all (for padding adjustment)
  const isMessagesPage = location.pathname.startsWith('/messages')

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/messages/unread-count')
      setUnreadCount(response.data.unreadCount)
    } catch (err) {
      // Ignore errors
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-nyu-violet text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🍽️</span>
              <span className="font-bold text-xl hidden sm:block">NYU Mealswipe</span>
              <span className="font-bold text-xl sm:hidden">Mealswipe</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link to="/listings" className="hover:bg-nyu-violet-dark px-3 py-2 rounded-lg transition-colors flex items-center space-x-1">
                <Search size={18} />
                <span>Browse</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to="/listings/new" className="hover:bg-nyu-violet-dark px-3 py-2 rounded-lg transition-colors flex items-center space-x-1">
                    <PlusCircle size={18} />
                    <span>Sell</span>
                  </Link>
                  <Link to="/dashboard" className="hover:bg-nyu-violet-dark px-3 py-2 rounded-lg transition-colors flex items-center space-x-1">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/messages" className="hover:bg-nyu-violet-dark px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 relative">
                    <MessageSquare size={18} />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-1 hover:bg-nyu-violet-dark px-3 py-2 rounded-lg transition-colors"
                    >
                      <User size={18} />
                      <span>{user?.name?.split(' ')[0]}</span>
                    </button>
                    {dropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                          <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                            Profile
                          </Link>
                          <Link to="/my-listings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                            My Listings
                          </Link>
                          <Link to="/transactions" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                            Transactions
                          </Link>
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                          >
                            Logout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:bg-nyu-violet-dark px-3 py-2 rounded-lg transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="bg-white text-nyu-violet px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-nyu-violet-dark"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-nyu-violet-dark border-t border-nyu-violet-light">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/listings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet"
              >
                <Search size={20} />
                <span>Browse Listings</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/listings/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet"
                  >
                    <PlusCircle size={20} />
                    <span>Sell Swipes</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet"
                  >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet relative"
                  >
                    <MessageSquare size={20} />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/my-listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet"
                  >
                    <List size={20} />
                    <span>My Listings</span>
                  </Link>
                  <Link
                    to="/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet"
                  >
                    <ArrowLeftRight size={20} />
                    <span>Transactions</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet"
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet text-red-300 w-full"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-nyu-violet"
                  >
                    <User size={20} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white text-nyu-violet font-medium"
                  >
                    <PlusCircle size={20} />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content with Ad Spaces */}
      <div className="flex justify-center w-full max-w-full overflow-x-hidden">
        {/* Left Ad Space */}
        <aside className="hidden xl:block w-40 flex-shrink-0 p-4">
          <div className="sticky top-24 h-[600px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50">
            <span className="text-gray-400 text-sm text-center px-2">Ad Space</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8 safe-area-x overflow-x-hidden box-border ${
          isInActiveChat ? 'py-0 md:py-8' : 'py-4 md:py-8'
        }`}>
          <Outlet />
        </main>

        {/* Right Ad Space */}
        <aside className="hidden xl:block w-40 flex-shrink-0 p-4">
          <div className="sticky top-24 h-[600px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50">
            <span className="text-gray-400 text-sm text-center px-2">Ad Space</span>
          </div>
        </aside>
      </div>

      {/* Footer - hidden on mobile when bottom nav is visible */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-xl font-bold text-white">🍽️ NYU Mealswipe</span>
              <p className="text-sm mt-1">Buy and sell meal swipes with fellow NYU students</p>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link to="/listings" className="hover:text-white">Browse</Link>
              {isAuthenticated ? (
                <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
              ) : (
                <Link to="/register" className="hover:text-white">Sign Up</Link>
              )}
              <Link to="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-700 text-center text-sm">
            <p>Made for NYU students. Not affiliated with NYU Dining Services.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation - hidden only when in active chat to not conflict with input */}
      {!isInActiveChat && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
          <div className="flex justify-around items-center h-16">
            <Link
              to="/listings"
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                location.pathname === '/listings' ? 'text-nyu-violet' : 'text-gray-500'
              }`}
            >
              <Search size={22} />
              <span className="text-xs mt-1">Browse</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/listings/new"
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    location.pathname === '/listings/new' ? 'text-nyu-violet' : 'text-gray-500'
                  }`}
                >
                  <PlusCircle size={22} />
                  <span className="text-xs mt-1">Sell</span>
                </Link>

                <Link
                  to="/dashboard"
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    location.pathname === '/dashboard' ? 'text-nyu-violet' : 'text-gray-500'
                  }`}
                >
                  <LayoutDashboard size={22} />
                  <span className="text-xs mt-1">Home</span>
                </Link>

                <Link
                  to="/messages"
                  className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                    location.pathname.startsWith('/messages') ? 'text-nyu-violet' : 'text-gray-500'
                  }`}
                >
                  <div className="relative">
                    <MessageSquare size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1">Messages</span>
                </Link>

                <Link
                  to="/profile"
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    location.pathname === '/profile' ? 'text-nyu-violet' : 'text-gray-500'
                  }`}
                >
                  <User size={22} />
                  <span className="text-xs mt-1">Profile</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    location.pathname === '/login' ? 'text-nyu-violet' : 'text-gray-500'
                  }`}
                >
                  <User size={22} />
                  <span className="text-xs mt-1">Login</span>
                </Link>

                <Link
                  to="/register"
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    location.pathname === '/register' ? 'text-nyu-violet' : 'text-gray-500'
                  }`}
                >
                  <PlusCircle size={22} />
                  <span className="text-xs mt-1">Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* Spacer for bottom nav on mobile - not needed when in active chat */}
      {!isInActiveChat && <div className="h-16 md:hidden" />}
    </div>
  )
}

export default Layout
