import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTable, DIMENSIONS, fmtDate, MEETING_KIND, STATUS } from '../lib/db'
import { PageHeader, Card, StatusChip, Stat, Empty } from '../components/ui'

export default function Dashboard() {
  const { profile, isVR } = useAuth()
  const ms = useTable('v_milestones', { order: { column: 'due_date' } })
  const meetings = useTable('meetings', { order: { column: 'date' } })
  const canvas = useTable('nf_canvas', { order: { column: 'assessment_date', ascending: false } })
  const fields = useTable('nf_canvas_fields', { deps: [canvas.rows.length] })
  const latest = canvas.rows[0]
  const latestFields = latest ? fields.rows.filter((f) => f.canvas_id === latest.id) : []

  const now = new Date().toISOString().slice(0, 10)
  const open = ms.rows.filter((m) => !['erledigt', 'zurueckgestellt'].includes(m.status))
  const overdue = open.filter((m) => m.due_date < now)
  const next = open.filter((m) => m.due_date >= now).slice(0, 6)
  const mine = open.filter((m) => m.owner_id === profile?.id).slice(0, 5)
  const upcoming = meetings.rows.filter((m) => m.date >= now).slice(0, 4)
  const done = ms.rows.filter((m) => m.status === 'erledigt').length

  return (
    <div>
      <PageHeader eyebrow="Cockpit" title={`Willkommen, ${profile?.full_name?.split(' ')[0] ?? ''}`}
        intro="Der Nachfolgeprozess der Emmenpark AG folgt den vier Hebeln der Nachfolgefähigkeit: Fundament, Verwaltungsrat, Organisation & Team, Person & Rolle. Hier sehen Sie, wo wir stehen und was als Nächstes ansteht." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Meilensteine" value={`${done} / ${ms.rows.length}`} sub="erledigt" />
        <Stat label="Überfällig" value={overdue.length} tone={overdue.length ? 'text-red-700' : 'text-forest'} sub="Termin überschritten" />
        <Stat label="In Arbeit" value={ms.rows.filter((m) => m.status === 'in_arbeit').length} />
        <Stat label="Nächste Sitzung" value={upcoming[0] ? fmtDate(upcoming[0].date) : '–'} sub={upcoming[0]?.title} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {Object.entries(DIMENSIONS).map(([k, d]) => {
          const f = latestFields.find((x) => x.dimension === k)
          const n = open.filter((m) => m.dimension === k).length
          return (
            <Link to="/instrumente/nf-canvas" key={k} className="card p-4 hover:shadow-md transition border-t-4" style={{ borderTopColor: d.color }}>
              <div className="eyebrow">{d.short}</div>
              <div className="font-serif text-lg font-bold text-forest">{d.label}</div>
              <div className="mt-1 text-xs text-inkSoft">{d.hint}</div>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => <span key={i} className="h-2 flex-1 rounded-full" style={{ background: f?.score >= i ? d.color : '#E8E2D3' }} />)}
              </div>
              <div className="mt-1 text-[11px] text-inkSoft">Reifegrad {f?.score ?? '–'}/5 · {n} offene Meilensteine</div>
            </Link>
          )
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card eyebrow="Bis wann · wer · was" title="Nächste Meilensteine" className="lg:col-span-2" actions={<Link className="btn-ghost text-xs" to="/meilensteine">Zeitachse →</Link>}>
          {overdue.length > 0 && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm">
              <div className="font-semibold text-red-800">{overdue.length} überfällig</div>
              {overdue.slice(0, 4).map((m) => <div key={m.id} className="text-red-900/80">{m.nr} {m.title} · {m.owner_name ?? m.owner_label} · {fmtDate(m.due_date)}</div>)}
            </div>
          )}
          {next.length ? next.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-3 border-b border-sand/70 py-2 text-sm">
              <div><span className="font-semibold">{m.nr} {m.title}</span><div className="text-xs text-inkSoft">{m.owner_name ?? m.owner_label ?? '–'} · {m.phase_title}</div></div>
              <div className="text-right text-xs whitespace-nowrap"><div className="font-semibold">{fmtDate(m.due_date)}</div><StatusChip status={m.status} /></div>
            </div>
          )) : <Empty />}
        </Card>
        <div className="space-y-4">
          <Card eyebrow="Agenda" title="Kommende Sitzungen" actions={isVR && <Link className="btn-ghost text-xs" to="/vr/sitzungen">alle →</Link>}>
            {upcoming.length ? upcoming.map((m) => (
              <div key={m.id} className="border-b border-sand/70 py-2 text-sm">
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs text-inkSoft">{MEETING_KIND[m.kind]} · {fmtDate(m.date)}{m.time_from ? ' · ' + m.time_from.slice(0, 5) : ''}</div>
              </div>
            )) : <Empty>Keine Sitzungen geplant.</Empty>}
          </Card>
          <Card eyebrow="Mein Bereich" title="Meine Aufgaben" actions={<Link className="btn-ghost text-xs" to="/mein-bereich">→</Link>}>
            {mine.length ? mine.map((m) => <div key={m.id} className="border-b border-sand/70 py-1.5 text-sm">{m.nr} {m.title} <span className="text-xs text-inkSoft">· {fmtDate(m.due_date)}</span></div>) : <Empty>Keine offenen Aufgaben.</Empty>}
          </Card>
        </div>
      </div>
      {latest && <p className="mt-4 text-xs text-inkSoft">Reifegrade aus «{latest.title}» ({fmtDate(latest.assessment_date)}), Typmuster: {latest.typmuster ?? '–'}.</p>}
    </div>
  )
}
