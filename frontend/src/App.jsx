import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import JobFeed from './pages/JobFeed'
import JobDetail from './pages/JobDetail'
import ApplyForm from './pages/ApplyForm'
import MyApplications from './pages/MyApplications'
import EmployerJobs from './pages/employer/EmployerJobs'
import JobApplicants from './pages/employer/JobApplicants'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobFeed />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route
          path="/jobs/:id/apply"
          element={
            <ProtectedRoute roles={['job_seeker']}>
              <ApplyForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute roles={['job_seeker']}>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs"
          element={
            <ProtectedRoute roles={['employer']}>
              <EmployerJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/:id/applicants"
          element={
            <ProtectedRoute roles={['employer']}>
              <JobApplicants />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
