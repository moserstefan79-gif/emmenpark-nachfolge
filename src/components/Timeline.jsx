import { useMemo } from 'react'
import { DIMENSIONS, STATUS } from '../lib/db'

const STATUS_COLOR = { geplant: '#B8C7BD', in_arbeit: '#D4A23A', erledigt: '#1F3D32', gefaehrdet: '#B4432D', zurueckgestellt: '#9AA19D' }

/** Zeitachse: Phasen als Bänder, Meilensteine als Marker mit Verantwortlichen – «bis wann wer was». */
export default function Timeline({ phases, milestones, onSelect, from, to }) {
  const start = useMemo(() => new Date(from ?? Math.min(...phases.map((p) => +new Date(p.start_date)))), [phases, from])
  const end = useMemo(() => new Date(to ?? Math.max(...phases.map((p) => +new Date(p.end_date)))), [phases, to])
  const span = end - start || 1
  const x = (d) => Math.max(0, Math.min(100, ((new Date(d) - start) / span) * 100))

  // Quartalsraster
  const quarters = []
  for (let d = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1); d < end; d.setMonth(d.getMonth() + 3)) {
    quarters.push({ label: `Q${Math.floor(d.getMonth() / 3) + 1} ${String(d.getFullYear()).slice(2)}`, x: x(d) })
  }
  const todayX = x(new Date())

  // Zeilen: eine pro Phase, Meilensteine darin
  const rows = phases.map((p) => ({ phase: p, items: milestones.filter((m) => m.phase_id === p.id).sort((a, b) => a.due_date.localeCompare(b.due_date)) }))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Kopf */}
        <div className="relative h-7 border-b border-sand ml-56">
          {quarters.map((q) => (
            <div key={q.label} className="absolute top-0 h-full border-l border-sand/80 pl-1 text-[10px] font-semibold text-inkSoft" style={{ left: `${q.x}%` }}>{q.label}</div>
          ))}
        </div>
        {rows.map(({ phase, items }) => {
          const lanes = packLanes(items, x)
          const h = 26 + lanes.count * 30
          return (
            <div key={phase.id} className="flex border-b border-sand/70" style={{ minHeight: h }}>
              <div className="w-56 shrink-0 py-2 pr-3">
                <div className="text-xs font-bold text-forest">{phase.nr} · {phase.title}</div>
                <div className="text-[11px] text-inkSoft">{phase.subtitle}</div>
              </div>
              <div className="relative flex-1" style={{ height: h }}>
                <div className="absolute top-2 h-3 rounded-full opacity-70" style={{ left: `${x(phase.start_date)}%`, width: `${Math.max(0.5, x(phase.end_date) - x(phase.start_date))}%`, background: phase.color ?? '#1F3D32' }} />
                {quarters.map((q) => <div key={q.label} className="absolute top-0 bottom-0 border-l border-sand/50" style={{ left: `${q.x}%` }} />)}
                {todayX > 0 && todayX < 100 && <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gold" style={{ left: `${todayX}%` }} />}
                {items.map((m) => {
                  const lane = lanes.lane[m.id]
                  const left = x(m.due_date)
                  const flip = left > 70
                  return (
                    <button key={m.id} onClick={() => onSelect?.(m)} title={`${m.title} · ${m.owner_name ?? m.owner_label ?? ''} · ${m.due_date}`}
                      className="group absolute flex items-center gap-1 text-left" style={{ top: 22 + lane * 30, left: `${left}%`, transform: flip ? 'translateX(-100%)' : 'none', flexDirection: flip ? 'row-reverse' : 'row' }}>
                      <span className="h-3 w-3 shrink-0 rotate-45 border border-white shadow" style={{ background: STATUS_COLOR[m.status] }} />
                      <span className="max-w-[220px] truncate rounded bg-white/90 px-1.5 py-0.5 text-[11px] leading-tight text-ink shadow-sm group-hover:bg-gold/20">
                        <span className="font-semibold">{m.nr ? m.nr + ' ' : ''}{m.title}</span>
                        <span className="text-inkSoft"> · {m.owner_name ?? m.owner_label ?? '–'}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-inkSoft">
          {Object.entries(STATUS).map(([k, s]) => <span key={k} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rotate-45" style={{ background: STATUS_COLOR[k] }} />{s.label}</span>)}
          <span className="flex items-center gap-1"><span className="h-3 border-l-2 border-dashed border-gold" />heute</span>
        </div>
      </div>
    </div>
  )
}

function packLanes(items, x) {
  const lane = {}; const laneEnd = []
  const W = 22 // ungefähre Labelbreite in %
  items.forEach((m) => {
    const px = x(m.due_date)
    const flip = px > 70
    const from = flip ? px - W : px, to = flip ? px : px + W
    let l = laneEnd.findIndex((e) => e < from - 1)
    if (l === -1) { l = laneEnd.length; laneEnd.push(0) }
    laneEnd[l] = to
    lane[m.id] = l
  })
  return { lane, count: Math.max(1, laneEnd.length) }
}

export function DimensionDot({ d }) {
  const dim = DIMENSIONS[d]
  if (!dim) return null
  return <span className="chip text-white" style={{ background: dim.color }}>{dim.label}</span>
}
