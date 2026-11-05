import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useTable, DIMENSIONS, fmtDate, VISIBILITY } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Empty, JsonList } from '../components/ui'

/** Werkzeug 1: Team-Canvas – Auftrag, Ziele, Rollen, Spielregeln, Risiken, Bedürfnisse + Vereinbarungen */
export function TeamCanvas() {
  const { isVR, isGL, profile } = useAuth()
  const tc = useTable('team_canvas', { order: { column: 'version_date', ascending: false } })
  const [team, setTeam] = useState(isGL ? 'GL' : 'VR')
  const list = tc.rows.filter((c) => c.team === team)
  const [sel, setSel] = useState(0)
  const c = list[sel]
  const [draft, setDraft] = useState(null)
  useEffect(() => setDraft(c ? { ...c } : null), [c?.id])
  const canEdit = isVR || team === 'GL'

  const FIELDS = [
    ['auftrag', 'Gemeinsamer Auftrag', 'Warum gibt es dieses Führungsteam? Welchen Beitrag leisten wir über den Tagesbetrieb hinaus? Woran erkennen andere, dass wir unseren Auftrag gut erfüllen?'],
    ['ziele', 'Ziele & Richtung (12–24 Monate)', 'Welche drei bis fünf Themen bringen wir voran? Was ist nicht verhandelbar? Wo sagen wir bewusst Nein?'],
    ['rollen', 'Rollen & Verantwortungen', 'Wer trägt wofür tatsächlich die Verantwortung – offiziell und gelebt? Wo sind besondere Stärken? Wofür spricht man sich gegenseitig an?'],
    ['spielregeln', 'Spielregeln der Zusammenarbeit', 'Wie informieren wir uns? Wie entscheiden wir? Wie gehen wir mit Fehlern und nicht eingehaltenen Zusagen um? Welcher Ton ist in Ordnung?'],
    ['risiken', 'Risiken', 'Welche Muster machen uns anfällig? Abhängigkeiten von einzelnen Personen (inkl. Inhaber)? Schwelende Konflikte?'],
    ['beduerfnisse', 'Bedürfnisse', 'Was braucht jede/r, um die eigene Führungsrolle wahrzunehmen? Was erwarten wir von der Unternehmerperson?'],
  ]

  const save = async () => { await tc.save(draft) }

  return (
    <div>
      <PageHeader eyebrow="Werkzeug 1" title="Team-Canvas"
        intro="Aus vagen Vorstellungen ein gemeinsames Führungsbild machen – nicht als Modell, sondern als ehrliches Gespräch. Ein halber Tag mit dem Kernteam reicht für eine erste Version; danach gilt: zwei bis drei Veränderungen in drei Monaten, wer, bis wann."
        actions={<>
          <div className="flex rounded-md border border-sand bg-white p-0.5 text-sm">
            {['VR', 'GL'].filter((x) => x === 'GL' || isVR).map((x) => <button key={x} onClick={() => { setTeam(x); setSel(0) }} className={`rounded px-3 py-1 ${team === x ? 'bg-forest text-white' : 'text-forest'}`}>{x}</button>)}
          </div>
          {list.length > 1 && <select value={sel} onChange={(e) => setSel(+e.target.value)}>{list.map((x, i) => <option key={x.id} value={i}>Version {fmtDate(x.version_date)}</option>)}</select>}
          {canEdit && <button className="btn-gold" onClick={async () => { await tc.save({ team, version_date: new Date().toISOString().slice(0, 10), visibility: team === 'GL' ? 'gl' : 'vr', vereinbarungen: [] }); setSel(0) }}>+ Neue Version</button>}
        </>} />
      {!draft ? <Card><Empty>Noch kein Team-Canvas für {team}.</Empty></Card> : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {FIELDS.map(([k, label, hint]) => (
              <div key={k} className="card p-4">
                <div className="font-serif font-bold text-forest">{label}</div>
                <div className="mb-2 text-xs text-inkSoft">{hint}</div>
                {canEdit ? <textarea rows={5} value={draft[k] ?? ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} /> : <p className="whitespace-pre-wrap text-sm">{draft[k] || '–'}</p>}
              </div>
            ))}
          </div>
          <Card className="mt-3" eyebrow="Ergebnis" title="Vereinbarungen – zwei bis drei Veränderungen in den nächsten drei Monaten">
            {canEdit ? <JsonList value={draft.vereinbarungen ?? []} onChange={(v) => setDraft({ ...draft, vereinbarungen: v })} addLabel="Vereinbarung"
              columns={[{ key: 'text', label: 'Was ändern wir?', w: '3fr' }, { key: 'owner', label: 'Wer', w: '1fr' }, { key: 'bis', label: 'Bis wann', type: 'date', w: '1fr' }, { key: 'status', label: 'Status', type: 'select', options: ['offen', 'in Arbeit', 'umgesetzt'], w: '1fr' }]} />
              : (draft.vereinbarungen ?? []).map((v, i) => <div key={i} className="border-b border-sand/70 py-1 text-sm">{v.text} · {v.owner} · {v.bis} · {v.status}</div>)}
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div><label>Version vom</label>{canEdit ? <input type="date" value={draft.version_date ?? ''} onChange={(e) => setDraft({ ...draft, version_date: e.target.value })} /> : fmtDate(draft.version_date)}</div>
              <div><label>Wieder anschauen am</label>{canEdit ? <input type="date" value={draft.review_date ?? ''} onChange={(e) => setDraft({ ...draft, review_date: e.target.value })} /> : fmtDate(draft.review_date)}</div>
              <div><label>Sichtbarkeit</label>{canEdit ? <select value={draft.visibility} onChange={(e) => setDraft({ ...draft, visibility: e.target.value })}>{Object.entries(VISIBILITY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select> : VISIBILITY[draft.visibility]}</div>
            </div>
            {canEdit && <div className="mt-3 flex justify-end gap-2"><button className="btn-ghost text-red-700" onClick={() => confirm('Version löschen?') && tc.remove(draft.id)}>Löschen</button><button className="btn-primary" onClick={save}>Speichern</button></div>}
          </Card>
        </>
      )}
    </div>
  )
}

/** Nachfolgefähigkeits-Canvas: 4 Dimensionen × (trägt / blockiert / nächste Bewegung) + Reifegrad */
export function NfCanvas({ ownerId = null, embedded = false }) {
  const { isVR, profile } = useAuth()
  const cv = useTable('nf_canvas', { order: { column: 'assessment_date', ascending: false }, filter: (q) => ownerId ? q.eq('owner_id', ownerId) : q.is('owner_id', null), deps: [ownerId] })
  const [sel, setSel] = useState(0)
  const c = cv.rows[sel]
  const fl = useTable('nf_canvas_fields', { filter: (q) => q.eq('canvas_id', c?.id ?? '00000000-0000-0000-0000-000000000000'), deps: [c?.id] })
  const [draft, setDraft] = useState({})
  const [editC, setEditC] = useState(null)
  useEffect(() => { const d = {}; Object.keys(DIMENSIONS).forEach((k) => { d[k] = fl.rows.find((f) => f.dimension === k) ?? { dimension: k, canvas_id: c?.id } }); setDraft(d) }, [fl.rows, c?.id])
  const canEdit = isVR || c?.owner_id === profile?.id
  const TYPEN = ['Alles läuft über mich', 'Guter Verwaltungsrat, aber ich kann nicht loslassen', 'Starkes Team, aber kein klares Fundament', 'Fundament klar, aber niemand trägt mit', 'Auf gutem Weg']

  const cFields = [
    { name: 'title', label: 'Titel der Standortbestimmung', type: 'text', required: true },
    { name: 'assessment_date', label: 'Datum', type: 'date', half: true, required: true },
    { name: 'typmuster', label: 'Typmuster', type: 'select', half: true, options: Object.fromEntries(TYPEN.map((t) => [t, t])) },
    { name: 'visibility', label: 'Sichtbarkeit', type: 'select', half: true, options: VISIBILITY },
  ]
  const saveAll = async () => {
    for (const k of Object.keys(DIMENSIONS)) {
      const f = { ...draft[k], canvas_id: c.id, dimension: k }
      if (f.score === '') f.score = null
      await supabase.from('nf_canvas_fields').upsert(f, { onConflict: 'canvas_id,dimension' })
    }
    await fl.reload()
  }

  return (
    <div>
      {!embedded && <PageHeader eyebrow="Teil 7 · Selbstbild und Spiegel" title="Nachfolgefähigkeits-Canvas"
        intro="Vier Felder, drei Fragen: Was trägt heute? Was blockiert (noch)? Welche nächste Bewegung? Pro Dimension zehn bis fünfzehn Minuten, spontan schreiben – dann je einen Punkt markieren, der trägt, und einen, der blockiert."
        actions={<>
          {cv.rows.length > 1 && <select value={sel} onChange={(e) => setSel(+e.target.value)}>{cv.rows.map((x, i) => <option key={x.id} value={i}>{x.title} · {fmtDate(x.assessment_date)}</option>)}</select>}
          {(isVR || ownerId) && <button className="btn-gold" onClick={() => setEditC({ owner_id: ownerId, assessment_date: new Date().toISOString().slice(0, 10), visibility: 'vr' })}>+ Standortbestimmung</button>}
        </>} />}
      {embedded && (isVR || ownerId) && !c && <button className="btn-gold mb-3" onClick={() => setEditC({ owner_id: ownerId, assessment_date: new Date().toISOString().slice(0, 10), visibility: 'vr' })}>+ Standortbestimmung</button>}
      {!c ? <Card><Empty>Noch keine Standortbestimmung.</Empty></Card> : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div><span className="font-semibold">{c.title}</span> · {fmtDate(c.assessment_date)} · Typmuster: <span className="chip bg-gold/20 text-goldSoft">{c.typmuster ?? '–'}</span></div>
            {canEdit && <div className="flex gap-2"><button className="btn-ghost text-xs" onClick={() => setEditC(c)}>Kopf bearbeiten</button><button className="btn-primary text-xs" onClick={saveAll}>Felder speichern</button></div>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(DIMENSIONS).map(([k, d]) => {
              const f = draft[k] ?? {}
              const set = (key, v) => setDraft({ ...draft, [k]: { ...f, [key]: v } })
              return (
                <div key={k} className="card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 text-white" style={{ background: d.color }}>
                    <div><div className="text-[10px] uppercase tracking-widest opacity-80">{d.short}</div><div className="font-serif font-bold">{d.label}</div></div>
                    <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((i) => <button key={i} disabled={!canEdit} onClick={() => set('score', i)} className={`h-5 w-5 rounded-full border border-white/70 text-[10px] ${f.score >= i ? 'bg-white text-forest' : 'bg-transparent text-white/70'}`}>{i}</button>)}</div>
                  </div>
                  <div className="space-y-2 p-4">
                    {[['traegt', 'Was trägt heute?'], ['blockiert', 'Was blockiert (noch)?'], ['bewegung', 'Welche nächste Bewegung?']].map(([key, label]) => (
                      <div key={key}><label>{label}</label>{canEdit ? <textarea rows={3} value={f[key] ?? ''} onChange={(e) => set(key, e.target.value)} /> : <p className="text-sm">{f[key] || '–'}</p>}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {!embedded && <p className="mt-3 text-xs text-inkSoft">Aus allen «nächsten Bewegungen» drei konkrete Schritte wählen → sie gehören als Etappen in die Zieltreppe und als Meilensteine in den Plan.</p>}
        </>
      )}
      <Modal open={!!editC} title="Standortbestimmung" onClose={() => setEditC(null)}>{editC && <EntityForm fields={cFields} initial={editC} onSubmit={async (v) => { await cv.save(v); setEditC(null); setSel(0) }} onDelete={async (id) => { await cv.remove(id); setEditC(null); setSel(0) }} />}</Modal>
    </div>
  )
}
