import { Link, NavLink, Outlet } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function AppShell({ links, userLabel, home }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line bg-white px-4 py-2 sm:px-8">
        <Link to={home} className="flex items-center gap-2.5 py-1">
          <Logo />
          <span className="font-display text-xl font-bold tracking-widest text-ink">HIRAYA</span>
        </Link>

        <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2.5 sm:px-3.5 sm:py-3 ${
                  isActive ? 'bg-brand-soft font-bold text-brand' : 'font-medium text-ink hover:bg-surface'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-sm sm:ml-0">
          <span className="hidden sm:inline">{userLabel}</span>
          <Link to="/" className="py-3 font-bold text-brand hover:underline">
            Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-295 px-4 py-6 sm:px-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}