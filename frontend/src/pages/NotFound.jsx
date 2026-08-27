import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container py-5 text-center">
      <p className="hp-eyebrow">404</p>
      <h1 className="hp-h2">This path doesn't lead anywhere.</h1>
      <Link to="/" className="btn hp-btn-accent mt-3">Back home</Link>
    </div>
  )
}
