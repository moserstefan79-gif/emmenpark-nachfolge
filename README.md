# Nachfolgeplattform Emmenpark AG – «Nach mir das Wir!»

Begleitet den Nachfolgeprozess der Emmenpark AG entlang der vier Hebel aus «Nachfolgefähig werden»
(Fundament · Verwaltungsrat · Organisation & Team · Person & Rolle) mit den Instrumenten des Buchs.

## Bereiche

| Bereich | Inhalt | Zugriff |
|---|---|---|
| Cockpit | Reifegrad je Hebel, nächste Meilensteine (bis wann · wer · was), Sitzungen, eigene Aufgaben | alle |
| Meilensteinplan | Zeitachse (Phasen als Bänder, Meilensteine als Marker) und Liste; Filter nach Phase/Hebel/Status | alle (Sichtbarkeit pro Meilenstein) |
| Mein Bereich | eigene Meilensteine, Pendenzen aus Sitzungen, persönliche Zieltreppe, persönlicher Canvas | jedes Mitglied |
| VR · Sitzungen & Protokolle | Jahresagenda, Traktanden, Beschlüsse, Pendenzen (Beschlusskontrolle), Protokollablage | VR |
| VR · Dokumentenablage | Reglemente, Eignerstrategie, Pflichtenhefte, Finanzen, VSOP | VR (Sichtbarkeit «GL» gibt frei) |
| VR · Finanz-Cockpit | Nettoerlös, EBITA/EBIT, Gewinn, Personalkosten, Segment-DB, Delegationsquote, AKV-Abdeckung | VR |
| VR · Risiken | Frühindikatoren, Gegenmassnahmen, Verantwortliche | VR |
| Instrumente | Zieltreppe · Team-Canvas · Nachfolgefähigkeits-Canvas · Review & Erfolgscheck · Retrospektiven · 12-Monats-Weg | alle (Sichtbarkeit) |
| GL | Mitglieder & AKV, Stellvertretungsmatrix, Rollenwahl (Opting-in), Delegationsmandate, GL-Dokumente | GL + VR |
| VSOP | Parameter, Szenarien (Low/Base/High), Teilnehmende, Vesting, Ereignisregister | VR (Teilnehmende sehen nur sich) |
| Administration | Mitglieder, Rollen, E-Mail-Adressen | Admin |

Rollen: `admin` (alles) · `eigentuemer` / `vr` (VR-Bereich, VSOP-Beschlüsse, Dokumente «nur VR») · `gl` (GL-Bereich, freigegebene Dokumente, eigene AKV).
Die Rolle wird beim ersten Login über die hinterlegte E-Mail-Adresse zugewiesen (Trigger auf `auth.users`).

## Technik

- Supabase-Projekt `emmenpark-nachfolge` (Region Zürich, eu-central-2): Postgres, Auth, Storage-Bucket `dokumente`
- React 19 + Vite, Tailwind 3, react-router, @supabase/supabase-js
- Row Level Security auf allen Tabellen; Storage-Pfade `vr/…`, `gl/…`, `alle/…` steuern die Sichtbarkeit
- Migrationen in `supabase/migrations/` (Schema + Seed aus Eignerstrategie, Fahrplan, Pflichtenheften, AKV, Vorgehensplan, ER 2025)

## Lokal starten

```bash
npm install
cp .env.example .env        # URL + Publishable Key sind bereits eingetragen
npm run dev
```

## Deployment (Netlify, wie Weinclub-Plattform)

1. Leeres GitHub-Repo `emmenpark-nachfolge` anlegen, dann im Projektordner:
   `git remote add origin git@github.com:moserstefan79-gif/emmenpark-nachfolge.git && git push -u origin main`
2. Netlify → «Add new site» → Repo wählen. Build: `npm run build`, Publish: `dist` (steht in `netlify.toml`).
3. Netlify → Site configuration → Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Werte aus `.env.example`).
4. Supabase → Authentication → URL Configuration: Site URL und Redirect URL auf die Netlify-Domain setzen (für Login-Links).

## Mitglieder einladen

1. Administration → Mitglieder: Platzhalter-Adressen (`…@emmenpark.ch`) durch die echten ersetzen.
2. Supabase → Authentication → Users → «Invite user» mit derselben Adresse, oder das Mitglied fordert auf der Login-Seite einen Login-Link an (E-Mail-Signup muss in Supabase Auth aktiv sein).
3. Beim ersten Login wird das Profil automatisch verknüpft.

## Sichtprüfung ohne Netz

`npx vite build -c vite.mock.config.js && npx vite preview -c vite.mock.config.js` startet die App mit einem In-Memory-Mock (`mock/`) und einem Daten-Snapshot – nur für Layout-Tests.
