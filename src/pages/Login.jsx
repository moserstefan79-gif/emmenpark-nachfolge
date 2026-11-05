import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('password') // password | magic
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null)
    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      setMsg(error ? error.message : 'Login-Link wurde per E-Mail verschickt.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-forest flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="eyebrow !text-gold">Emmenpark AG · Nachfolgeplattform</div>
        <h1 className="font-serif text-4xl font-bold text-white">«Nach mir das Wir!»</h1>
        <p className="mt-2 text-sm text-muted">Verwaltungsrat · Geschäftsleitung · Beteiligung. Zugang nur für eingeladene Mitglieder.</p>
        <form onSubmit={submit} className="card mt-6 p-5 space-y-3">
          <div><label>E-Mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          {mode === 'password' && <div><label>Passwort</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>}
          {msg && <div className="rounded bg-cream p-2 text-sm text-ink">{msg}</div>}
          <button className="btn-primary w-full justify-center" disabled={busy}>{mode === 'magic' ? 'Login-Link senden' : 'Anmelden'}</button>
          <button type="button" className="btn-ghost w-full justify-center text-xs" onClick={() => setMode(mode === 'magic' ? 'password' : 'magic')}>
            {mode === 'magic' ? 'Mit Passwort anmelden' : 'Stattdessen Login-Link per E-Mail'}
          </button>
        </form>
        <p className="mt-4 text-xs text-muted">Die Rolle (VR / GL) wird über die hinterlegte E-Mail-Adresse zugewiesen.</p>
      </div>
    </div>
  )
}
