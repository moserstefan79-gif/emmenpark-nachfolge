import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTable, PROFILSTUFE, fmtDate } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Empty, Table } from '../components/ui'

export function GLMitglieder() {
  const { isVR, profile, profiles } = useAuth()
  const akv = useTable('gl_akv', { order: { column: 'updated_at' } })
  const [edit, setEdit] = useState(null)
  const gl = profiles.filter((p) => (p.gremium ?? '').includes('GL') && p.active)
  const name = (id) => profiles.find((p) => p.id === id)?.full_name ?? '–'
  const canEdit = (a) => isVR || a?.profile_id === profile?.id

  const fields = [
    { name: 'profile_id', label: 'Mitglied', type: 'profile', gremium: 'GL', required: true, half: true },
    { name: 'role_title', label: 'Rolle', type: 'text', required: true, half: true },
    { name: 'aufgaben', label: 'Aufgaben', type: 'textarea' },
    { name: 'kompetenzen', label: 'Kompetenzen (Entscheidungsspielraum, CHF-Limiten via Kompetenzordnung)', type: 'textarea' },
    { name: 'verantwortung', label: 'Verantwortung (Ergebnis, Qualität, Personal)', type: 'textarea' },
    { name: 'stellvertreter_id', label: 'Wird vertreten durch', type: 'profile', half: true },
    { name: 'vertritt_id', label: 'Vertritt selbst', type: 'profile', half: true },
    { name: 'uebernahme_vom_gf', label: 'Übernahme vom Geschäftsführer (was geht vom Inhaber auf diese Rolle über?)', type: 'textarea' },
    { name: 'profilstufe', label: 'Rollenwahl (Opting-in ab 2028)', type: 'select', half: true, options: PROFILSTUFE, hint: 'Kader · GL ohne Beteiligung · GL mit Beteiligung (höhere unternehmerische Verantwortung)' },
    { name: 'rollenwahl_datum', label: 'Rollenwahl-Gespräch am', type: 'date', half: true },
    { name: 'status', label: 'Status AKV', type: 'select', half: true, options: { entwurf: 'Entwurf', abgestimmt: 'abgestimmt', unterzeichnet: 'unterzeichnet' } },
  ]
  const coverage = gl.length ? Math.round((akv.rows.filter((a) => a.status !== 'entwurf').length / gl.length) * 100) : 0

  return (
    <div>
      <PageHeader eyebrow="Hebel 3 · Organisation & Team" title="Geschäftsleitung – Mitglieder & AKV"
        intro="Aus Ausführenden werden Mitgestalter: Aufgaben, Kompetenzen, Verantwortung und Stellvertretungen pro Rolle – plus die Rollenwahl für das Opting-in ab 2028."
        actions={isVR && <button className="btn-gold" onClick={() => setEdit({ profilstufe: 'offen', status: 'entwurf' })}>+ AKV</button>} />
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="card p-4"><div className="eyebrow">GL-Mitglieder</div><div className="text-2xl font-bold text-forest">{gl.length}</div></div>
        <div className="card p-4"><div className="eyebrow">AKV abgestimmt/unterzeichnet</div><div className="text-2xl font-bold text-forest">{coverage} %</div><div className="text-xs text-inkSoft">Ziel 100 % vor Start Frühling 2027</div></div>
        <div className="card p-4"><div className="eyebrow">Rollenwahl getroffen</div><div className="text-2xl font-bold text-forest">{akv.rows.filter((a) => a.profilstufe !== 'offen').length} / {gl.length}</div></div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {gl.map((p) => {
          const a = akv.rows.find((x) => x.profile_id === p.id)
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div><div className="font-serif text-lg font-bold text-forest">{p.full_name}</div><div className="text-sm text-inkSoft">{a?.role_title ?? p.funktion}</div></div>
                {a ? <span className="chip bg-sand">{a.status}</span> : <span className="chip bg-red-100 text-red-800">kein AKV</span>}
              </div>
              {a && <>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="eyebrow">Vertreten durch</span><div>{name(a.stellvertreter_id)}</div></div>
                  <div><span className="eyebrow">Vertritt</span><div>{name(a.vertritt_id)}</div></div>
                  <div><span className="eyebrow">Rollenwahl</span><div>{PROFILSTUFE[a.profilstufe]}{a.rollenwahl_datum ? ' · ' + fmtDate(a.rollenwahl_datum) : ''}</div></div>
                  <div><span className="eyebrow">Verantwortung</span><div className="line-clamp-2">{a.verantwortung ?? '–'}</div></div>
                </div>
                {canEdit(a) && <button className="btn-ghost mt-2 text-xs" onClick={() => setEdit(a)}>AKV öffnen</button>}
              </>}
              {!a && isVR && <button className="btn-ghost mt-2 text-xs" onClick={() => setEdit({ profile_id: p.id, role_title: p.funktion ?? '', profilstufe: 'offen', status: 'entwurf' })}>AKV anlegen</button>}
            </div>
          )
        })}
      </div>
      <Card className="mt-4" eyebrow="Übersicht" title="Stellvertretungsmatrix">
        <Table rows={akv.rows} cols={[
          { key: 'who', label: 'Rolle', render: (a) => <><b>{name(a.profile_id)}</b><div className="text-xs text-inkSoft">{a.role_title}</div></> },
          { key: 'sv', label: 'Wird vertreten durch', render: (a) => name(a.stellvertreter_id) },
          { key: 'vt', label: 'Vertritt selbst', render: (a) => name(a.vertritt_id) },
          { key: 'ps', label: 'Rollenwahl', render: (a) => PROFILSTUFE[a.profilstufe] },
          { key: 'status', label: 'AKV-Status' },
        ]} />
      </Card>
      <Modal open={!!edit} title="AKV-Pflichtenheft" onClose={() => setEdit(null)} wide>
        {edit && <EntityForm fields={isVR ? fields : fields.filter((f) => !['profile_id', 'profilstufe', 'status'].includes(f.name))} initial={edit} onSubmit={async (v) => { await akv.save(v); setEdit(null) }} onDelete={isVR ? async (id) => { await akv.remove(id); setEdit(null) } : undefined} />}
      </Modal>
    </div>
  )
}

