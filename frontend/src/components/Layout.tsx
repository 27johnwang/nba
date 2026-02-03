import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutList, BarChart3, TrendingUp, User, Search } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/lines', icon: LayoutList, label: 'Lines' },
  { to: '/analyze', icon: BarChart3, label: 'Analyze' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-white">NBA Analytics</h1>
          <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <Search className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center py-3 px-4 transition-colors',
                  isActive ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'
                )
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
        {/* Disclaimer */}
        <div className="text-center pb-2 px-4">
          <p className="text-[10px] text-slate-500">
            Analytics only. Not betting advice. Please bet responsibly.
          </p>
        </div>
      </nav>
    </div>
  )
}
