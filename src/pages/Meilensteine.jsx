import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTable, DIMENSIONS, STATUS, VISIBILITY, fmtDate } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Table, StatusChip } from '../components/ui'
import Timeline, { DimensionDot } from '../components/Timeline'

export default function Meilensteine() {
  const { isVR, profile } = useAuth()
  const phases = useTable('phases', { order: { column: 'nr' } })
  const ms = useTable('v_milestones', { order: { column: 'due_date' } })
  const [edit, setEdit] = useState(null)
  const [view, setView] = useState('zeitachse')
  const [filter, setFilter] = useState({ dimension: '', status: '', phase: '' })

  const rows = ms.rows.filter((m) => (!filter.dimension || m.dimension === filter.dimension) && (!filter.status || m.status === filter.status) && (!filter.phase || m.phase_id === filter.phase))

  const fields = [
    { name: 'title', label: 'Meilenstein', type: 'text', required: true },
    { name: 'nr', label: 'Nr.', type: 'text', half: true },
    { name: 'phase_id', label: 'Phase', type: 'select', half: true, options: Object.fromEntries(phases.rows.map((p) => [p.id, `${p.nr} · ${p.title}`])) },
    { name: 'description', label: 'Beschreibung / Deliverable', type: 'textarea' },
    { name: 'dimension', label: 'Hebel / Dimension', type: 'select', half: true, options: Object.fromEntries(Object.entries(DIMENSIONS).map(([k, d]) => [k, d.label])) },
    { name: 'status', label: 'Status', type: 'select', half: true, options: Object.fromEntries(Object.entries(STATUS).map(([k, s]) => [k, s.label])), required: true },
    { name: 'owner_id', label: 'Verantwortlich (Mitglied)', type: 'profile', half: true },
    { name: 'owner_label', label: 'Verantwortlich (Freitext, z.B. EXT Recht)', type: 'text', half: true },
    { name: 'start_date', label: 'Start', type: 'date', half: true },
    { name: 'due_date', label: 'Fällig bis', type: 'date', half: true, required: true },
    { name: 'visibility', label: 'Sichtbarkeit', type: 'select', half: true, options: VISIBILITY },
    { name: 'source', label: 'Quelle (Fahrplan / Vorgehensplan)', type: 'text', half: true },
  ]
  const canEdit = (m) => isVR || m?.owner_id === profile?.id

  const save = async (v) => {
    const { phase_title, phase_nr, owner_name, ...clean } = v
    await ms.save(clean, 'milestones'); setEdit(null)
  }

  return (
    <div>
      <PageHeader eyebrow="Zieltreppe · Etappen" title="Meilensteinplan"
        intro="Vom grossen Berg zur gehbaren Strecke: Phasen als Bänder, Meilensteine als Marker – bis wann, wer, was. Klicken Sie einen Marker, um Status oder Termin anzupassen."
        actions={<>
          <div className="flex rounded-md border border-sand bg-white p-0.5 text-sm">
            {['zeitachse', 'liste'].map((v) => <button key={v} onClick={() => setView(v)} className={`rounded px-3 py-1 ${view === v ? 'bg-forest text-white' : 'text-forest'}`}>{v === 'zeitachse' ? 'Zeitachse' : 'Liste'}</button>)}
          </div>
          {isVR && <button className="btn-gold" onClick={() => setEdit({ status: 'geplant', visibility: 'vr', due_date: '' })}>+ Meilenstein</button>}
        </>} />

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <select value={filter.phase} onChange={(e) => setFilter({ ...filter, phase: e.target.value })}><option value="">Alle Phasen</option>{phases.rows.map((p) => <option key={p.id} value={p.id}>{p.nr} · {p.title}</option>)}</select>
        <select value={filter.dimension} onChange={(e) => setFilter({ ...filter, dimension: e.target.value })}><option value="">Alle Hebel</option>{Object.entries(DIMENSIONS).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}</select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}><option value="">Alle Status</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>
        <div className="text-sm text-inkSoft self-center">{rows.length} Meilensteine</div>
      </div>

      <Card>
        {view === 'zeitachse' && phases.rows.length > 0 && <Timeline phases={phases.rows} milestones={rows} onSelect={(m) => setEdit(m)} />}
        {view === 'liste' && (
          <Table rows={rows} onRow={(m) => setEdit(m)} cols={[
            { key: 'nr', label: 'Nr.' },
            { key: 'title', label: 'Meilenstein', render: (m) => <><div className="font-semibold">{m.title}</div><div className="text-xs text-inkSoft">{m.description}</div></> },
            { key: 'phase', label: 'Phase', render: (m) => <span className="text-xs">{m.phase_nr} · {m.phase_title}</span> },
            { key: 'dimension', label: 'Hebel', render: (m) => <DimensionDot d={m.dimension} /> },
            { key: 'owner', label: 'Wer', render: (m) => m.owner_name ?? m.owner_label ?? '–' },
            { key: 'due_date', label: 'Bis wann', render: (m) => <span className="whitespace-nowrap">{fmtDate(m.due_date)}</span> },
            { key: 'status', label: 'Status', render: (m) => <StatusChip status={m.status} /> },
          ]} />
        )}
      </Card>

      <Modal open={!!edit} title={edit?.id ? `Meilenstein ${edit.nr ?? ''}` : 'Neuer Meilenstein'} onClose={() => setEdit(null)}>
        {edit && (canEdit(edit)
          ? <EntityForm fields={isVR ? fields : fields.filter((f) => ['status', 'description'].includes(f.name))} initial={edit} onSubmit={save} onDelete={isVR ? async (id) => { await ms.remove(id, 'milestones'); setEdit(null) } : undefined} />
          : <ReadOnly m={edit} />)}
      </Modal>
    </div>
  )
}

function ReadOnly({ m }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="text-lg font-bold">{m.title}</div>
      <p>{m.description}</p>
      <div className="grid grid-cols-2 gap-2 text-xs text-inkSoft">
        <div>Phase: {m.phase_nr} · {m.phase_title}</div><div>Hebel: {DIMENSIONS[m.dimension]?.label}</div>
        <div>Wer: {m.owner_name ?? m.owner_label}</div><div>Bis wann: {fmtDate(m.due_date)}</div>
      </div>
      <StatusChip status={m.status} />
    </div>
  )
}
