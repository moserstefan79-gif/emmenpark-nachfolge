import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTable, DIMENSIONS, STATUS, fmtDate, VISIBILITY } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Empty, StatusChip } from '../components/ui'

/** Werkzeug 2: Zieltreppe – Zukunftsbild (Gipfel) → Zwischenstufen (Zustände) → 3-Monats-Etappen */
export default function Zieltreppe({ scope = 'unternehmen', ownerId = null, embedded = false }) {
  const { isVR, profile, profiles } = useAuth()
  const zt = useTable('zieltreppen', { order: { column: 'updated_at', ascending: false }, filter: (q) => ownerId ? q.eq('owner_id', ownerId) : q.eq('scope', scope), deps: [scope, ownerId] })
  const [sel, setSel] = useState(0)
  const t = zt.rows[sel]
  const stufen = useTable('zieltreppe_stufen', { order: { column: 'nr' }, filter: (q) => q.eq('zieltreppe_id', t?.id ?? '00000000-0000-0000-0000-000000000000'), deps: [t?.id] })
  const etappen = useTable('zieltreppe_etappen', { order: { column: 'quarter' }, filter: (q) => q.in('stufe_id', stufen.rows.map((s) => s.id).concat('00000000-0000-0000-0000-000000000000')), deps: [stufen.rows.map((s) => s.id).join()] })
  const [editT, setEditT] = useState(null)
  const [editS, setEditS] = useState(null)
  const [editE, setEditE] = useState(null)
  const canEdit = isVR || t?.owner_id === profile?.id
  const name = (id) => profiles.find((p) => p.id === id)?.full_name?.split(' ')[0]

  const tFields = [
    { name: 'title', label: 'Titel', type: 'text', required: true },
    { name: 'zukunftsbild', label: 'Zukunftsbild in 5–10 Jahren (der Gipfel)', type: 'textarea', rows: 5, hint: '«In fünf Jahren möchte ich …» – wie fühlt sich ein normaler Tag an? Welche Rolle? Wie unabhängig ist das Unternehmen?' },
    { name: 'horizon_years', label: 'Horizont (Jahre)', type: 'number', half: true },
    { name: 'visibility', label: 'Sichtbarkeit', type: 'select', half: true, options: VISIBILITY },
  ]
  const sFields = [
    { name: 'nr', label: 'Stufe Nr.', type: 'number', half: true, required: true },
    { name: 'target_date', label: 'Erreicht bis', type: 'date', half: true },
    { name: 'zustand', label: 'Zwischenstufe – beschreibt einen Zustand, kein To-do', type: 'textarea', required: true, hint: 'z.B. «Das Unternehmen kann einen längeren Ausfall von mir überbrücken.»' },
    { name: 'dimension', label: 'Hebel', type: 'select', half: true, options: Object.fromEntries(Object.entries(DIMENSIONS).map(([k, d]) => [k, d.label])) },
    { name: 'status', label: 'Status', type: 'select', half: true, options: Object.fromEntries(Object.entries(STATUS).map(([k, s]) => [k, s.label])) },
  ]
  const eFields = [
    { name: 'title', label: '3-Monats-Etappe – was tun wir konkret?', type: 'text', required: true },
    { name: 'quarter', label: 'Quartal (z.B. 2027-Q2)', type: 'text', half: true, placeholder: '2027-Q2' },
    { name: 'owner_id', label: 'Wer', type: 'profile', half: true },
    { name: 'status', label: 'Status', type: 'select', half: true, options: Object.fromEntries(Object.entries(STATUS).map(([k, s]) => [k, s.label])) },
  ]

  const header = !embedded && (
    <PageHeader eyebrow="Werkzeug 2" title="Zieltreppe"
      intro="Vom grossen Berg zur gehbaren Strecke: Oben steht das Zukunftsbild. Von dort aus rückwärts: Welche Zustände müssen vorher erreicht sein? Und was tun wir in den nächsten drei Monaten konkret?"
      actions={<>
        {zt.rows.length > 1 && <select value={sel} onChange={(e) => setSel(+e.target.value)}>{zt.rows.map((z, i) => <option key={z.id} value={i}>{z.title}</option>)}</select>}
        {(isVR || scope === 'person') && <button className="btn-gold" onClick={() => setEditT({ scope, owner_id: ownerId ?? (scope === 'person' ? profile?.id : null), horizon_years: 5, visibility: scope === 'person' ? 'vr' : 'vr' })}>+ Zieltreppe</button>}
      </>} />
  )

  if (!t) return <div>{header}<Card><Empty>Noch keine Zieltreppe. {canEdit || scope === 'person' ? 'Legen Sie mit dem Zukunftsbild los.' : ''}</Empty></Card>
    <Modal open={!!editT} title="Zieltreppe" onClose={() => setEditT(null)}>{editT && <EntityForm fields={tFields} initial={editT} onSubmit={async (v) => { await zt.save(v); setEditT(null) }} />}</Modal></div>

  const n = stufen.rows.length
  return (
    <div>
      {header}
      {/* Gipfel */}
      <div className="rounded-xl bg-forest p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div><div className="eyebrow !text-gold">Gipfel · Zukunftsbild in {t.horizon_years} Jahren</div><div className="font-serif text-xl font-bold">{t.title}</div></div>
          {canEdit && <button className="btn-gold text-xs" onClick={() => setEditT(t)}>Bearbeiten</button>}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/90">{t.zukunftsbild || 'Zukunftsbild noch nicht beschrieben.'}</p>
      </div>

      {/* Treppe */}
      <div className="mt-4 space-y-2">
        {stufen.rows.slice().reverse().map((s, i) => {
          const idx = n - 1 - i
          const ets = etappen.rows.filter((e) => e.stufe_id === s.id)
          const d = DIMENSIONS[s.dimension]
          return (
            <div key={s.id} className="flex" style={{ paddingLeft: `${Math.min(idx, 8) * 4}%` }}>
              <div className="card flex-1 border-l-8 p-4" style={{ borderLeftColor: d?.color ?? '#B8C7BD' }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="eyebrow">Stufe {s.nr} · {d?.label ?? ''} · bis {fmtDate(s.target_date)}</div>
                    <button className="text-left font-semibold text-forest hover:underline" onClick={() => canEdit && setEditS(s)}>{s.zustand}</button>
                  </div>
                  <StatusChip status={s.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ets.map((e) => (
                    <button key={e.id} onClick={() => canEdit && setEditE(e)} className={`rounded-md border px-2 py-1 text-left text-xs ${e.status === 'erledigt' ? 'border-forest/30 bg-forest/5 line-through text-inkSoft' : 'border-sand bg-cream'}`}>
                      <span className="font-semibold text-goldSoft">{e.quarter}</span> {e.title}{e.owner_id && <span className="text-inkSoft"> · {name(e.owner_id)}</span>}
                    </button>
                  ))}
                  {canEdit && <button className="rounded-md border border-dashed border-sand px-2 py-1 text-xs text-inkSoft hover:bg-cream" onClick={() => setEditE({ stufe_id: s.id, status: 'geplant' })}>+ Etappe (3 Monate)</button>}
                </div>
              </div>
            </div>
          )
        })}
        {canEdit && <div className="pt-2"><button className="btn-ghost" onClick={() => setEditS({ zieltreppe_id: t.id, nr: n + 1, status: 'geplant' })}>+ Zwischenstufe</button></div>}
        {!n && <Empty>Noch keine Zwischenstufen – welche Zustände müssen vor dem Gipfel erreicht sein?</Empty>}
      </div>

      <Modal open={!!editT} title="Zieltreppe" onClose={() => setEditT(null)}>{editT && <EntityForm fields={tFields} initial={editT} onSubmit={async (v) => { await zt.save(v); setEditT(null) }} onDelete={async (id) => { await zt.remove(id); setEditT(null); setSel(0) }} />}</Modal>
      <Modal open={!!editS} title="Zwischenstufe" onClose={() => setEditS(null)}>{editS && <EntityForm fields={sFields} initial={editS} onSubmit={async (v) => { await stufen.save(v); setEditS(null) }} onDelete={async (id) => { await stufen.remove(id); setEditS(null) }} />}</Modal>
      <Modal open={!!editE} title="3-Monats-Etappe" onClose={() => setEditE(null)}>{editE && <EntityForm fields={eFields} initial={editE} onSubmit={async (v) => { await etappen.save(v); setEditE(null) }} onDelete={async (id) => { await etappen.remove(id); setEditE(null) }} />}</Modal>
    </div>
  )
}
