import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Meilensteine from './pages/Meilensteine'
import Sitzungen from './pages/Sitzungen'
import { VRDokumente, GLDokumente } from './pages/Dokumente'
import { Kennzahlen, Risiken } from './pages/Kennzahlen'
import Zieltreppe from './pages/Zieltreppe'
import { TeamCanvas, NfCanvas } from './pages/Canvas'
import { Reviews, Retros, Weg12 } from './pages/Routinen'
import { GLMitglieder, Delegation } from './pages/GL'
import Vsop from './pages/Vsop'
import MeinBereich from './pages/MeinBereich'
import Admin from './pages/Admin'

function Gate() {
  const { session, profile, isVR, isAdmin, signOut } = useAuth()
  if (session === undefined || (session && !profile)) return <div className="flex min-h-screen items-center justify-center text-inkSoft">Lade …</div>
  if (!session) return <Login />
  if (profile?.missing) return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-bold text-forest">Kein Zugang</h1>
        <p className="mt-2 text-sm text-inkSoft">Für {profile.email} ist kein Mitgliedsprofil hinterlegt. Bitte beim Administrator melden.</p>
        <button className="btn-ghost mt-4" onClick={signOut}>Abmelden</button>
      </div>
    </div>
  )
  const VR = ({ children }) => (isVR ? children : <Navigate to="/" />)
  const AD = ({ children }) => (isAdmin ? children : <Navigate to="/" />)
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="meilensteine" element={<Meilensteine />} />
        <Route path="mein-bereich" element={<MeinBereich />} />
        <Route path="vr/sitzungen" element={<VR><Sitzungen /></VR>} />
        <Route path="vr/dokumente" element={<VR><VRDokumente /></VR>} />
        <Route path="vr/kennzahlen" element={<VR><Kennzahlen /></VR>} />
        <Route path="vr/risiken" element={<VR><Risiken /></VR>} />
        <Route path="instrumente/zieltreppe" element={<Zieltreppe />} />
        <Route path="instrumente/team-canvas" element={<TeamCanvas />} />
        <Route path="instrumente/nf-canvas" element={<NfCanvas />} />
        <Route path="instrumente/reviews" element={<Reviews />} />
        <Route path="instrumente/retros" element={<Retros />} />
        <Route path="instrumente/12-monate" element={<Weg12 />} />
        <Route path="gl" element={<GLMitglieder />} />
        <Route path="gl/delegation" element={<Delegation />} />
        <Route path="gl/dokumente" element={<GLDokumente />} />
        <Route path="vsop" element={<VR><Vsop /></VR>} />
        <Route path="admin/mitglieder" element={<AD><Admin /></AD>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><BrowserRouter><Gate /></BrowserRouter></AuthProvider>
}
