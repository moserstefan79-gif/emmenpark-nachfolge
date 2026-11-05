import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTable, fmtDate, VISIBILITY, quarterOf, DIMENSIONS } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Empty, JsonList } from '../components/ui'

/** Werkzeug 3: Review & Erfolgscheck – drei Fragen, alle drei Monate */
export function Reviews() {
  const { isVR, isGL } = useAuth()
  const rv = useTable('reviews', { order: { column: 'review_date', ascending: false } })
  const [edit, setEdit] = useState(null)
  const [entscheide, setEntscheide] = useState([])
  const open = (r) => { setEdit(r); setEntscheide(r.entscheide ?? []) }
  const fields = [
    { name: 'team', label: 'Team', type: 'select', half: true, options: { VR: 'Verwaltungsrat', GL: 'Geschäftsleitung', 'VR+GL': 'VR + GL' }, required: true },
    { name: 'period', label: 'Etappe / Quartal', type: 'text', half: true, required: true, placeholder: '2027-Q2' },
    { name: 'review_date', label: 'Datum', type: 'date', half: true, required: true },
    { name: 'visibility', label: 'Sichtbarkeit', type: 'select', half: true, options: VISIBILITY },
    { name: 'gelungen', label: '1 · Was ist uns in den letzten Wochen gelungen?', type: 'textarea', hint: 'Kleine Erfolge bewusst würdigen – sie verstärken das Verhalten, das wir uns wünschen.' },
    { name: 'abgekommen', label: '2 · Wo sind wir vom Weg abgekommen – und warum?', type: 'textarea', hint: 'Ehrlich, ohne Schuldzuweisung. Was kostet uns unnötig Kraft? Was lassen wir bewusst weg?' },
    { name: 'naechstes', label: '3 · Was braucht es jetzt als Nächstes?', type: 'textarea', hint: 'Zwei bis drei Entscheidungen für die nächste Etappe – kein neuer grosser Plan.' },
  ]
  return (
    <div>
      <PageHeader eyebrow="Werkzeug 3" title="Review & Erfolgscheck"
        intro="Kurze, regelmässige Haltepunkte im Licht der Zieltreppe: Was ist gelungen? Wo abgekommen? Was braucht es jetzt? Eine bis anderthalb Stunden, alle drei Monate – und jede Runde wird ein verbindliches Update der Zieltreppe."
        actions={<button className="btn-gold" onClick={() => open({ team: isGL ? 'GL' : 'VR', period: quarterOf(new Date()), review_date: new Date().toISOString().slice(0, 10), visibility: isGL ? 'gl' : 'vr', entscheide: [] })}>+ Review</button>} />
      <div className="grid gap-3 md:grid-cols-2">
        {rv.rows.length ? rv.rows.map((r) => (
          <button key={r.id} onClick={() => open(r)} className="card p-4 text-left hover:shadow-md">
            <div className="flex justify-between"><span className="eyebrow">{r.team} · {r.period}</span><span className="text-xs text-inkSoft">{fmtDate(r.review_date)}</span></div>
            <div className="mt-2 grid gap-2 text-xs md:grid-cols-3">
              <div><div className="font-semibold text-forest">Gelungen</div><p className="line-clamp-4">{r.gelungen || '–'}</p></div>
              <div><div className="font-semibold text-red-800">Abgekommen</div><p className="line-clamp-4">{r.abgekommen || '–'}</p></div>
              <div><div className="font-semibold text-goldSoft">Nächstes</div><p className="line-clamp-4">{r.naechstes || '–'}</p></div>
            </div>
            {r.entscheide?.length > 0 && <div className="mt-2 text-xs text-inkSoft">{r.entscheide.length} Entscheide: {r.entscheide.map((e) => `${e.typ ?? ''} ${e.text}`).join(' · ')}</div>}
          </button>
        )) : <Empty>Noch kein Review. Der erste Haltepunkt ist nach der ersten 3-Monats-Etappe fällig.</Empty>}
      </div>
      <Modal open={!!edit} title="Review & Erfolgscheck" onClose={() => setEdit(null)} wide>
        {edit && <>
          <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { await rv.save({ ...v, entscheide }); setEdit(null) }} onDelete={async (id) => { await rv.remove(id); setEdit(null) }} />
          <div className="mt-4 border-t border-sand pt-3">
            <label>Entscheide für die nächste Etappe (fortführen · weglassen · neu probieren)</label>
            <JsonList value={entscheide} onChange={setEntscheide} addLabel="Entscheid" columns={[{ key: 'typ', label: 'Typ', type: 'select', options: ['fortführen', 'weglassen', 'neu'], w: '1fr' }, { key: 'text', label: 'Entscheid', w: '3fr' }, { key: 'owner', label: 'Wer', w: '1fr' }]} />
            <p className="mt-1 text-xs text-inkSoft">Entscheide werden mit «Speichern» oben übernommen.</p>
          </div>
        </>}
      </Modal>
    </div>
  )
}

