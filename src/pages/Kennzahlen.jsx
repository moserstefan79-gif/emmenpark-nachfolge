import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTable, fmtCHF, fmtPct, DIMENSIONS } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Table, Stat, Empty } from '../components/ui'

const pct = (a, b) => (a != null && b) ? (a / b) * 100 : null

export function Kennzahlen() {
  const { isVR } = useAuth()
  const kpi = useTable('kpi_snapshots', { order: { column: 'period', ascending: false } })
  const [edit, setEdit] = useState(null)
  const cur = kpi.rows[0], prev = kpi.rows[1]

  const fields = [
    { name: 'period', label: 'Periode (z.B. 2026-12 oder 2026)', type: 'text', required: true, half: true },
    { name: 'note', label: 'Bemerkung', type: 'text', half: true },
    { name: 'revenue', label: 'Nettoerlös', type: 'number', half: true },
    { name: 'gross_profit_1', label: 'Bruttogewinn 1', type: 'number', half: true },
    { name: 'personnel_cost', label: 'Personalaufwand', type: 'number', half: true },
    { name: 'ebitda', label: 'EBITDA / EBITA', type: 'number', half: true },
    { name: 'ebit', label: 'EBIT', type: 'number', half: true },
    { name: 'ebit_adjusted', label: 'Bereinigter EBIT (VSOP-Referenz)', type: 'number', half: true },
    { name: 'net_profit', label: 'Reingewinn', type: 'number', half: true },
    { name: 'equity_ratio_pct', label: 'EK-Quote %', type: 'number', step: '0.1', half: true },
    { name: 'liquidity', label: 'Liquidität', type: 'number', half: true },
    { name: 'debt', label: 'Verschuldung', type: 'number', half: true },
    { name: 'db_gastronomie', label: 'DB Gastronomie', type: 'number', half: true },
    { name: 'db_events', label: 'DB Events', type: 'number', half: true },
    { name: 'db_catering', label: 'DB Catering', type: 'number', half: true },
    { name: 'delegation_quote_pct', label: 'Delegationsquote %', type: 'number', step: '0.1', half: true },
    { name: 'akv_coverage_pct', label: 'AKV-Abdeckung %', type: 'number', step: '0.1', half: true },
    { name: 'top_risks', label: 'Top-Risiken', type: 'textarea' },
  ]

  const Delta = ({ a, b, inv }) => {
    if (a == null || b == null) return null
    const d = ((a - b) / Math.abs(b)) * 100
    const good = inv ? d <= 0 : d >= 0
    return <span className={`text-xs ${good ? 'text-forest' : 'text-red-700'}`}>{d >= 0 ? '+' : ''}{d.toFixed(1)} % vs. {prev.period}</span>
  }

  return (
    <div>
      <PageHeader eyebrow="Ressort Finanzen & Audit" title="Finanz-Cockpit"
        intro="VR-Steuerungsgrössen gemäss Eignerstrategie: Ergebnisentwicklung, Liquidität, Eigenkapital, Verschuldung, segmentierte Deckungsbeiträge, Top-Risiken – ergänzt um Delegationsquote und AKV-Abdeckung als Nachfolge-Indikatoren."
        actions={isVR && <button className="btn-gold" onClick={() => setEdit({})}>+ Periode erfassen</button>} />
      {cur ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label={`Nettoerlös ${cur.period}`} value={fmtCHF(cur.revenue)} sub={prev && <Delta a={cur.revenue} b={prev.revenue} />} />
            <Stat label="EBITA-Marge" value={fmtPct(pct(cur.ebitda, cur.revenue))} sub={prev && `Vorjahr ${fmtPct(pct(prev.ebitda, prev.revenue))} · Branche ~8 %`} />
            <Stat label="EBIT" value={fmtCHF(cur.ebit)} sub={<span>Referenz VSOP ≥ CHF 350'000 {cur.ebit != null && (cur.ebit >= 350000 ? '✓' : '– unter Referenz')}</span>} tone={cur.ebit != null && cur.ebit < 350000 ? 'text-red-700' : undefined} />
            <Stat label="Reingewinn" value={fmtCHF(cur.net_profit)} sub={prev && <Delta a={cur.net_profit} b={prev.net_profit} />} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Personalkosten" value={fmtPct(pct(cur.personnel_cost, cur.revenue))} sub={prev && <Delta a={pct(cur.personnel_cost, cur.revenue)} b={pct(prev.personnel_cost, prev.revenue)} inv />} />
            <Stat label="Bruttogewinn 1" value={fmtPct(pct(cur.gross_profit_1, cur.revenue))} sub="Branche ~70–73 %" />
            <Stat label="Delegationsquote" value={fmtPct(cur.delegation_quote_pct, 0)} sub="Ziel: schrittweise Erhöhung" />
            <Stat label="AKV-Abdeckung" value={fmtPct(cur.akv_coverage_pct, 0)} sub="Ziel 100 % bis Ende Jahr 1" />
          </div>
          {(cur.db_gastronomie != null || cur.db_events != null || cur.db_catering != null) && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Stat label="DB Gastronomie" value={fmtCHF(cur.db_gastronomie)} /><Stat label="DB Events" value={fmtCHF(cur.db_events)} /><Stat label="DB Catering" value={fmtCHF(cur.db_catering)} />
            </div>
          )}
          {cur.note && <p className="mt-2 text-xs text-inkSoft">{cur.note}</p>}
        </>
      ) : <Empty>Noch keine Kennzahlen erfasst.</Empty>}

      <Card className="mt-6" title="Verlauf">
        <Table rows={kpi.rows} onRow={isVR ? (r) => setEdit(r) : undefined} cols={[
          { key: 'period', label: 'Periode' },
          { key: 'revenue', label: 'Nettoerlös', render: (r) => fmtCHF(r.revenue) },
          { key: 'ebitda', label: 'EBITA', render: (r) => `${fmtCHF(r.ebitda)} (${fmtPct(pct(r.ebitda, r.revenue))})` },
          { key: 'ebit', label: 'EBIT', render: (r) => fmtCHF(r.ebit) },
          { key: 'net_profit', label: 'Gewinn', render: (r) => fmtCHF(r.net_profit) },
          { key: 'pc', label: 'Personal %', render: (r) => fmtPct(pct(r.personnel_cost, r.revenue)) },
          { key: 'liquidity', label: 'Liquidität', render: (r) => fmtCHF(r.liquidity) },
          { key: 'equity_ratio_pct', label: 'EK %', render: (r) => fmtPct(r.equity_ratio_pct) },
        ]} />
      </Card>
      <Modal open={!!edit} title="Kennzahlen-Periode" onClose={() => setEdit(null)} wide>
        {edit && <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { await kpi.save(v); setEdit(null) }} onDelete={async (id) => { await kpi.remove(id); setEdit(null) }} />}
      </Modal>
    </div>
  )
}

