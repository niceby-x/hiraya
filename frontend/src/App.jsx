import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import GraphReview from './pages/GraphReview.jsx'
import LearnerView from './pages/LearnerView.jsx'
import Login from './pages/Login.jsx'
import Practice from './pages/Practice.jsx'
import ReviewPath from './pages/ReviewPath.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import TeacherDashboard from './pages/TeacherDashboard.jsx'

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
        <Route path="/" element={<Login />} />

        <Route path="/student" element={<AppShell links={studentLinks} userLabel="Learner 01 · Grade 7" home="/student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="practice" element={<Practice />} />
          <Route path="path" element={<ReviewPath />} />
        </Route>

        <Route path="/teacher" element={<AppShell links={teacherLinks} userLabel="Teacher · Grade 7 Mathematics" home="/teacher" />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="learner" element={<LearnerView />} />
          <Route path="graph" element={<GraphReview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}