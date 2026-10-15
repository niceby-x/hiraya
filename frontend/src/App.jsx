import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import { icons } from './components/navIcons.jsx'
import GraphReview from './pages/GraphReview.jsx'
import LearnerView from './pages/LearnerView.jsx'
import Login from './pages/Login.jsx'
import PaperAssessment from './pages/PaperAssessment.jsx'
import Practice from './pages/Practice.jsx'
import ReviewPath from './pages/ReviewPath.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import StudentShell from './components/StudentShell.jsx'
import TeacherDashboard from './pages/TeacherDashboard.jsx'
import { useLearner, useSettings } from './lib/store.js'

const teacherLinks = [
  { to: '/teacher', label: 'Class overview', shortLabel: 'Class', icon: icons.class, end: true, keepSearch: true },
  { to: '/teacher/learner', label: 'Learner view', shortLabel: 'Learner', icon: icons.learner, keepSearch: true },
  { to: '/teacher/record', label: 'Record assessment', shortLabel: 'Record', icon: icons.record, keepSearch: true },
  { to: '/teacher/graph', label: 'Prerequisite graph', shortLabel: 'Graph', icon: icons.graph },
]

function ActiveStudentShell() {
  const { learnerId } = useSettings()
  const learner = useLearner(learnerId)
  return <StudentShell userLabel={`${learner.name} · Grade 7`} home="/student" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/student" element={<ActiveStudentShell />}>
          <Route index element={<StudentDashboard />} />
          <Route path="practice" element={<Practice />} />
          <Route path="path" element={<ReviewPath />} />
        </Route>
        <Route path="/teacher" element={<AppShell links={teacherLinks} userLabel="Teacher · Grade 7 Mathematics" home="/teacher" />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="learner" element={<LearnerView />} />
          <Route path="record" element={<PaperAssessment />} />
          <Route path="graph" element={<GraphReview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}