export function Risiken() {
  const { isVR, profiles } = useAuth()
  const risks = useTable('risks', { order: { column: 'level' } })
  const [edit, setEdit] = useState(null)
  const fields = [
    { name: 'title', label: 'Risiko', type: 'text', required: true },
    { name: 'early_indicators', label: 'Frühindikatoren', type: 'textarea' },
    { name: 'countermeasures', label: 'Gegenmassnahmen', type: 'textarea' },
    { name: 'owner_id', label: 'Verantwortlich', type: 'profile', half: true },
    { name: 'dimension', label: 'Hebel', type: 'select', half: true, options: Object.fromEntries(Object.entries(DIMENSIONS).map(([k, d]) => [k, d.label])) },
    { name: 'level', label: 'Stufe', type: 'select', half: true, options: { tief: 'tief', mittel: 'mittel', hoch: 'hoch' } },
    { name: 'status', label: 'Status', type: 'select', half: true, options: { offen: 'offen', beobachtet: 'beobachtet', eingetreten: 'eingetreten', geschlossen: 'geschlossen' } },
  ]
  const tone = { hoch: 'bg-red-100 text-red-800', mittel: 'bg-gold/20 text-goldSoft', tief: 'bg-forest/10 text-forest' }
  return (
    <div>
      <PageHeader eyebrow="Jährliches Risiko-Review" title="Risiken & Gegenmassnahmen" intro="Personenabhängigkeit, Klumpenrisiken, finanzielle Risiken, Nachfolgerisiken – mit Frühindikatoren und Gegenmassnahmen."
        actions={isVR && <button className="btn-gold" onClick={() => setEdit({ level: 'mittel', status: 'offen' })}>+ Risiko</button>} />
      <div className="grid gap-3 md:grid-cols-2">
        {risks.rows.map((r) => (
          <button key={r.id} onClick={() => isVR && setEdit(r)} className="card p-4 text-left hover:shadow-md">
            <div className="flex items-start justify-between gap-2"><div className="font-semibold text-forest">{r.title}</div><span className={`chip ${tone[r.level]}`}>{r.level}</span></div>
            <div className="mt-2 text-xs"><span className="eyebrow">Frühindikator</span><div>{r.early_indicators}</div></div>
            <div className="mt-2 text-xs"><span className="eyebrow">Gegenmassnahme</span><div>{r.countermeasures}</div></div>
            <div className="mt-2 text-xs text-inkSoft">{profiles.find((p) => p.id === r.owner_id)?.full_name ?? '–'} · {DIMENSIONS[r.dimension]?.label ?? ''} · {r.status}</div>
          </button>
        ))}
      </div>
      <Modal open={!!edit} title="Risiko" onClose={() => setEdit(null)}>
        {edit && <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { await risks.save(v); setEdit(null) }} onDelete={async (id) => { await risks.remove(id); setEdit(null) }} />}
      </Modal>
    </div>
  )
}