export function Delegation() {
  const { isVR, profiles } = useAuth()
  const dm = useTable('delegation_mandates', { order: { column: 'start_date' } })
  const [edit, setEdit] = useState(null)
  const name = (id) => profiles.find((p) => p.id === id)?.full_name ?? '–'
  const fields = [
    { name: 'profile_id', label: 'Mandatsträger/in', type: 'profile', gremium: 'GL', required: true, half: true },
    { name: 'bereich', label: 'Bereich', type: 'text', required: true, half: true },
    { name: 'ziel', label: 'Ziel – was soll ohne den Inhaber laufen?', type: 'textarea' },
    { name: 'budget', label: 'Budget / Limiten', type: 'text', half: true },
    { name: 'entscheidungsspielraum', label: 'Entscheidungsspielraum', type: 'textarea' },
    { name: 'reporting', label: 'Reporting (an wen, wie oft)', type: 'text', half: true },
    { name: 'start_date', label: 'Start', type: 'date', half: true },
    { name: 'review_date', label: 'Nächstes Review', type: 'date', half: true },
    { name: 'status', label: 'Status', type: 'select', half: true, options: { entwurf: 'Entwurf', vereinbart: 'vereinbart', aktiv: 'aktiv', abgeschlossen: 'abgeschlossen' } },
    { name: 'lessons', label: 'Lessons learned aus dem monatlichen Review', type: 'textarea' },
  ]
  return (
    <div>
      <PageHeader eyebrow="Delegations-Pilot" title="Delegationsmandate"
        intro="Schriftliche Mandate (Ziel, Budget, Entscheidungsspielraum, Reporting) sind der Prüfstein dafür, ob Verantwortung wirklich wandert. Monatliches Review mit den Pilotverantwortlichen; die Delegationsquote wird im Cockpit geführt."
        actions={isVR && <button className="btn-gold" onClick={() => setEdit({ status: 'entwurf' })}>+ Mandat</button>} />
      <div className="grid gap-3 md:grid-cols-3">
        {dm.rows.length ? dm.rows.map((d) => (
          <button key={d.id} onClick={() => isVR && setEdit(d)} className="card p-4 text-left hover:shadow-md">
            <div className="eyebrow">{d.status}</div>
            <div className="font-serif text-lg font-bold text-forest">{d.bereich}</div>
            <div className="text-sm">{name(d.profile_id)}</div>
            <p className="mt-2 text-xs text-inkSoft">{d.ziel}</p>
            <div className="mt-2 text-xs">Start {fmtDate(d.start_date)} · Review {fmtDate(d.review_date)}</div>
          </button>
        )) : <Empty />}
      </div>
      <Modal open={!!edit} title="Delegationsmandat" onClose={() => setEdit(null)}>
        {edit && <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { await dm.save(v); setEdit(null) }} onDelete={async (id) => { await dm.remove(id); setEdit(null) }} />}
      </Modal>
    </div>
  )
}
