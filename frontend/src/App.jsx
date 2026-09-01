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
import ManagerRequisitions from './pages/manager/ManagerRequisitions'
import RequisitionForm from './pages/manager/RequisitionForm'
import EmployerRequisitions from './pages/employer/EmployerRequisitions'
import CreateJobFromRequisition from './pages/employer/CreateJobFromRequisition'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCategories from './pages/admin/AdminCategories'
import AdminSkills from './pages/admin/AdminSkills'
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
        <Route
          path="/manager/requisitions"
          element={
            <ProtectedRoute roles={['manager']}>
              <ManagerRequisitions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/requisitions/new"
          element={
            <ProtectedRoute roles={['manager']}>
              <RequisitionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/requisitions/:id/edit"
          element={
            <ProtectedRoute roles={['manager']}>
              <RequisitionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/requisitions"
          element={
            <ProtectedRoute roles={['employer']}>
              <EmployerRequisitions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/requisitions/:id/create-job"
          element={
            <ProtectedRoute roles={['employer']}>
              <CreateJobFromRequisition />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/skills"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminSkills />
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
