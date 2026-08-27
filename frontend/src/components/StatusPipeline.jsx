/**
 * Reusable stage tracker — used for both requisition status (draft -> ... -> ready_to_post)
 * and application status (applied -> ... -> hired). The order genuinely encodes real
 * workflow progression, so a connected step indicator is the right shape for this data.
 */
export default function StatusPipeline({ stages, current, rejectedKey, rejectedLabel }) {
  const isRejected = rejectedKey && current === rejectedKey

  if (isRejected) {
    return (
      <div className="hp-pipeline hp-pipeline--rejected">
        <span className="hp-pipeline-dot hp-pipeline-dot--rejected" />
        <span className="hp-pipeline-label">{rejectedLabel || 'Rejected'}</span>
      </div>
    )
  }

  const currentIndex = stages.findIndex((s) => s.key === current)

  return (
    <div className="hp-pipeline">
      {stages.map((stage, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending'
        return (
          <div className="hp-pipeline-step" key={stage.key}>
            <span className={`hp-pipeline-dot hp-pipeline-dot--${state}`} />
            <span className={`hp-pipeline-label hp-pipeline-label--${state}`}>{stage.label}</span>
            {i < stages.length - 1 && (
              <span className={`hp-pipeline-line ${state === 'done' ? 'hp-pipeline-line--done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
