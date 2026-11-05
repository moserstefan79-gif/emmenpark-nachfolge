import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTable, MEETING_KIND, VISIBILITY, fmtDate } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Empty } from '../components/ui'
import DocList from '../components/DocList'

export default function Sitzungen() {
  const { isVR, profiles } = useAuth()
  const meetings = useTable('meetings', { order: { column: 'date', ascending: false } })
  const [sel, setSel] = useState(null)
  const [edit, setEdit] = useState(null)
  const now = new Date().toISOString().slice(0, 10)
  const name = (id) => profiles.find((p) => p.id === id)?.full_name

  const fields = [
    { name: 'title', label: 'Titel', type: 'text', required: true },
    { name: 'kind', label: 'Art', type: 'select', options: MEETING_KIND, half: true, required: true },
    { name: 'status', label: 'Status', type: 'select', options: { geplant: 'geplant', durchgefuehrt: 'durchgeführt', abgesagt: 'abgesagt' }, half: true },
    { name: 'date', label: 'Datum', type: 'date', half: true, required: true },
    { name: 'time_from', label: 'Beginn', type: 'time', half: true },
    { name: 'location', label: 'Ort', type: 'text', half: true },
    { name: 'chair_id', label: 'Sitzungsleitung', type: 'profile', half: true },
    { name: 'visibility', label: 'Sichtbarkeit', type: 'select', options: VISIBILITY, half: true },
    { name: 'notes', label: 'Notizen / Zweck', type: 'textarea' },
  ]

  const future = meetings.rows.filter((m) => m.date >= now).sort((a, b) => a.date.localeCompare(b.date))
  const past = meetings.rows.filter((m) => m.date < now)

  const List = ({ rows }) => rows.length ? rows.map((m) => (
    <button key={m.id} onClick={() => setSel(m)} className={`block w-full border-b border-sand/70 py-2 text-left hover:bg-cream ${sel?.id === m.id ? 'bg-cream' : ''}`}>
      <div className="flex justify-between gap-2 text-sm"><span className="font-semibold">{m.title}</span><span className="whitespace-nowrap text-xs text-inkSoft">{fmtDate(m.date)}</span></div>
      <div className="text-xs text-inkSoft">{MEETING_KIND[m.kind]} · Leitung: {name(m.chair_id) ?? '–'} · {m.status}</div>
    </button>
  )) : <Empty />

  return (
    <div>
      <PageHeader eyebrow="Verwaltungsrat" title="Sitzungen & Protokolle"
        intro="Jahresagenda, Traktanden, Beschlusskontrolle und Protokollablage. Sitzungsleitung und Traktandierung: Stefan Moser (vom VRP delegiert)."
        actions={isVR && <button className="btn-gold" onClick={() => setEdit({ kind: 'vr', status: 'geplant', visibility: 'vr' })}>+ Sitzung</button>} />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <Card eyebrow="Jahresagenda" title="Kommend"><List rows={future} /></Card>
          <Card title="Vergangen"><List rows={past} /></Card>
        </div>
        <div className="lg:col-span-3">
          {sel ? <MeetingDetail meeting={sel} onEdit={() => setEdit(sel)} onChanged={async () => { await meetings.reload(); setSel(meetings.rows.find((m) => m.id === sel.id) ?? sel) }} /> : <Card><Empty>Sitzung auswählen.</Empty></Card>}
        </div>
      </div>
      <Modal open={!!edit} title={edit?.id ? 'Sitzung bearbeiten' : 'Neue Sitzung'} onClose={() => setEdit(null)}>
        {edit && <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { const r = await meetings.save(v); setEdit(null); setSel(r) }} onDelete={async (id) => { await meetings.remove(id); setEdit(null); setSel(null) }} />}
      </Modal>
    </div>
  )
}

