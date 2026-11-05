import { useEffect, useRef, useState } from 'react'
import { supabase, BUCKET } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useTable, DOC_CATEGORY, VISIBILITY, fmtDate } from '../lib/db'
import { Empty } from './ui'

/** Dokumentenliste mit Upload in den Bucket «dokumente» (Pfad = Sichtbarkeit/…) */
export default function DocList({ meetingId = null, defaultCategory = 'sonstiges', defaultVisibility = 'vr', area = null }) {
  const { isVR, profile, profiles } = useAuth()
  const docs = useTable('documents', {
    order: { column: 'created_at', ascending: false },
    filter: (q) => meetingId ? q.eq('meeting_id', meetingId) : (area ? q.in('visibility', area) : q),
    deps: [meetingId, area?.join()],
  })
  const [cat, setCat] = useState(defaultCategory)
  const [vis, setVis] = useState(isVR ? defaultVisibility : 'gl')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const fileRef = useRef()
  useEffect(() => setVis(isVR ? defaultVisibility : 'gl'), [defaultVisibility, isVR])

  const upload = async (file) => {
    if (!file) return
    setBusy(true); setErr(null)
    try {
      const safe = file.name.replace(/[^\w.\-äöüÄÖÜ]+/g, '_')
      const path = `${vis}/${new Date().toISOString().slice(0, 10)}_${crypto.randomUUID().slice(0, 8)}_${safe}`
      const { error: e1 } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
      if (e1) throw e1
      await docs.save({ title: file.name.replace(/\.[^.]+$/, ''), category: cat, meeting_id: meetingId, storage_path: path, file_name: file.name, size_bytes: file.size, visibility: vis, uploaded_by: profile?.id })
    } catch (ex) { setErr(ex.message) } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const open = async (d) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 300)
    if (error) return setErr(error.message)
    window.open(data.signedUrl, '_blank')
  }
  const del = async (d) => {
    if (!confirm(`«${d.title}» löschen?`)) return
    const { error } = await supabase.storage.from(BUCKET).remove([d.storage_path])
    if (error) return setErr('Datei konnte nicht gelöscht werden: ' + error.message)
    await docs.remove(d.id)
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg bg-cream p-3">
        <div className="min-w-[160px]"><label>Kategorie</label><select value={cat} onChange={(e) => setCat(e.target.value)}>{Object.entries(DOC_CATEGORY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div className="min-w-[160px]"><label>Sichtbarkeit</label><select value={vis} onChange={(e) => setVis(e.target.value)}>{Object.entries(VISIBILITY).filter(([k]) => isVR || k !== 'vr').map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div className="flex-1 min-w-[200px]"><label>Datei</label><input ref={fileRef} type="file" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} /></div>
      </div>
      {err && <div className="mb-2 rounded bg-red-50 p-2 text-xs text-red-800">{err}</div>}
      {docs.rows.length ? (
        <table className="w-full text-sm">
          <tbody>
            {docs.rows.map((d) => (
              <tr key={d.id} className="border-b border-sand/70">
                <td className="py-2"><button className="font-semibold text-forest hover:underline" onClick={() => open(d)}>{d.title}</button><div className="text-xs text-inkSoft">{d.file_name} · {d.size_bytes ? Math.round(d.size_bytes / 1024) + ' KB' : ''}</div></td>
                <td className="py-2 text-xs"><span className="chip bg-sand">{DOC_CATEGORY[d.category]}</span></td>
                <td className="py-2 text-xs text-inkSoft whitespace-nowrap">{VISIBILITY[d.visibility]}</td>
                <td className="py-2 text-xs text-inkSoft whitespace-nowrap">{fmtDate(d.created_at)} · {profiles.find((p) => p.id === d.uploaded_by)?.full_name?.split(' ')[0] ?? ''}</td>
                <td className="py-2 text-right">{(isVR || d.uploaded_by === profile?.id) && <button className="btn-ghost text-xs text-red-700" onClick={() => del(d)}>löschen</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <Empty>Noch keine Dokumente abgelegt.</Empty>}
    </div>
  )
}
