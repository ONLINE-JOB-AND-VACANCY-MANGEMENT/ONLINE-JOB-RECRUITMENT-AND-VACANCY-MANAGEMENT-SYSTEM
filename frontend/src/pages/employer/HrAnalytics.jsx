import { useEffect, useState } from 'react'
import api from '../../services/api'

export default function HrAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/hr/analytics')
      .then(({ data }) => setAnalytics(data))
      .catch(() => setError('Could not load recruitment analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container py-5"><p className="hp-muted">Loading analytics…</p></div>
  if (error) return <div className="container py-5"><p className="text-danger">{error}</p></div>

  return (
    <div className="container py-5">
      <p className="hp-eyebrow">HR reports</p>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="hp-h1 mb-1">Recruitment analytics.</h1>
          <p className="hp-muted mb-0">A visual summary of recruitment activity and outcomes.</p>
        </div>
        <button className="btn hp-btn-outline btn-sm" onClick={() => exportCsv(analytics)}>Export data CSV</button>
      </div>

      <div className="row g-3 mb-4">
        <MetricCard label="Application conversion" value={`${analytics.application_conversion_rate}%`} />
        <MetricCard label="Average time to hire" value={analytics.average_days_to_hire == null ? '—' : `${analytics.average_days_to_hire} days`} />
      </div>

      <div className="row g-3">
        <ChartCard title="Applications per vacancy" items={analytics.applications_per_vacancy} labelKey="title" filename="applications-per-vacancy" />
        <ChartCard title="Most requested skills" items={analytics.most_requested_skills} filename="most-requested-skills" />
        <ChartCard title="Jobs by department" items={analytics.jobs_by_department} filename="jobs-by-department" />
        <ChartCard title="Jobs by category" items={analytics.jobs_by_category} filename="jobs-by-category" />
        <TrendCard items={analytics.monthly_trends} />
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="col-sm-6 col-lg-3">
      <div className="hp-card h-100">
        <p className="hp-card-meta mb-1">{label}</p>
        <p className="hp-h2 mb-0">{value}</p>
      </div>
    </div>
  )
}

function ChartCard({ title, items = [], labelKey = 'name', filename }) {
  return (
    <div className="col-md-6">
      <div className="hp-card h-100">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
          <h2 className="hp-h3 mt-0 mb-0">{title}</h2>
          <button className="btn hp-btn-outline btn-sm" onClick={() => exportChartAsPng(filename, title)}>PNG</button>
        </div>
        {items.length ? <BarChart id={filename} items={items} labelKey={labelKey} /> : <p className="hp-muted mb-0">No data yet.</p>}
      </div>
    </div>
  )
}

function BarChart({ id, items, labelKey }) {
  const width = 560
  const barHeight = 24
  const gap = 12
  const labelWidth = 150
  const chartWidth = width - labelWidth - 24
  const max = Math.max(...items.map((item) => Number(item.count) || 0), 1)
  const height = Math.max(items.length * (barHeight + gap) + 12, 54)

  return (
    <svg id={id} className="hp-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart">
      {items.map((item, index) => {
        const value = Number(item.count) || 0
        const y = index * (barHeight + gap)
        const label = String(item[labelKey] ?? 'Unassigned')
        return (
          <g key={`${label}-${index}`}>
            <text x="0" y={y + 16} className="hp-chart-label" fill="#002366">{truncate(label)}</text>
            <rect x={labelWidth} y={y} width={Math.max((value / max) * chartWidth, value ? 3 : 0)} height={barHeight} rx="5" className="hp-chart-bar" fill="#997950" />
            <text x={labelWidth + chartWidth + 8} y={y + 16} className="hp-chart-value" fill="#002366">{value}</text>
          </g>
        )
      })}
    </svg>
  )
}

function TrendCard({ items = [] }) {
  return (
    <div className="col-12">
      <div className="hp-card">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
          <h2 className="hp-h3 mt-0 mb-0">Monthly registrations and applications</h2>
          <button className="btn hp-btn-outline btn-sm" onClick={() => exportChartAsPng('monthly-trends', 'Monthly registrations and applications')}>PNG</button>
        </div>
        {items.length ? <TrendChart items={items} /> : <p className="hp-muted mb-0">No trend data yet.</p>}
      </div>
    </div>
  )
}

function TrendChart({ items }) {
  const width = 720
  const rowHeight = 34
  const labelWidth = 64
  const chartWidth = width - labelWidth - 150
  const max = Math.max(...items.flatMap((item) => [item.registrations, item.applications]), 1)

  return (
    <svg id="monthly-trends" className="hp-chart" viewBox={`0 0 ${width} ${items.length * rowHeight + 12}`} role="img" aria-label="Monthly registrations and applications chart">
      {items.map((item, index) => {
        const y = index * rowHeight
        const registrationWidth = (item.registrations / max) * chartWidth
        const applicationWidth = (item.applications / max) * chartWidth
        return (
          <g key={item.month}>
            <text x="0" y={y + 13} className="hp-chart-label" fill="#002366">{item.month}</text>
            <rect x={labelWidth} y={y} width={registrationWidth} height="10" rx="4" className="hp-trend-svg-registration" fill="#997950" />
            <rect x={labelWidth} y={y + 15} width={applicationWidth} height="10" rx="4" className="hp-trend-svg-application" fill="#2E7D32" />
            <text x={labelWidth + chartWidth + 8} y={y + 9} className="hp-chart-value" fill="#002366">{item.registrations} registrations</text>
            <text x={labelWidth + chartWidth + 8} y={y + 24} className="hp-chart-value" fill="#002366">{item.applications} applications</text>
          </g>
        )
      })}
    </svg>
  )
}

function truncate(value) {
  return value.length > 22 ? `${value.slice(0, 20)}…` : value
}

function exportChartAsPng(id, title) {
  const svg = document.getElementById(id)
  if (!svg || svg.tagName.toLowerCase() !== 'svg') return
  const svgData = new XMLSerializer().serializeToString(svg)
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1120
    canvas.height = Math.max(180, (image.height / image.width) * canvas.width)
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const link = document.createElement('a')
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`
}

function exportCsv(data) {
  const rows = [
    ['Metric', 'Value'],
    ['Application conversion rate', `${data.application_conversion_rate}%`],
    ['Average days to hire', data.average_days_to_hire ?? ''],
    ...data.applications_per_vacancy.map((item) => [`Applications: ${item.title}`, item.count]),
    ...data.most_requested_skills.map((item) => [`Skill: ${item.name}`, item.count]),
    ...data.jobs_by_department.map((item) => [`Department: ${item.name}`, item.count]),
    ...data.jobs_by_category.map((item) => [`Category: ${item.name}`, item.count]),
  ]
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  const link = document.createElement('a')
  link.download = 'recruitment-analytics.csv'
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
  link.click()
}
