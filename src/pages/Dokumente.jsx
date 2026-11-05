import { PageHeader, Card } from '../components/ui'
import DocList from '../components/DocList'

export function VRDokumente() {
  return (
    <div>
      <PageHeader eyebrow="Verwaltungsrat" title="Dokumentenablage"
        intro="Eignerstrategie, Organisationsreglement, Pflichtenhefte, Finanzunterlagen, VSOP-Reglement, Protokolle. Dokumente mit Sichtbarkeit «nur VR» sind für die Geschäftsleitung unsichtbar." />
      <Card><DocList defaultCategory="reglement" defaultVisibility="vr" /></Card>
    </div>
  )
}

export function GLDokumente() {
  return (
    <div>
      <PageHeader eyebrow="Geschäftsleitung" title="GL-Dokumente"
        intro="AKV-Pflichtenhefte, Delegationsmandate, Rollenwahl-Unterlagen und alles, was der VR für die GL freigibt." />
      <Card><DocList defaultCategory="akv" defaultVisibility="gl" area={['gl', 'alle']} /></Card>
    </div>
  )
}
