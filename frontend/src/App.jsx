import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import PlaceholderPage from './components/PlaceholderPage.jsx'
import { competencies, learners } from './data/mock.js'
import StudentDashboard from './pages/StudentDashboard.jsx'

const studentLinks = [
  { to: '/student', label: 'My progress', end: true },
  { to: '/student/practice', label: 'Practice' },
  { to: '/student/path', label: 'Review path' },
]

const teacherLinks = [
  { to: '/teacher', label: 'Class overview', end: true },
  { to: '/teacher/learner', label: 'Learner view' },
  { to: '/teacher/graph', label: 'Prerequisite graph' },
]

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <main className="mx-auto max-w-xl p-8">
              <h1 className="font-display text-4xl font-bold text-brand">HIRAYA</h1>
              <p className="mt-2 text-muted">Sign in (placeholder)</p>
              <div className="mt-6 flex gap-3">
                <Link to="/student" className="rounded-lg bg-brand px-6 py-3 font-bold text-white">
                  Continue as student
                </Link>
                <Link to="/teacher" className="rounded-lg border-2 border-brand px-6 py-3 font-bold text-brand">
                  Continue as teacher
                </Link>
              </div>
            </main>
          }
        />

        <Route path="/student" element={<AppShell links={studentLinks} userLabel="Learner 01 · Grade 7" home="/student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="practice" element={<PlaceholderPage title="Practice" note="Coming in a later step." />} />
          <Route path="path" element={<PlaceholderPage title="Review path" note="Coming in a later step." />} />
        </Route>

        <Route path="/teacher" element={<AppShell links={teacherLinks} userLabel="Teacher · Grade 7 Mathematics" home="/teacher" />}>
          <Route
            index
            element={
              <PlaceholderPage
                title="Class overview"
                note={`${learners.length} learners, ${competencies.length} skills loaded.`}
              />
            }
          />
          <Route path="learner" element={<PlaceholderPage title="Learner view" note="Coming in a later step." />} />
          <Route path="graph" element={<PlaceholderPage title="Prerequisite graph" note="Coming in a later step." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}