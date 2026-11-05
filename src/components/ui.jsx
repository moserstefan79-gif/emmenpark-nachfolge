import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { STATUS } from '../lib/db'

export function PageHeader({ eyebrow, title, intro, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="text-2xl md:text-3xl font-bold text-forest">{title}</h1>
        {intro && <p className="mt-1 max-w-3xl text-sm text-inkSoft">{intro}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, eyebrow, children, className = '', actions }) {
  return (
    <section className={`card p-4 md:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2 className="text-lg font-bold text-forest">{title}</h2>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatusChip({ status }) {
  const s = STATUS[status] ?? { label: status, cls: 'bg-sand' }
  return <span className={`chip ${s.cls}`}>{s.label}</span>
}

export function Empty({ children = 'Noch keine Einträge.' }) {
  return <div className="rounded-lg border border-dashed border-sand p-6 text-center text-sm text-inkSoft">{children}</div>
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-forestDeep/60 p-4 md:p-10" onMouseDown={onClose}>
      <div className={`card w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} p-5`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-forest">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>Schliessen</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * Generischer Formular-Editor. fields: [{name,label,type,options,required,hint,half}]
 * type: text | textarea | date | number | select | profile | checkbox | json-list
 */
export function EntityForm({ fields, initial = {}, onSubmit, onDelete, submitLabel = 'Speichern' }) {
  const { profiles } = useAuth()
  const [v, setV] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  useEffect(() => setV(initial), [initial])
  const set = (k, val) => setV((o) => ({ ...o, [k]: val }))

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      const out = { ...v }
      fields.forEach((f) => {
        if (f.type === 'number' && out[f.name] === '') out[f.name] = null
        if ((f.type === 'date' || f.type === 'select' || f.type === 'profile') && out[f.name] === '') out[f.name] = null
      })
      await onSubmit(out)
    } catch (ex) { setErr(ex.message ?? String(ex)) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.half ? '' : 'md:col-span-2'}>
          <label>{f.label}{f.required && ' *'}</label>
          {f.type === 'textarea' && <textarea value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} rows={f.rows ?? 3} />}
          {f.type === 'select' && (
            <select value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} required={f.required}>
              <option value="">–</option>
              {Object.entries(f.options).map(([k, l]) => <option key={k} value={k}>{typeof l === 'string' ? l : l.label}</option>)}
            </select>
          )}
          {f.type === 'profile' && (
            <select value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)}>
              <option value="">–</option>
              {profiles.filter((p) => !f.gremium || (p.gremium ?? '').includes(f.gremium)).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          )}
          {f.type === 'checkbox' && (
            <input type="checkbox" className="h-4 w-4 w-auto" checked={!!v[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
          )}
          {['text', 'date', 'number', 'time'].includes(f.type) && (
            <input type={f.type} step={f.step} value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} required={f.required} placeholder={f.placeholder} />
          )}
          {f.hint && <p className="mt-1 text-xs text-inkSoft">{f.hint}</p>}
        </div>
      ))}
      {err && <div className="md:col-span-2 rounded bg-red-50 p-2 text-sm text-red-800">{err}</div>}
      <div className="md:col-span-2 flex items-center justify-between pt-2">
        <div>{onDelete && v.id && <button type="button" className="btn-ghost text-red-700" onClick={() => confirm('Wirklich löschen?') && onDelete(v.id)}>Löschen</button>}</div>
        <button className="btn-primary" disabled={busy}>{busy ? '…' : submitLabel}</button>
      </div>
    </form>
  )
}

/** Einfache Liste editierbarer Zeilen (für jsonb-Arrays wie Vereinbarungen/Entscheide/Experimente) */
export function JsonList({ value = [], onChange, columns, addLabel = 'Zeile hinzufügen' }) {
  const rows = value
  const upd = (i, k, val) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: val } : r)))
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2" style={{ gridTemplateColumns: columns.map((c) => c.w ?? '1fr').join(' ') + ' auto' }}>
          {columns.map((c) => c.type === 'select'
            ? <select key={c.key} value={r[c.key] ?? ''} onChange={(e) => upd(i, c.key, e.target.value)}><option value="">{c.label}</option>{c.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            : <input key={c.key} type={c.type ?? 'text'} placeholder={c.label} value={r[c.key] ?? ''} onChange={(e) => upd(i, c.key, e.target.value)} />)}
          <button type="button" className="btn-ghost" onClick={() => onChange(rows.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="btn-ghost text-xs" onClick={() => onChange([...rows, {}])}>+ {addLabel}</button>
    </div>
  )
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className="card p-4">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone ?? 'text-forest'}`}>{value}</div>
      {sub && <div className="text-xs text-inkSoft">{sub}</div>}
    </div>
  )
}

export function Table({ cols, rows, onRow, empty }) {
  if (!rows.length) return <Empty>{empty}</Empty>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-sand text-left text-xs uppercase tracking-wide text-inkSoft">{cols.map((c) => <th key={c.key} className="py-2 pr-3 font-semibold">{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`border-b border-sand/70 ${onRow ? 'cursor-pointer hover:bg-cream' : ''}`} onClick={() => onRow?.(r)}>
              {cols.map((c) => <td key={c.key} className="py-2 pr-3 align-top">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
