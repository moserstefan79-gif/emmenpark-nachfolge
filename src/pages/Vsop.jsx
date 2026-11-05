import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useTable, PROFILSTUFE, fmtCHF, fmtDate, fmtPct } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Empty, Stat, Table } from '../components/ui'

const EVENT = { zuteilung: 'Zuteilung', bewertung: 'Bewertung', rueckstellung: 'Rückstellung', trigger: 'Trigger (MBO/Exit/Stichtag)', auszahlung: 'Auszahlung (Rate)', leaver: 'Leaver-Ereignis', notiz: 'Notiz' }

export default function Vsop() {
  const { isVR, profiles, profile } = useAuth()
  const settings = useTable('vsop_settings')
  const scen = useTable('vsop_scenarios', { order: { column: 'sort' } })
  const parts = useTable('vsop_participants')
  const events = useTable('vsop_events', { order: { column: 'event_date', ascending: false } })
  const [editP, setEditP] = useState(null)
  const [editE, setEditE] = useState(null)
  const [editS, setEditS] = useState(false)
  const s = settings.rows[0]
  const name = (id) => profiles.find((p) => p.id === id)?.full_name ?? '–'

  if (!s) return <Empty>Lade …</Empty>
  const active = parts.rows.filter((p) => p.leaver_status !== 'bad_leaver')
  const poolActive = active.filter((p) => p.profilstufe === 'gl_mit_beteiligung').reduce((a, p) => a + Number(p.quota_pct), 0)
  const poolMax = active.reduce((a, p) => a + Number(p.quota_pct), 0)
  const reserve = Math.max(0, Number(s.pool_pct) - poolMax)

  const calc = (multiple, pct) => {
    const ev = Number(s.ebit_reference) * Number(multiple)
    const pool = ev * (pct / 100)
    const withSocial = pool * (1 + Number(s.social_pct) / 100)
    return { ev, pool, withSocial, rate: withSocial / Number(s.payout_years), reserveYear: pool / Number(s.vesting_years) }
  }

  const vesting = (p) => {
    if (!p.vesting_start) return null
    const start = new Date(p.vesting_start), now = new Date()
    const months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth()
    if (months < Number(s.cliff_months)) return { pct: 0, label: `Cliff bis ${fmtDate(new Date(start.getFullYear(), start.getMonth() + Number(s.cliff_months), 1))}` }
    const pct = Math.min(100, (months / (Number(s.vesting_years) * 12)) * 100)
    return { pct, label: `${pct.toFixed(0)} % gevestet` }
  }

  const pFields = [
    { name: 'profile_id', label: 'GL-Mitglied', type: 'profile', gremium: 'GL', required: true, half: true },
    { name: 'quota_pct', label: 'Quote % (Obergrenze 2.0)', type: 'number', step: '0.1', half: true, required: true },
    { name: 'profilstufe', label: 'Rollenwahl', type: 'select', options: PROFILSTUFE, half: true, required: true },
    { name: 'leaver_status', label: 'Status', type: 'select', options: { aktiv: 'aktiv', good_leaver: 'Good Leaver', bad_leaver: 'Bad Leaver' }, half: true },
    { name: 'allocation_date', label: 'Zuteilung (VR-Beschluss)', type: 'date', half: true },
    { name: 'vesting_start', label: 'Vesting-Beginn', type: 'date', half: true },
    { name: 'note', label: 'Bemerkung', type: 'textarea' },
  ]
  const eFields = [
    { name: 'participant_id', label: 'Teilnehmer/in (leer = Programm gesamt)', type: 'select', options: Object.fromEntries(parts.rows.map((p) => [p.id, name(p.profile_id)])) },
    { name: 'type', label: 'Ereignis', type: 'select', options: EVENT, required: true, half: true },
    { name: 'event_date', label: 'Datum', type: 'date', required: true, half: true },
    { name: 'amount', label: 'Betrag CHF', type: 'number', half: true },
    { name: 'note', label: 'Notiz / Beschluss', type: 'textarea' },
  ]
  const sFields = [
    { name: 'ebit_reference', label: 'Referenz-EBIT (bereinigt)', type: 'number', half: true },
    { name: 'pool_pct', label: 'Pool % des Unternehmenswerts', type: 'number', step: '0.1', half: true },
    { name: 'quota_default_pct', label: 'Quote pro Person % (Obergrenze)', type: 'number', step: '0.1', half: true },
    { name: 'vesting_years', label: 'Vesting (Jahre)', type: 'number', half: true },
    { name: 'cliff_months', label: 'Cliff (Monate)', type: 'number', half: true },
    { name: 'social_pct', label: 'AG-Sozialabgaben %', type: 'number', step: '0.1', half: true },
    { name: 'payout_years', label: 'Auszahlung in Jahresraten', type: 'number', half: true },
    { name: 'opting_in_start', label: 'Opting-in ab', type: 'date', half: true },
    { name: 'ebit_factor_min', label: 'EBIT-Hebel min', type: 'number', step: '0.1', half: true },
    { name: 'ebit_factor_max', label: 'EBIT-Hebel max', type: 'number', step: '0.1', half: true },
    { name: 'cap_note', label: 'Auszahlungs-Cap (Regelung)', type: 'textarea' },
  ]

  return (
    <div>
      <PageHeader eyebrow="Interne Nachfolge mit Beteiligungsprogramm" title="VSOP – Bewirtschaftung"
        intro="Virtuelle Beteiligung für die GL (ohne Inhaber), Opting-in ab 2028, Vesting 7 Jahre mit 1 Jahr Cliff, Auszahlung nur bei Trigger (MBO, Exit, Bewertungsstichtag) in drei Jahresraten. Der VR beschliesst Zuteilungen und Bewertungen – ohne selbst begünstigt zu sein."
        actions={isVR && <><button className="btn-ghost" onClick={() => setEditS(true)}>Parameter</button><button className="btn-gold" onClick={() => setEditP({ quota_pct: s.quota_default_pct, profilstufe: 'offen', leaver_status: 'aktiv' })}>+ Teilnehmer/in</button></>} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Referenz-EBIT" value={fmtCHF(s.ebit_reference)} sub="Basis der Bewertung" />
        <Stat label="Pool" value={fmtPct(s.pool_pct)} sub={`zugeteilt (GL mit Beteiligung): ${fmtPct(poolActive)} · Reserve ${fmtPct(reserve)}`} />
        <Stat label="Vesting" value={`${s.vesting_years} J.`} sub={`Cliff ${s.cliff_months} Monate · Opting-in ab ${fmtDate(s.opting_in_start)}`} />
        <Stat label="Rückstellung p.a. (Base)" value={fmtCHF(calc(scen.rows.find((x) => x.name === 'Base')?.multiple ?? 4.5, s.pool_pct).reserveYear)} sub={`1/${s.vesting_years} des erwarteten Poolwerts`} />
      </div>

      <Card className="mt-4" eyebrow="Tragbarkeit" title="Szenarien (Modellrechnung – durch Treuhand zu validieren)">
        <Table rows={scen.rows} cols={[
          { key: 'name', label: 'Szenario', render: (r) => <b>{r.name} ({r.multiple}x)</b> },
          { key: 'ev', label: 'Unternehmenswert', render: (r) => fmtCHF(calc(r.multiple, s.pool_pct).ev) },
          { key: 'pool', label: `Pool ${s.pool_pct} %`, render: (r) => fmtCHF(calc(r.multiple, s.pool_pct).pool) },
          { key: 'soc', label: `inkl. AG-Sozialabgaben (~${s.social_pct} %)`, render: (r) => fmtCHF(calc(r.multiple, s.pool_pct).withSocial) },
          { key: 'rate', label: `Rate p.a. (${s.payout_years} Jahre)`, render: (r) => fmtCHF(calc(r.multiple, s.pool_pct).rate) },
          { key: 'ebit', label: 'Rate in % des Referenz-EBIT', render: (r) => fmtPct((calc(r.multiple, s.pool_pct).rate / Number(s.ebit_reference)) * 100, 0) },
        ]} />
        <p className="mt-2 text-xs text-inkSoft">Der EBIT-Hebel ({s.ebit_factor_min}–{s.ebit_factor_max}) kann die Ansprüche zusätzlich erhöhen oder senken. {s.cap_note && `Cap: ${s.cap_note}`}</p>
      </Card>

      <Card className="mt-4" eyebrow="Gruppe A · GL" title="Teilnehmende & Vesting">
        {parts.rows.length ? (
          <Table rows={parts.rows} onRow={isVR ? (p) => setEditP(p) : undefined} cols={[
            { key: 'p', label: 'Mitglied', render: (p) => <b>{name(p.profile_id)}</b> },
            { key: 'quota_pct', label: 'Quote', render: (p) => fmtPct(p.quota_pct) },
            { key: 'profilstufe', label: 'Rollenwahl', render: (p) => <span className={`chip ${p.profilstufe === 'gl_mit_beteiligung' ? 'bg-forest/10 text-forest' : 'bg-sand'}`}>{PROFILSTUFE[p.profilstufe]}</span> },
            { key: 'alloc', label: 'Zuteilung', render: (p) => fmtDate(p.allocation_date) },
            { key: 'vest', label: 'Vesting', render: (p) => { const v = vesting(p); return v ? <div><div className="h-2 w-28 rounded-full bg-sand"><div className="h-2 rounded-full bg-forest" style={{ width: `${v.pct}%` }} /></div><div className="text-xs text-inkSoft">{v.label}</div></div> : <span className="text-xs text-inkSoft">noch nicht gestartet</span> } },
            { key: 'val', label: 'Wert (Base)', render: (p) => p.profilstufe === 'gl_mit_beteiligung' ? fmtCHF(calc(scen.rows.find((x) => x.name === 'Base')?.multiple ?? 4.5, p.quota_pct).pool) : '–' },
            { key: 'leaver_status', label: 'Status' },
          ]} />
        ) : <Empty />}
      </Card>

      <Card className="mt-4" eyebrow="Register" title="Ereignisse & Beschlüsse" actions={isVR && <button className="btn-ghost text-xs" onClick={() => setEditE({ type: 'notiz', event_date: new Date().toISOString().slice(0, 10), created_by: profile?.id })}>+ Ereignis</button>}>
        {events.rows.length ? events.rows.map((e) => (
          <button key={e.id} onClick={() => isVR && setEditE(e)} className="block w-full border-b border-sand/70 py-2 text-left text-sm hover:bg-cream">
            <span className="chip bg-sand mr-2">{EVENT[e.type]}</span>{fmtDate(e.event_date)} · {e.participant_id ? name(parts.rows.find((p) => p.id === e.participant_id)?.profile_id) : 'Programm'}{e.amount != null && ` · ${fmtCHF(e.amount)}`}
            {e.note && <div className="text-xs text-inkSoft">{e.note}</div>}
          </button>
        )) : <Empty>Noch keine Ereignisse (Zuteilungen, Bewertungen, Rückstellungen).</Empty>}
      </Card>

      <Modal open={!!editP} title="VSOP-Teilnehmer/in" onClose={() => setEditP(null)}>{editP && <EntityForm fields={pFields} initial={editP} onSubmit={async (v) => { await parts.save(v); setEditP(null) }} onDelete={async (id) => { await parts.remove(id); setEditP(null) }} />}</Modal>
      <Modal open={!!editE} title="VSOP-Ereignis" onClose={() => setEditE(null)}>{editE && <EntityForm fields={eFields} initial={editE} onSubmit={async (v) => { await events.save(v); setEditE(null) }} onDelete={async (id) => { await events.remove(id); setEditE(null) }} />}</Modal>
      <Modal open={editS} title="VSOP-Parameter" onClose={() => setEditS(false)}>{editS && <EntityForm fields={sFields} initial={s} onSubmit={async (v) => { const { error } = await supabase.from('vsop_settings').update(v).eq('id', 1); if (error) throw error; await settings.reload(); setEditS(false) }} />}</Modal>
    </div>
  )
}
