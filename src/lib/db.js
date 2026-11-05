import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

/** Lädt eine Tabelle (oder View) und bietet reload/save/remove. */
export function useTable(table, { select = '*', order = null, filter = null, deps = [] } = {}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const seq = useRef(0)
  const reload = useCallback(async () => {
    const my = ++seq.current
    setLoading(true)
    let q = supabase.from(table).select(select)
    if (filter) q = filter(q)
    if (order) q = q.order(order.column, { ascending: order.ascending ?? true, nullsFirst: false })
    const { data, error } = await q
    if (my !== seq.current) return // ältere Antwort verwerfen
    if (error) { console.error(`[${table}]`, error.message); window.dispatchEvent(new CustomEvent('app-error', { detail: `${table}: ${error.message}` })) }
    setError(error); setRows(data ?? []); setLoading(false)
  }, [table, select, JSON.stringify(order), ...deps]) // eslint-disable-line

  useEffect(() => { reload() }, [reload])

  const save = async (values, writeTable = table) => {
    const clean = Object.fromEntries(Object.entries(values).filter(([k]) => !k.startsWith('_')))
    const { data, error } = clean.id
      ? await supabase.from(writeTable).update(clean).eq('id', clean.id).select().single()
      : await supabase.from(writeTable).insert(clean).select().single()
    if (error) throw error
    await reload()
    return data
  }
  const remove = async (id, writeTable = table) => {
    const { error } = await supabase.from(writeTable).delete().eq('id', id)
    if (error) throw error
    await reload()
  }
  return { rows, loading, error, reload, save, remove }
}

export const DIMENSIONS = {
  fundament: { label: 'Fundament', short: 'Hebel 1', hint: 'Zweck, Werte, Leitprinzipien – die Seele des Unternehmens in Worte fassen', color: '#D4A23A' },
  verwaltungsrat: { label: 'Verwaltungsrat', short: 'Hebel 2', hint: 'Ein VR, der das Lebenswerk mitträgt – Sparringpartner, Hüter des Ganzen', color: '#1F3D32' },
  team: { label: 'Organisation & Team', short: 'Hebel 3', hint: 'Aus Ausführenden werden Mitgestalter – Verantwortung verteilen', color: '#27483B' },
  person: { label: 'Person & Rolle', short: 'Hebel 4', hint: 'Die Unternehmerperson in einer Rolle, die sich wandelt', color: '#6B4F1D' },
}

export const STATUS = {
  geplant: { label: 'geplant', cls: 'bg-sand text-inkSoft' },
  in_arbeit: { label: 'in Arbeit', cls: 'bg-gold/20 text-goldSoft' },
  erledigt: { label: 'erledigt', cls: 'bg-forest/10 text-forest' },
  gefaehrdet: { label: 'gefährdet', cls: 'bg-red-100 text-red-800' },
  zurueckgestellt: { label: 'zurückgestellt', cls: 'bg-gray-200 text-gray-600' },
}

export const MEETING_KIND = {
  vr: 'VR-Sitzung', klausur: 'Klausur', steuerungsausschuss: 'Steuerungsausschuss', gl: 'GL-Sitzung',
  review: 'Review & Erfolgscheck', retro: 'Retrospektive', gv: 'Generalversammlung', eignerdialog: 'Strategie- & Nachfolgedialog',
}
export const DOC_CATEGORY = {
  protokoll: 'Protokoll', reglement: 'Reglement', eignerstrategie: 'Eignerstrategie', finanzen: 'Finanzen', vsop: 'VSOP',
  pflichtenheft: 'Pflichtenheft', akv: 'AKV', praesentation: 'Präsentation', sonstiges: 'Sonstiges',
}
export const VISIBILITY = { vr: 'nur VR', gl: 'VR + GL', alle: 'alle Mitglieder' }
export const PROFILSTUFE = { offen: 'offen', kader: 'Kader', gl_ohne_beteiligung: 'GL ohne Beteiligung', gl_mit_beteiligung: 'GL mit Beteiligung' }

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–'
export const fmtCHF = (n) => n == null ? '–' : 'CHF ' + Math.round(Number(n)).toLocaleString('de-CH').replace(/[’,]/g, "'")
export const fmtPct = (n, d = 1) => n == null ? '–' : Number(n).toFixed(d) + ' %'
export const quarterOf = (d) => { const x = new Date(d); return `${x.getFullYear()}-Q${Math.floor(x.getMonth() / 3) + 1}` }
export const today = () => new Date().toISOString().slice(0, 10)
