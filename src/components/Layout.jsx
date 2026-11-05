import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Modal } from './ui'

const NAV = [
  { group: 'Übersicht', items: [
    { to: '/', label: 'Cockpit', exact: true },
    { to: '/meilensteine', label: 'Meilensteinplan' },
    { to: '/mein-bereich', label: 'Mein Bereich' },
  ]},
  { group: 'Verwaltungsrat', vr: true, items: [
    { to: '/vr/sitzungen', label: 'Sitzungen & Protokolle' },
    { to: '/vr/dokumente', label: 'Dokumentenablage' },
    { to: '/vr/kennzahlen', label: 'Finanz-Cockpit' },
    { to: '/vr/risiken', label: 'Risiken' },
  ]},
  { group: 'Instrumente', items: [
    { to: '/instrumente/zieltreppe', label: 'Zieltreppe' },
    { to: '/instrumente/team-canvas', label: 'Team-Canvas' },
    { to: '/instrumente/nf-canvas', label: 'Nachfolgefähigkeits-Canvas' },
    { to: '/instrumente/reviews', label: 'Review & Erfolgscheck' },
    { to: '/instrumente/retros', label: 'Retrospektiven' },
    { to: '/instrumente/12-monate', label: '12-Monats-Weg' },
  ]},
  { group: 'Geschäftsleitung', items: [
    { to: '/gl', label: 'GL-Mitglieder & AKV' },
    { to: '/gl/delegation', label: 'Delegationsmandate' },
    { to: '/gl/dokumente', label: 'GL-Dokumente' },
  ]},
  { group: 'Beteiligung', vr: true, items: [
    { to: '/vsop', label: 'VSOP-Programm' },
  ]},
  { group: 'Administration', admin: true, items: [
    { to: '/admin/mitglieder', label: 'Mitglieder & Rollen' },
  ]},
]

export default function Layout() {
  const { profile, isVR, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState(null)
  const [pw, setPw] = useState(false)
  useEffect(() => { const h = (e) => setErr(e.detail); window.addEventListener('app-error', h); return () => window.removeEventListener('app-error', h) }, [])
  const groups = NAV.filter((g) => (!g.vr || isVR) && (!g.admin || isAdmin))

  return (
    <div className="min-h-screen md:flex">
      <aside className={`${open ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0 bg-forest text-white md:min-h-screen`}>
        <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <div className="eyebrow !text-gold">Emmenpark AG</div>
          <div className="font-serif text-xl font-bold leading-tight">«Nach mir das Wir!»</div>
          <div className="text-xs text-muted mt-1">Nachfolgeplattform</div>
        </div>
        <nav className="px-3 py-4 space-y-5">
          {groups.map((g) => (
            <div key={g.group}>
              <div className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{g.group}</div>
              <div className="mt-1 space-y-0.5">
                {g.items.map((i) => (
                  <NavLink key={i.to} to={i.to} end={i.exact} onClick={() => setOpen(false)}
                    className={({ isActive }) => `block rounded-md px-2 py-1.5 text-sm ${isActive ? 'bg-white/15 text-white font-semibold' : 'text-white/80 hover:bg-white/10'}`}>
                    {i.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs text-muted">
          <div className="text-white font-semibold">{profile?.full_name ?? profile?.email}</div>
          <div>{profile?.funktion ?? profile?.role}</div>
          <div className="mt-2 flex gap-3"><button className="text-gold hover:underline" onClick={() => setPw(true)}>Passwort ändern</button><button className="text-gold hover:underline" onClick={signOut}>Abmelden</button></div>
        </div>
      </aside>
      <PasswordModal open={pw} onClose={() => setPw(false)} />
      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-between bg-forest px-4 py-3 text-white">
          <div className="font-serif font-bold">Nach mir das Wir!</div>
          <button className="btn-gold" onClick={() => setOpen(!open)}>Menü</button>
        </div>
        {err && <div className="mx-auto max-w-6xl px-4 pt-4 md:px-8"><div className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"><span>Daten konnten nicht geladen werden – {err}</span><button className="btn-ghost text-xs" onClick={() => setErr(null)}>×</button></div></div>}
        <main className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  )
}

function PasswordModal({ open, onClose }) {
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setMsg(null)
    if (p1.length < 10) return setMsg('Mindestens 10 Zeichen.')
    if (p1 !== p2) return setMsg('Die Passwörter stimmen nicht überein.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: p1 })
    setBusy(false)
    if (error) return setMsg(error.message)
    setMsg('Passwort geändert.'); setP1(''); setP2(''); setTimeout(onClose, 1200)
  }
  return (
    <Modal open={open} title="Passwort ändern" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div><label>Neues Passwort</label><input type="password" value={p1} onChange={(e) => setP1(e.target.value)} autoComplete="new-password" required /></div>
        <div><label>Wiederholen</label><input type="password" value={p2} onChange={(e) => setP2(e.target.value)} autoComplete="new-password" required /></div>
        {msg && <div className="rounded bg-cream p-2 text-sm">{msg}</div>}
        <div className="flex justify-end"><button className="btn-primary" disabled={busy}>Speichern</button></div>
      </form>
    </Modal>
  )
}