/** Werkzeug 4: Retrospektive – der Blick auf das Wie */
export function Retros() {
  const { isGL } = useAuth()
  const rt = useTable('retrospectives', { order: { column: 'retro_date', ascending: false } })
  const [edit, setEdit] = useState(null)
  const [checkin, setCheckin] = useState([])
  const [exp, setExp] = useState([])
  const open = (r) => { setEdit(r); setCheckin(r.checkin ?? []); setExp(r.experimente ?? []) }
  const fields = [
    { name: 'team', label: 'Team', type: 'select', half: true, options: { GL: 'Geschäftsleitung', VR: 'Verwaltungsrat', 'VR+GL': 'VR + GL' }, required: true },
    { name: 'retro_date', label: 'Datum', type: 'date', half: true, required: true },
    { name: 'moderator_id', label: 'Moderation (idealerweise nicht der Inhaber)', type: 'profile', half: true },
    { name: 'visibility', label: 'Sichtbarkeit', type: 'select', half: true, options: VISIBILITY },
    { name: 'arbeitsabkommen', label: 'Arbeitsabkommen (3–5 Spielregeln)', type: 'textarea', rows: 2, hint: 'Ich-Form statt Etiketten · keine Schuldigen · was hier gesagt wird, bleibt im Raum · keine Handys.' },
    { name: 'gut', label: '1 · Sammeln – was war gut?', type: 'textarea' },
    { name: 'schwierig', label: '1 · Sammeln – was war schwierig?', type: 'textarea' },
    { name: 'themen', label: '2 · Bündeln – welche Themen tauchen immer wieder auf?', type: 'textarea' },
    { name: 'vertiefung', label: '3 · Vertiefen – was steckt dahinter? (fragen, nicht verteidigen)', type: 'textarea' },
  ]
  return (
    <div>
      <PageHeader eyebrow="Werkzeug 4" title="Retrospektiven"
        intro="Im Unterschied zum Review geht es hier um das Wie: Wie erleben wir unsere Zusammenarbeit, unsere Sitzungen, unsere Entscheidungen? 60–90 Minuten, alle vier bis acht Wochen, immer derselbe Ablauf: Check-in, Sammeln, Bündeln, Vertiefen, kleine Experimente."
        actions={<button className="btn-gold" onClick={() => open({ team: 'GL', retro_date: new Date().toISOString().slice(0, 10), visibility: 'gl', checkin: [], experimente: [] })}>+ Retrospektive</button>} />
      <div className="grid gap-3 md:grid-cols-2">
        {rt.rows.length ? rt.rows.map((r) => (
          <button key={r.id} onClick={() => open(r)} className="card p-4 text-left hover:shadow-md">
            <div className="flex justify-between"><span className="eyebrow">{r.team}</span><span className="text-xs text-inkSoft">{fmtDate(r.retro_date)}</span></div>
            {r.checkin?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{r.checkin.map((c, i) => <span key={i} className="chip bg-sand">{c.name}: {c.wort}</span>)}</div>}
            <div className="mt-2 text-xs"><span className="font-semibold">Themen:</span> {r.themen || '–'}</div>
            {r.experimente?.length > 0 && <div className="mt-1 text-xs text-goldSoft">{r.experimente.length} Experimente bis zur nächsten Retro</div>}
          </button>
        )) : <Empty>Noch keine Retrospektive.</Empty>}
      </div>
      <Modal open={!!edit} title="Retrospektive" onClose={() => setEdit(null)} wide>
        {edit && <>
          <div className="mb-3"><label>Check-in – ein Wort pro Person</label>
            <JsonList value={checkin} onChange={setCheckin} addLabel="Person" columns={[{ key: 'name', label: 'Name', w: '1fr' }, { key: 'wort', label: 'Wort («voll», «stolz», «durchzogen»)', w: '2fr' }]} /></div>
          <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { await rt.save({ ...v, checkin, experimente: exp }); setEdit(null) }} onDelete={async (id) => { await rt.remove(id); setEdit(null) }} />
          <div className="mt-4 border-t border-sand pt-3"><label>4 · Entscheiden – zwei, maximal drei kleine Experimente bis zur nächsten Retro</label>
            <JsonList value={exp} onChange={setExp} addLabel="Experiment" columns={[{ key: 'text', label: 'Experiment', w: '3fr' }, { key: 'bis', label: 'Bis', type: 'date', w: '1fr' }, { key: 'ergebnis', label: 'Hat es geholfen?', w: '2fr' }]} /></div>
        </>}
      </Modal>
    </div>
  )
}

