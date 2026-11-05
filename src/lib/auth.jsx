import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])

  const loadProfile = useCallback(async (s) => {
    if (!s) { setProfile(null); setProfiles([]); return }
    const { data: me } = await supabase.from('profiles').select('*').eq('user_id', s.user.id).maybeSingle()
    setProfile(me ?? { missing: true, email: s.user.email })
    const { data: all } = await supabase.from('profiles').select('*').order('sort')
    setProfiles(all ?? [])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); loadProfile(data.session) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); loadProfile(s) })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const role = profile?.role
  const value = {
    session, profile, profiles,
    role,
    isVR: ['admin', 'vr', 'eigentuemer'].includes(role),
    isAdmin: role === 'admin',
    isGL: role === 'gl',
    reload: () => loadProfile(session),
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
