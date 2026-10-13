import { Link, NavLink, Outlet } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function AppShell({ links, userLabel, home }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="on-dark flex flex-wrap items-center gap-x-6 gap-y-1 bg-night px-4 py-2 text-white sm:px-8">
        <Link to={home} className="flex items-center gap-2.5 py-1">
          <Logo className="text-aqua" />
          <span className="font-display text-xl font-bold tracking-widest text-white">HIRAYA</span>
        </Link>

        <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2.5 sm:px-3.5 sm:py-3 ${
                  isActive ? 'bg-white/15 font-bold text-white' : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-sm sm:ml-0">
          <span className="hidden sm:inline">{userLabel}</span>
          <Link to="/" className="py-3 font-bold text-aqua hover:underline">
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