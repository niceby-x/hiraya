import { Link, NavLink, Outlet } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function AppShell({ links, userLabel, home }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-line bg-white px-8 py-2">
        <Link to={home} className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-xl font-bold tracking-widest text-ink">HIRAYA</span>
        </Link>

        <nav className="flex flex-1 flex-wrap gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-3 ${
                  isActive ? 'bg-brand-soft font-bold text-brand' : 'font-medium text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-sm">
          <span>{userLabel}</span>
          <Link to="/" className="py-3 font-bold text-brand">
            Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-8 py-10">
        <Outlet />
      </main>
    </div>
  )
}