function MeetingDetail({ meeting, onEdit }) {
  const { isVR, profiles } = useAuth()
  const items = useTable('agenda_items', { order: { column: 'nr' }, filter: (q) => q.eq('meeting_id', meeting.id), deps: [meeting.id] })
  const [edit, setEdit] = useState(null)
  const name = (id) => profiles.find((p) => p.id === id)?.full_name ?? '–'
  const total = items.rows.reduce((s, i) => s + (i.duration_min ?? 0), 0)

  const fields = [
    { name: 'nr', label: 'Nr.', type: 'number', half: true, required: true },
    { name: 'kind', label: 'Art', type: 'select', half: true, options: { information: 'Information', diskussion: 'Diskussion', beschluss: 'Beschluss' } },
    { name: 'title', label: 'Traktandum', type: 'text', required: true },
    { name: 'presenter_id', label: 'Referent/in', type: 'profile', half: true },
    { name: 'duration_min', label: 'Dauer (Min.)', type: 'number', half: true },
    { name: 'decision', label: 'Beschluss / Ergebnis', type: 'textarea', hint: 'Wird zur Beschlusskontrolle verwendet.' },
    { name: 'follow_up', label: 'Pendenz', type: 'text' },
    { name: 'follow_up_owner_id', label: 'Pendenz – wer', type: 'profile', half: true },
    { name: 'follow_up_due', label: 'Pendenz – bis wann', type: 'date', half: true },
    { name: 'done', label: 'Pendenz erledigt', type: 'checkbox', half: true },
  ]

  return (
    <div className="space-y-4">
      <Card eyebrow={MEETING_KIND[meeting.kind]} title={meeting.title} actions={isVR && <button className="btn-ghost text-xs" onClick={onEdit}>Bearbeiten</button>}>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <div><div className="eyebrow">Datum</div>{fmtDate(meeting.date)}{meeting.time_from ? ', ' + meeting.time_from.slice(0, 5) : ''}</div>
          <div><div className="eyebrow">Ort</div>{meeting.location ?? '–'}</div>
          <div><div className="eyebrow">Leitung</div>{name(meeting.chair_id)}</div>
          <div><div className="eyebrow">Status</div>{meeting.status}</div>
        </div>
        {meeting.notes && <p className="mt-3 text-sm text-inkSoft">{meeting.notes}</p>}
      </Card>

      <Card eyebrow={`${total} Min.`} title="Traktanden & Beschlüsse" actions={isVR && <button className="btn-ghost text-xs" onClick={() => setEdit({ meeting_id: meeting.id, nr: items.rows.length + 1, kind: 'information' })}>+ Traktandum</button>}>
        {items.rows.length ? items.rows.map((i) => (
          <button key={i.id} onClick={() => isVR && setEdit(i)} className="block w-full border-b border-sand/70 py-2 text-left text-sm hover:bg-cream">
            <div className="flex gap-2"><span className="w-6 font-bold text-goldSoft">{i.nr}</span>
              <div className="flex-1">
                <div className="font-semibold">{i.title} <span className="chip bg-sand ml-1">{i.kind}</span></div>
                <div className="text-xs text-inkSoft">{name(i.presenter_id)}{i.duration_min ? ` · ${i.duration_min}'` : ''}</div>
                {i.decision && <div className="mt-1 rounded bg-forest/5 p-2 text-xs"><span className="font-semibold">Beschluss:</span> {i.decision}</div>}
                {i.follow_up && <div className={`mt-1 text-xs ${i.done ? 'line-through text-inkSoft' : ''}`}>Pendenz: {i.follow_up} · {name(i.follow_up_owner_id)} · {fmtDate(i.follow_up_due)}</div>}
              </div></div>
          </button>
        )) : <Empty>Noch keine Traktanden.</Empty>}
      </Card>

      <Card eyebrow="Ablage" title="Protokoll & Unterlagen">
        <DocList meetingId={meeting.id} defaultCategory="protokoll" defaultVisibility={meeting.visibility} />
      </Card>

      <Modal open={!!edit} title="Traktandum" onClose={() => setEdit(null)}>
        {edit && <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { await items.save(v); setEdit(null) }} onDelete={async (id) => { await items.remove(id); setEdit(null) }} />}
      </Modal>
    </div>
  )
}
