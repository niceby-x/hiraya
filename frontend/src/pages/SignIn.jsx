import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'

const roles = {
  student: { label: 'Student', username: 'learner01', to: '/student' },
  teacher: { label: 'Teacher', username: 'teacher.math7', to: '/teacher' },
}

export default function SignIn() {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [username, setUsername] = useState(roles.student.username)
  const [password, setPassword] = useState('sample1234')

  function chooseRole(next) {
    setRole(next)
    setUsername(roles[next].username)
  }

  function submit(e) {
    e.preventDefault()
    navigate(roles[role].to)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-brand p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Logo size={36} className="text-white" />
          <span className="font-display text-2xl font-bold tracking-widest">HIRAYA</span>
        </div>

        <div>
          <h2 className="font-display text-5xl font-bold leading-tight">
            Fill learning gaps in the right order.
          </h2>
          <p className="mt-4 max-w-md text-lg text-brand-soft">
            HIRAYA estimates what each Grade 7 learner has mastered and suggests which prerequisite skills to
            review first.
          </p>
        </div>

        <p className="text-sm text-brand-soft">
          Thesis prototype · Grade 7 MATATAG Mathematics · Sample data
        </p>
      </section>

      <main className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={32} />
            <span className="font-display text-2xl font-bold tracking-widest">HIRAYA</span>
          </div>

          <h1 className="font-display text-4xl font-bold">Sign in</h1>
          <p className="mt-2 text-muted">Choose how you are using HIRAYA.</p>

          <div
            role="radiogroup"
            aria-label="Role"
            className="mt-6 grid grid-cols-2 rounded-lg border border-line bg-white p-1"
          >
            {Object.entries(roles).map(([key, r]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={role === key}
                onClick={() => chooseRole(key)}
                className={`rounded-md px-4 py-2 font-bold ${role === key ? 'bg-brand text-white' : 'text-ink'}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
            <div>
              <label htmlFor="username" className="text-sm font-bold text-muted">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-bold text-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-4 py-3"
              />
            </div>

            <button type="submit" className="rounded-lg bg-brand px-6 py-3 font-bold text-white">
              Sign in as {roles[role].label.toLowerCase()}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted">
            Prototype only. There are no real accounts, and all data shown is sample data.
          </p>
        </div>
      </main>
    </div>
  )
}