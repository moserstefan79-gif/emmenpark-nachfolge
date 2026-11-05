import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTable } from '../lib/db'
import { PageHeader, Card, Modal, EntityForm, Table } from '../components/ui'

const ROLES = { admin: 'Admin (alles)', eigentuemer: 'Eigentümer / VRP', vr: 'Verwaltungsrat', gl: 'Geschäftsleitung' }

export default function Admin() {
  const { reload } = useAuth()
  const pr = useTable('profiles', { order: { column: 'sort' } })
  const [edit, setEdit] = useState(null)
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
          { key: 'login', label: 'Login', render: (p) => p.user_id ? <span className="chip bg-forest/10 text-forest">verknüpft</span> : <span className="chip bg-sand">noch nie angemeldet</span> },
          { key: 'active', label: 'Aktiv', render: (p) => p.active ? '✓' : '–' },
        ]} />
      </Card>
      <p className="mt-3 text-xs text-inkSoft">Platzhalter-Adressen (…@emmenpark.ch) vor der Einladung durch die echten Adressen ersetzen. Benutzer anlegen: Supabase → Authentication → Users → «Invite user» mit derselben E-Mail.</p>
      <Modal open={!!edit} title="Mitglied" onClose={() => setEdit(null)}>
        {edit && <EntityForm fields={fields} initial={edit} onSubmit={async (v) => { await pr.save(v); await reload(); setEdit(null) }} onDelete={async (id) => { await pr.remove(id); setEdit(null) }} />}
      </Modal>
    </div>
  )
}