/** 12-Monats-Weg: vier Quartale, je ein Hauptthema – abgeleitet aus Zieltreppe-Etappen und Meilensteinen */
export function Weg12() {
  const ms = useTable('v_milestones', { order: { column: 'due_date' } })
  const et = useTable('zieltreppe_etappen', { order: { column: 'quarter' } })
  const now = new Date()
  const quarters = []
  for (let i = 0; i < 4; i++) { const d = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + i * 3, 1); quarters.push({ key: quarterOf(d), start: d, end: new Date(d.getFullYear(), d.getMonth() + 3, 0) }) }
  const themeOf = (items) => { const c = {}; items.forEach((m) => m.dimension && (c[m.dimension] = (c[m.dimension] ?? 0) + 1)); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] }
  return (
    <div>
      <PageHeader eyebrow="Teil 7" title="Ihr 12-Monats-Weg"
        intro="Nachfolgefähig werden ist kein Wochenendprojekt. Die nächsten zwölf Monate als erster bewusster Abschnitt: jedes Quartal unter einem Hauptthema – Fundament, Verwaltungsrat, Team, Rolle. Die Pfadkarte entsteht automatisch aus Meilensteinen und Zieltreppe-Etappen." />
      <div className="grid gap-3 md:grid-cols-4">
        {quarters.map((q, i) => {
          const items = ms.rows.filter((m) => { const d = new Date(m.due_date); return d >= q.start && d <= q.end && !['erledigt', 'zurueckgestellt'].includes(m.status) })
          const ets = et.rows.filter((e) => e.quarter === q.key)
          const theme = DIMENSIONS[themeOf(items)]
          return (
            <div key={q.key} className="card overflow-hidden">
              <div className="px-4 py-3 text-white" style={{ background: theme?.color ?? '#1F3D32' }}>
                <div className="text-[10px] uppercase tracking-widest opacity-80">Quartal {i + 1} · {q.key}</div>
                <div className="font-serif font-bold">{theme ? `Schwerpunkt ${theme.label}` : 'Schwerpunkt offen'}</div>
              </div>
              <div className="p-3 text-xs">
                {ets.length > 0 && <><div className="eyebrow mb-1">Etappen (Zieltreppe)</div>{ets.map((e) => <div key={e.id} className="mb-1 rounded bg-cream px-2 py-1">{e.title}</div>)}</>}
                <div className="eyebrow mt-2 mb-1">Meilensteine</div>
                {items.length ? items.map((m) => <div key={m.id} className="border-b border-sand/70 py-1"><span className="font-semibold">{m.nr}</span> {m.title} <span className="text-inkSoft">· {m.owner_name ?? m.owner_label ?? ''} · {fmtDate(m.due_date)}</span></div>) : <div className="text-inkSoft">–</div>}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-inkSoft">Der wichtigste Schritt ist der erste. Am Ende der zwölf Monate ist nicht alles fertig – aber die Richtung ist spürbar: weg von einem Unternehmen, das über die Unersetzlichkeit einer Person funktioniert, hin zu einem Lebenswerk auf mehreren Schultern.</p>
    </div>
  )
}
