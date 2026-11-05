import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useTable } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Table } from '../components/ui'

const ROLES = { admin: 'Admin (alles)', eigentuemer: 'Eigentümer / VRP', vr: 'Verwaltungsrat', gl: 'Geschäftsleitung' }

export default function Admin() {
  const { reload } = useAuth()
  const pr = useTable('profiles', { order: { column: 'sort' } })
  const [edit, setEdit] = useState(null)
  const [login, setLogin] = useState(null) // { email, full_name, password }
  const [busy, setBusy] = useState(false)

  const createLogin = async (p, reset = false) => {
    if (reset && !confirm(`Neues Startpasswort für ${p.full_name} setzen? Das bisherige Passwort wird ungültig.`)) return
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('create-login', { body: { profile_id: p.id, reset } })
    setBusy(false)
    const msg = error ? (await error.context?.json?.().catch(() => null))?.error ?? error.message : data?.error
    if (msg) return alert(msg)
    await pr.reload(); await reload(); setEdit(null); setLogin(data)
  }
  const siteUrl = window.location.origin
  const mailto = (l) => {
    const subject = 'Ihr Zugang zur Nachfolgeplattform «Nach mir das Wir!» – Emmenpark AG'
    const body = `Guten Tag ${l.full_name.split(' ')[0]}

Für die Begleitung unseres Nachfolgeprozesses steht die Plattform «Nach mir das Wir!» bereit. Ihr persönlicher Zugang:

Adresse:   ${siteUrl}
Login:     ${l.email}
Passwort:  ${l.password}

Bitte ändern Sie das Startpasswort nach dem ersten Login (Seitenleiste unten → «Passwort ändern»). Die Inhalte sind vertraulich und nur für den Verwaltungsrat bzw. die Geschäftsleitung bestimmt.

Freundliche Grüsse
Stefan Moser`
    return `mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  const fields = [
    { name: 'full_name', label: 'Name', type: 'text', required: true, half: true },
    { name: 'email', label: 'E-Mail (Login-Adresse)', type: 'text', required: true, half: true, hint: 'Die Rolle wird beim ersten Login über diese Adresse zugewiesen.' },
    { name: 'role', label: 'Rolle / Rechte', type: 'select', options: ROLES, required: true, half: true },
    { name: 'gremium', label: 'Gremium', type: 'select', options: { VR: 'VR', GL: 'GL', 'VR+GL': 'VR+GL' }, half: true },
    { name: 'funktion', label: 'Funktion', type: 'text', half: true },
    { name: 'ressort', label: 'Ressort', type: 'text', half: true },
    { name: 'sort', label: 'Sortierung', type: 'number', half: true },
    { name: 'active', label: 'Aktiv', type: 'checkbox', half: true },
  ]
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Mitglieder & Rollen"
        intro="Rechte: Admin (alles) · Eigentümer/VR (VR-Bereich, VSOP-Beschlüsse, Dokumente «nur VR») · GL (GL-Bereich, freigegebene Dokumente, eigene AKV). Mitglieder erhalten Zugang, sobald sie sich mit der hinterlegten E-Mail registrieren oder einen Login-Link anfordern."
        actions={<button className="btn-gold" onClick={() => setEdit({ role: 'gl', gremium: 'GL', active: true, sort: 200 })}>+ Mitglied</button>} />
      <Card>
        <Table rows={pr.rows} onRow={(p) => setEdit(p)} cols={[
          { key: 'full_name', label: 'Name', render: (p) => <b>{p.full_name}</b> },
          { key: 'email', label: 'E-Mail' },
          { key: 'role', label: 'Rechte', render: (p) => ROLES[p.role] },
          { key: 'gremium', label: 'Gremium' },
          { key: 'funktion', label: 'Funktion' },
          { key: 'login', label: 'Login', render: (p) => (
            <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {p.user_id ? <span className="chip bg-forest/10 text-forest">aktiv</span> : <span className="chip bg-sand">kein Login</span>}
              {p.user_id
                ? <button className="btn-ghost text-xs" disabled={busy} onClick={() => createLogin(p, true)}>Passwort zurücksetzen</button>
                : <button className="btn-gold text-xs" disabled={busy} onClick={() => createLogin(p)}>Login + Mail erstellen</button>}
            </div>) },
          { key: 'active', label: 'Aktiv', render: (p) => p.active ? '✓' : '–' },
        ]} />
      </Card>
      <p className="mt-3 text-xs text-inkSoft">«Login + Mail erstellen» legt das Konto mit Startpasswort an und öffnet die fertige Einladung in Ihrem Mailprogramm – so kommt sie von Ihrer Adresse.</p>
      <Modal open={!!login} title="Login erstellt" onClose={() => setLogin(null)}>
        {login && (
          <div className="space-y-3 text-sm">
            <p>Das Konto für <b>{login.full_name}</b> ist angelegt. Startpasswort (wird nur jetzt angezeigt):</p>
            <div className="rounded bg-cream p-3 font-mono text-base">{login.email}<br />{login.password}</div>
            <p className="text-xs text-inkSoft">Die Mail enthält Adresse, Login und Startpasswort sowie den Hinweis, das Passwort nach dem ersten Login zu ändern.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(`${login.email}\n${login.password}`)}>Kopieren</button>
              <a className="btn-primary" href={mailto(login)}>Login-Mail öffnen</a>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!edit} title="Mitglied" onClose={() => setEdit(null)}>
        {edit && <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { await pr.save(v); await reload(); setEdit(null) }} onDelete={async (id) => { if (!confirm('Achtung: Löschen entfernt auch AKV, VSOP-Teilnahme und Ereignisse dieser Person. Besser: «Aktiv» abwählen. Trotzdem löschen?')) return; await pr.remove(id); setEdit(null) }} />}
      </Modal>
    </div>
  )
}
