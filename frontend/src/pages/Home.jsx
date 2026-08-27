import { Link } from 'react-router-dom'
import StatusPipeline from '../components/StatusPipeline'

const DEMO_STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'exam_scheduled', label: 'Exam' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'hired', label: 'Hired' },
]

export default function Home() {
  return (
    <div className="hp-hero">
      <div className="container py-5">
        <p className="hp-eyebrow">Internal recruitment, made visible</p>
        <h1 className="hp-h1">
          Every hire is a path.
          <br />
          Now you can see it.
        </h1>
        <p className="hp-hero-sub">
          From requisition to offer — track exactly where every role and every candidate stands, at every stage.
        </p>
        <div className="d-flex flex-wrap gap-3 mb-5">
          <Link to="/jobs" className="btn hp-btn-accent">Browse open roles</Link>
          <Link to="/register" className="btn hp-btn-outline">Create an account</Link>
        </div>
        <div className="hp-hero-pipeline-demo">
          <p className="hp-label mb-3">A candidate's path, in one glance</p>
          <StatusPipeline stages={DEMO_STAGES} current="interview_scheduled" />
        </div>
      </div>
    </div>
  )
}
