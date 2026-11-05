import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useTable, fmtDate, STATUS } from '../lib/db'
import { PageHeader, Card, StatusChip, Empty } from '../components/ui'
import Zieltreppe from './Zieltreppe'
import { NfCanvas } from './Canvas'

export default function MeinBereich() {
  const { profile, profiles } = useAuth()
  const ms = useTable('v_milestones', { order: { column: 'due_date' }, filter: (q) => q.eq('owner_id', profile?.id ?? '00000000-0000-0000-0000-000000000000'), deps: [profile?.id] })
  const pend = useTable('agenda_items', { order: { column: 'follow_up_due' }, filter: (q) => q.eq('follow_up_owner_id', profile?.id ?? '00000000-0000-0000-0000-000000000000').eq('done', false), deps: [profile?.id] })
  const [tab, setTab] = useState('aufgaben')
  const isOwner = profile?.role === 'eigentuemer'

  const setStatus = async (m, status) => { await supabase.from('milestones').update({ status }).eq('id', m.id); ms.reload() }
  const donePend = async (p) => { await supabase.from('agenda_items').update({ done: true }).eq('id', p.id); pend.reload() }

  return (
    <div>
      <PageHeader eyebrow={profile?.funktion ?? ''} title={`Mein Bereich – ${profile?.full_name ?? ''}`}
        intro={isOwner ? 'Hebel 4: Person und Rolle. Hier liegen Ihre persönliche Zieltreppe und Ihr persönlicher Nachfolgefähigkeits-Canvas – nur für Sie und den VR sichtbar.' : 'Ihre Meilensteine, Pendenzen aus Sitzungen und persönliche Instrumente.'} />
      <div className="mb-4 flex gap-1 rounded-md border border-sand bg-white p-0.5 text-sm w-fit">
        {[['aufgaben', 'Meine Aufgaben'], ['zieltreppe', 'Meine Zieltreppe'], ['canvas', 'Mein Canvas']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded px-3 py-1 ${tab === k ? 'bg-forest text-white' : 'text-forest'}`}>{l}</button>)}
      </div>

      {tab === 'aufgaben' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card eyebrow="Meilensteine" title="Wofür ich verantwortlich bin">
            {ms.rows.length ? ms.rows.map((m) => (
              <div key={m.id} className="border-b border-sand/70 py-2 text-sm">
                <div className="flex justify-between gap-2"><span className="font-semibold">{m.nr} {m.title}</span><span className="text-xs whitespace-nowrap">{fmtDate(m.due_date)}</span></div>
                <div className="mt-1 flex items-center gap-2 text-xs"><StatusChip status={m.status} />
                  <select className="!w-auto !py-0.5 text-xs" value={m.status} onChange={(e) => setStatus(m, e.target.value)}>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>
                </div>
              </div>
            )) : <Empty>Keine Meilensteine auf Ihren Namen.</Empty>}
          </Card>
          <Card eyebrow="Beschlusskontrolle" title="Pendenzen aus Sitzungen">
            {pend.rows.length ? pend.rows.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-2 border-b border-sand/70 py-2 text-sm">
                <div><div className="font-semibold">{p.follow_up}</div><div className="text-xs text-inkSoft">aus Traktandum «{p.title}» · bis {fmtDate(p.follow_up_due)}</div></div>
                <button className="btn-ghost text-xs" onClick={() => donePend(p)}>erledigt</button>
              </div>
            )) : <Empty>Keine offenen Pendenzen.</Empty>}
          </Card>
        </div>
      )}
      {tab === 'zieltreppe' && profile && <Zieltreppe scope="person" ownerId={profile.id} embedded={false} />}
      {tab === 'canvas' && profile && <NfCanvas ownerId={profile.id} embedded />}
    </div>
  )
}
