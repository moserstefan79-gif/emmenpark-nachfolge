-- Seed aus Eignerstrategie/Fahrplan, Pflichtenheften, AKV, Vorgehensplan, ER 2025
-- E-Mail-Adressen ausser Stefan Moser sind Platzhalter und im Admin-Bereich zu ersetzen.

insert into profiles (email, full_name, role, funktion, ressort, gremium, sort) values
('moser.stefan79@gmail.com','Stefan Moser','admin','Mitglied · Sitzungsleitung & Traktandierung (delegiert)','Finanzen & Audit','VR',10),
('markus.balsiger@emmenpark.ch','Markus Balsiger','eigentuemer','Präsident (VRP) · CEO · Inhaber','Präsidium / operative Sicht','VR+GL',5),
('tom.burkhalter@emmenpark.ch','Tom Burkhalter','vr','Mitglied','Marke, Kommunikation & Employer Branding','VR',20),
('wolfgang.aeberhard@emmenpark.ch','Wolfgang Aeberhard','vr','Mitglied','Standort- & Konzeptentwicklung','VR',30),
('christian.scheuermeyer@emmenpark.ch','Christian Scheuermeyer','gl','Finanzen / Stv. GF','Cockpit, Segment-DB, Liquidität','GL',110),
('andreas.moser@emmenpark.ch','Andreas Moser','gl','Leitung Catering','Catering','GL',120),
('michelle.vonfluee@emmenpark.ch','Michelle von Flüe','gl','Leitung Events','Events','GL',130),
('damaris.strebel@emmenpark.ch','Damaris Strebel','gl','Leitung Events','Events','GL',140),
('lina.walter@emmenpark.ch','Lina Walter','gl','Leitung Events','Events','GL',150),
('christian.selau@emmenpark.ch','Christian Selau','gl','Leitung 1881 Kantine','Gastronomie','GL',160),
('stefan.raetz@emmenpark.ch','Stefan Rätz','gl','Leitung Küche','Produktion','GL',170);

-- Phasen
insert into phases (nr, title, subtitle, dimension, start_date, end_date, color) values
(1,'Grundlagen & Verpflichtung','Q3 2026 · Eignerstrategie, Mandatsgespräche, Statuten','fundament','2026-07-01','2026-09-30','#D4A23A'),
(2,'Regelwerke & GL-Vorbereitung','Q4 2026 · Pflichtenhefte, CEO-Mandat, AKV, VSOP, Cockpit','verwaltungsrat','2026-10-01','2026-12-31','#1F3D32'),
(3,'Wahl, Konstituierung, Kommunikation','Q1 2027 · a.o. GV, Konstituierung, Kick-off-Klausur','verwaltungsrat','2027-01-01','2027-03-31','#27483B'),
(4,'Aufbaujahr 2027','Q2–Q4 2027 · Governance einspielen, Delegation, Rollenwahl','team','2027-04-01','2027-12-31','#B8862A'),
(5,'Beteiligung & Führungsentwicklung','2028–2029 · Opting-in, Vesting, Führungsentwicklung','team','2028-01-01','2029-12-31','#163028'),
(6,'Eigentumsnachfolge entscheiden','2030–2031 · Bewertungsmatrix aktualisieren, Entscheid, Übergabe','person','2030-01-01','2031-12-31','#6B4F1D');

-- Meilensteine (Fahrplan Teil D + Vorgehensplan)
with p as (select nr, id from phases), o as (select email, id from profiles)
insert into milestones (phase_id, nr, title, description, dimension, owner_id, owner_label, due_date, status, source, sort) values
((select id from p where nr=1),'1','Eignerstrategie im Eignerworkshop ausformulieren und unterzeichnen','Rohling Teil A; Platzhalter EK-Quote, Liquiditätsreserve, Dividendenformel, Eigentümervorbehalts-Betrag füllen','fundament',(select id from o where email='markus.balsiger@emmenpark.ch'),'EI, ggf. EXT-Moderation','2026-09-30','in_arbeit','Fahrplan D.1 Nr. 1',1),
((select id from p where nr=1),'2','Mandatsgespräche mit Tom Burkhalter und Wolfgang Aeberhard','Erwartungen, Ressort, Zeitbudget, Honorar, Interessenbindungen','verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),'EI/VRP, Stefan Moser','2026-09-30','in_arbeit','Fahrplan D.1 Nr. 2',2),
((select id from p where nr=1),'3','Schriftliche Annahmeerklärungen der designierten VR einholen',null,'verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),null,'2026-09-30','in_arbeit','Fahrplan D.1 Nr. 3',3),
((select id from p where nr=1),'4','Statuten prüfen; allfällige Statutenänderung für GV vorbereiten','Anzahl VR, Vinkulierung, Zeichnung, Delegation Sitzungsleitung','verwaltungsrat',null,'EXT Recht','2026-09-30','in_arbeit','Fahrplan D.1 Nr. 4',4),
((select id from p where nr=1),'5','Organisationsreglement entwerfen','Trennung VR/GL, Kompetenzordnung, Ausstandsregeln, Delegation Sitzungsleitung/Traktandierung an S. Moser, Stichentscheid-Regel, Zirkularbeschlüsse','verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),'Stefan Moser, EXT Recht','2026-11-30','in_arbeit','Fahrplan D.1 Nr. 5',5),
((select id from p where nr=2),'6','Pflichtenhefte VR (VRP, Sitzungsleitung) und Ressorts finalisieren',null,'verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),'Stefan Moser, VR designiert','2026-11-30','in_arbeit','Fahrplan D.2 Nr. 6',6),
((select id from p where nr=2),'7','CEO-Mandat Markus Balsiger formalisieren','AKV CEO, Zielvereinbarung, Regelung der Doppelrolle VRP/CEO (Ausstand, Stichentscheid)','verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),'Stefan Moser, nicht-exek. VR, EI','2026-11-30','geplant','Fahrplan D.2 Nr. 7',7),
((select id from p where nr=2),'8','AKV-Dokumentation aller GL-Schlüsselrollen inkl. Stellvertretungen abschliessen','Ziel 100 % Abdeckung vor Start Frühling 2027','team',(select id from o where email='markus.balsiger@emmenpark.ch'),'GL, PMO','2026-12-31','geplant','Fahrplan D.2 Nr. 8',8),
((select id from p where nr=2),'9','VSOP-Reglement anpassen, Tragbarkeit validieren, Steuerruling einreichen','Gesamte GL ohne Inhaber, 2 % pro Person, Pool ~16 %, Auszahlungs-Cap prüfen','team',null,'EXT Recht/Steuern/Treuhand','2026-12-31','geplant','Fahrplan D.2 Nr. 9',9),
((select id from p where nr=2),'10','D&O-Versicherung für den neuen VR offerieren lassen und abschliessen',null,'verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),null,'2026-12-31','geplant','Fahrplan D.2 Nr. 10',10),
((select id from p where nr=2),'11','Reporting-Cockpit: Kennzahlen-Set pro Segment definiert, Buchhaltung auf Segment-DB umgestellt',null,'fundament',(select id from o where email='christian.scheuermeyer@emmenpark.ch'),'CFO, EXT','2026-12-31','geplant','Fahrplan D.2 Nr. 11',11),
((select id from p where nr=2),'12','Einladung und Traktanden der a.o. Generalversammlung vorbereiten','Wahl VR und VRP, ggf. Statutenänderung','verwaltungsrat',(select id from o where email='markus.balsiger@emmenpark.ch'),'EI, EXT Recht','2026-12-31','geplant','Fahrplan D.2 Nr. 12',12),
((select id from p where nr=3),'13','a.o. Generalversammlung: Wahl der neuen VR-Mitglieder und des VRP','Harter Meilenstein','verwaltungsrat',(select id from o where email='markus.balsiger@emmenpark.ch'),'EI (GV)','2027-01-31','geplant','Fahrplan D.3 Nr. 13',13),
((select id from p where nr=3),'14','Handelsregisteranmeldung: Mutationen VR, Zeichnungsberechtigungen',null,'verwaltungsrat',null,'EXT Recht','2027-02-15','geplant','Fahrplan D.3 Nr. 14',14),
((select id from p where nr=3),'15','Konstituierende VR-Sitzung','Organisationsreglement in Kraft setzen, Ressorts bestätigen, Jahresagenda 2027 beschliessen','verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),'VRP (Einberufung), Stefan Moser (Leitung)','2027-02-28','geplant','Fahrplan D.3 Nr. 15',15),
((select id from p where nr=3),'16','Information der GL über das Rollenwahl-Modell und den Opting-in-Prozess ab 2028','Start der individuellen Erstgespräche','team',(select id from o where email='markus.balsiger@emmenpark.ch'),'CEO/VRP, Stefan Moser','2027-03-31','geplant','Fahrplan D.3 Nr. 16',16),
((select id from p where nr=3),'17','Kommunikation Stufenplan: GL/Schlüsselpersonen, All-Hands, Banken/Schlüsselkunden',null,'fundament',(select id from o where email='tom.burkhalter@emmenpark.ch'),'GL, Ressort Marke','2027-03-31','geplant','Fahrplan D.3 Nr. 17',17),
((select id from p where nr=3),'18','GL-Briefing: Rollenverständnis des neuen VR, Kontaktordnung, Erwartungen','Zusage «mehr Unterstützung, nicht mehr Kontrolle»','team',(select id from o where email='moser.stefan79@gmail.com'),'Stefan Moser, CEO/VRP','2027-03-31','geplant','Fahrplan D.3 Nr. 18',18),
((select id from p where nr=3),'19','Kick-off-Klausur VR/GL','Eignerstrategie vorstellen, Unternehmensstrategie-Arbeit starten, Nachfolge-Roadmap bestätigen','fundament',(select id from o where email='moser.stefan79@gmail.com'),'Stefan Moser (Leitung), VRP','2027-04-30','geplant','Fahrplan D.3 Nr. 19',19),
((select id from p where nr=4),'20','Normatives Fundament finalisieren und ausrollen','Mission, Vision, Kernwerte mit Verhaltensankern; Integration in Rekrutierung und MA-Gespräche','fundament',(select id from o where email='markus.balsiger@emmenpark.ch'),'EI, GL, PMO','2027-06-30','geplant','Vorgehensplan 1.1–1.4',20),
((select id from p where nr=4),'21','Delegations-Pilot in drei Bereichen in Betrieb','Catering-Leitung, Projektleitung Events, Finanzreporting – schriftliche Mandate, monatliches Review','team',(select id from o where email='markus.balsiger@emmenpark.ch'),'EI, GL','2027-06-30','geplant','Vorgehensplan 1.9–1.11',21),
((select id from p where nr=4),'22','Reporting-Cockpit mit Segment-Deckungsbeiträgen im VR etabliert',null,'fundament',(select id from o where email='moser.stefan79@gmail.com'),'Ressort Finanzen, CFO','2027-06-30','geplant','Pflichtenheft SM',22),
((select id from p where nr=4),'23','Erste Zielvereinbarung CEO abgeschlossen','durch die nicht-exekutiven Mitglieder, Federführung SM','verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),null,'2027-06-30','geplant','Pflichtenheft SM',23),
((select id from p where nr=4),'24','Rollenwahl-Gespräche mit allen GL-Mitgliedern geführt; Opting-in-Entscheide dokumentiert','Kader / GL ohne Beteiligung / GL mit Beteiligung','team',(select id from o where email='markus.balsiger@emmenpark.ch'),'CEO/VRP und Stefan Moser','2027-12-31','geplant','Fahrplan D.4',24),
((select id from p where nr=4),'25','VR-Beschluss über die Opting-in-Zuteilungen; Zuteilungsschreiben per 1.1.2028',null,'team',(select id from o where email='moser.stefan79@gmail.com'),'VR (nicht-exekutive Mitglieder)','2027-12-31','geplant','Fahrplan D.4',25),
((select id from p where nr=4),'26','Review Rollen, Ressorts und Pflichtenhefte 12 Monate nach Konstituierung','inkl. Überprüfung der Gewaltenteilung (Präsidium/CEO/Eigentum in einer Person)','verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),null,'2028-02-28','geplant','Eignerstrategie B.2',26),
((select id from p where nr=5),'27','Vesting-Beginn für alle Beigetretenen; erste Rückstellungsbildung im Abschluss 2028',null,'team',(select id from o where email='moser.stefan79@gmail.com'),'Ressort Finanzen','2028-12-31','geplant','Fahrplan D.4',27),
((select id from p where nr=5),'28','Potenzialanalyse 3–5 Schlüsselpersonen und individuelle Entwicklungspläne','Coaching, Weiterbildung, Mentoring durch VR-Mitglieder','team',(select id from o where email='markus.balsiger@emmenpark.ch'),'EI, GL, EXT HR','2028-06-30','geplant','Vorgehensplan 2.1–2.2',28),
((select id from p where nr=5),'29','Erstes Selbstassessment des Gremiums durchgeführt','inkl. Kompetenzmatrix','verwaltungsrat',(select id from o where email='moser.stefan79@gmail.com'),null,'2028-03-31','geplant','Pflichtenheft SM',29),
((select id from p where nr=6),'30','Standortbestimmung: Wirkung Beteiligungsprogramm, Reife der Führung, finanzielle Lage',null,'person',(select id from o where email='moser.stefan79@gmail.com'),'VR, GL, PMO','2030-03-31','geplant','Vorgehensplan 3.1',30),
((select id from p where nr=6),'31','Aktualisierung der Bewertungsmatrix; Entscheid Eigentumsnachfolge','interne Nachfolge mit Beteiligung, MBO oder externer Verkauf','person',(select id from o where email='markus.balsiger@emmenpark.ch'),'EI, VR','2030-09-30','geplant','Vorgehensplan 3.2–3.3',31),
((select id from p where nr=6),'32','Detaillierter Übergabeplan inkl. Onboarding und Coaching für neue Führung',null,'person',null,'PMO, EXT','2031-12-31','geplant','Vorgehensplan 3.6',32);

-- Sitzungen
with o as (select email, id from profiles)
insert into meetings (kind, title, date, time_from, location, chair_id, status, notes) values
('vr','Kick-off Verwaltungsrat 2027','2026-11-30','17:00','[Ort]',(select id from o where email='moser.stefan79@gmail.com'),'geplant','Datum/Ort noch zu fixieren · ca. 2 Stunden · vertraulich'),
('gv','a.o. Generalversammlung – Wahl VR und VRP','2027-01-20',null,'Emmenpark',(select id from o where email='markus.balsiger@emmenpark.ch'),'geplant','Harter Meilenstein'),
('vr','Konstituierende VR-Sitzung','2027-02-15','17:00','Emmenpark',(select id from o where email='moser.stefan79@gmail.com'),'geplant','Organisationsreglement in Kraft, Ressorts, Jahresagenda 2027'),
('klausur','Kick-off-Klausur VR/GL','2027-03-26','08:30','extern',(select id from o where email='moser.stefan79@gmail.com'),'geplant','Eignerstrategie vorstellen, Strategiearbeit starten, Roadmap bestätigen'),
('vr','VR-Sitzung Q2 2027','2027-05-20','17:00','Emmenpark',(select id from o where email='moser.stefan79@gmail.com'),'geplant','Cockpit, Nachfolge als ständiges Traktandum'),
('review','Review & Erfolgscheck Q2 2027','2027-06-24','16:00','Emmenpark',(select id from o where email='moser.stefan79@gmail.com'),'geplant','Was ist gelungen? Wo abgekommen? Was braucht es jetzt?'),
('vr','VR-Sitzung Q3 2027','2027-09-16','17:00','Emmenpark',(select id from o where email='moser.stefan79@gmail.com'),'geplant',null),
('vr','VR-Sitzung Q4 2027 – Opting-in-Beschlüsse','2027-11-25','17:00','Emmenpark',(select id from o where email='moser.stefan79@gmail.com'),'geplant','VSOP-Zuteilungen per 1.1.2028'),
('eignerdialog','Strategie- und Nachfolgedialog 2027','2027-12-09','08:30','extern',(select id from o where email='moser.stefan79@gmail.com'),'geplant','1 Tag, Moderation Stefan Moser, Review Eignerstrategie');

with m as (select id from meetings where title='Kick-off Verwaltungsrat 2027'), o as (select email, id from profiles)
insert into agenda_items (meeting_id, nr, title, presenter_id, duration_min, kind) values
((select id from m),1,'Begrüssung & Ziel des Treffens',(select id from o where email='moser.stefan79@gmail.com'),10,'information'),
((select id from m),2,'Ausgangslage: Ergebnisse der CAS-Projektarbeit',(select id from o where email='moser.stefan79@gmail.com'),10,'information'),
((select id from m),3,'Eignerstrategie – Eckpunkte & Diskussion',(select id from o where email='markus.balsiger@emmenpark.ch'),20,'diskussion'),
((select id from m),4,'VR-Ressorts, Mandate & Erwartungen – Diskussion',(select id from o where email='moser.stefan79@gmail.com'),25,'diskussion'),
((select id from m),5,'Beteiligungsprogramm (VSOP) & Geschäftsleitung',(select id from o where email='moser.stefan79@gmail.com'),10,'information'),
((select id from m),6,'Fahrplan bis Frühling 2027',(select id from o where email='moser.stefan79@gmail.com'),15,'diskussion'),
((select id from m),7,'Entscheide festhalten (Beschlussprotokoll)',(select id from o where email='moser.stefan79@gmail.com'),20,'beschluss'),
((select id from m),8,'Nächste Schritte & Abschluss',(select id from o where email='moser.stefan79@gmail.com'),10,'information');

-- Zieltreppe Unternehmen
with z as (
  insert into zieltreppen (scope, title, zukunftsbild, horizon_years, visibility)
  values ('unternehmen','Zieltreppe Emmenpark AG','In fünf Jahren ist die Emmenpark AG ein eigenständiges, regional verankertes, wertebasiertes Gastronomie- und Erlebnisunternehmen, das ohne die tägliche Präsenz des Inhabers tragfähig ist: Ein Verwaltungsrat, der Richtung hält und challengt; eine Geschäftsleitung, die das Tagesgeschäft selbständig führt und über das VSOP am Erfolg beteiligt ist; ein normatives Fundament, das im Alltag gelebt wird; und ein Eigentümer, der seine Rolle bewusst verändert hat – vom Zentrum zum Mitträger.',5,'vr')
  returning id)
insert into zieltreppe_stufen (zieltreppe_id, nr, zustand, dimension, target_date) values
((select id from z),1,'Der neue VR ist gewählt, konstituiert und arbeitsfähig; Organisationsreglement und Pflichtenhefte sind in Kraft.','verwaltungsrat','2027-03-31'),
((select id from z),2,'Das normative Fundament (Mission, Vision, Werte, Verhaltensanker) ist im Alltag verankert; AKV-Abdeckung 100 %.','fundament','2027-12-31'),
((select id from z),3,'Die GL führt das Tagesgeschäft eigenständig; Delegationsquote steigt messbar; Cockpit mit Segment-DB läuft monatlich.','team','2027-12-31'),
((select id from z),4,'Alle GL-Mitglieder haben ihre Rolle gewählt; Opting-in-Zuteilungen sind beschlossen, Vesting läuft ab 1.1.2028.','team','2028-01-31'),
((select id from z),5,'Das Unternehmen kann einen längeren Ausfall des Inhabers überbrücken; 3–5 Schlüsselpersonen sind mit Entwicklungsplänen unterwegs.','person','2029-06-30'),
((select id from z),6,'Eine klare Nachfolgeoption (intern mit Beteiligung oder MBO) ist entschieden; Übergabeplan liegt vor.','person','2030-12-31');

with s as (select id, nr from zieltreppe_stufen), o as (select email, id from profiles)
insert into zieltreppe_etappen (stufe_id, title, quarter, owner_id) values
((select id from s where nr=1),'Organisationsreglement inkl. Delegation Sitzungsleitung entwerfen','2026-Q4',(select id from o where email='moser.stefan79@gmail.com')),
((select id from s where nr=1),'a.o. GV terminieren und Einladung versenden','2026-Q4',(select id from o where email='markus.balsiger@emmenpark.ch')),
((select id from s where nr=1),'Konstituierende Sitzung und Jahresagenda 2027','2027-Q1',(select id from o where email='moser.stefan79@gmail.com')),
((select id from s where nr=2),'Team-Canvas mit der GL durchführen (halber Tag)','2027-Q2',(select id from o where email='markus.balsiger@emmenpark.ch')),
((select id from s where nr=2),'Verhaltensanker in MA-Gespräche und Rekrutierung einbauen','2027-Q3',(select id from o where email='markus.balsiger@emmenpark.ch')),
((select id from s where nr=3),'Drei Delegationsmandate schriftlich vereinbaren','2027-Q2',(select id from o where email='markus.balsiger@emmenpark.ch')),
((select id from s where nr=3),'Erster Review & Erfolgscheck mit der GL','2027-Q2',(select id from o where email='moser.stefan79@gmail.com')),
((select id from s where nr=4),'Rollenwahl-Gespräche mit jedem GL-Mitglied','2027-Q3',(select id from o where email='markus.balsiger@emmenpark.ch'));

-- Team-Canvas VR (Rohling)
insert into team_canvas (team, version_date, auftrag, ziele, rollen, spielregeln, risiken, beduerfnisse, vereinbarungen, visibility) values
('VR','2027-02-15',
 'Der VR wirkt als strategischer Sparringspartner: er challengt, hinterfragt, gibt Impulse – führt nicht operativ. Er trägt die Oberleitung, die Oberaufsicht über die GL und den Nachfolgeprozess.',
 '1) Neuer VR arbeitsfähig (Q1 2027) · 2) Cockpit mit Segment-DB (Q2 2027) · 3) AKV 100 % und Delegations-Pilot (2027) · 4) Opting-in-Zuteilungen beschlossen (Q4 2027) · 5) Jährlicher Strategie- und Nachfolgedialog',
 'Markus Balsiger: VRP, CEO, Inhaber – Präsidium, operative Sicht, Gastro-Innovation · Stefan Moser: Sitzungsleitung & Traktandierung, Finanzen & Audit, Sponsor Nachfolgeprozess · Tom Burkhalter: Marke, Kommunikation & Employer Branding · Wolfgang Aeberhard: Standort- & Konzeptentwicklung, Gast-Perspektive',
 'Unterlagen 7 Tage vor der Sitzung · Kontaktordnung VR–GL: Einzelkontakte transparent, keine operativen Vorgaben · Ausstand bei Interessenkonflikten, im Protokoll vermerkt · Hüte explizit benennen (CEO / VRP / Eigentümer) · Business-Judgement-Rule',
 'Präsidium, CEO und Eigentum in einer Person · Personenabhängigkeit vom Inhaber · Gastronomie-Fachkompetenz nur über den CEO · Interessenbindungen Augenweide / wa Architektur',
 'Zugang zu Unterlagen und GL-Ansprechpersonen · ehrliche, frühe Information auch bei schlechten Nachrichten · Verfügbarkeit zwischen den Sitzungen',
 '[]'::jsonb,'vr');

-- Nachfolgefähigkeits-Canvas: Standortbestimmung aus der Ist-Analyse
with c as (
  insert into nf_canvas (title, assessment_date, typmuster, visibility)
  values ('Standortbestimmung Ist-Analyse 2026','2026-07-01','Alles läuft über mich','vr') returning id)
insert into nf_canvas_fields (canvas_id, dimension, traegt, blockiert, bewegung, score) values
((select id from c),'fundament','Starke Kultur (Herzlichkeit, Ehrlichkeit, Teamgeist, Fairness, Nachhaltigkeit); starke Marke; hohe Erlebnisorientierung','Fundament vor allem im Kopf des Inhabers; Mission/Vision/Werte nicht operationalisiert; keine Verhaltensanker','Mission, Vision, Kernwerte mit Verhaltensankern finalisieren und im Alltag verankern (Phase 1)',2),
((select id from c),'verwaltungsrat','Eigentümer will Verantwortung teilen; vier komplementäre VR-Profile designiert','VR und GL vermischt; keine Trennung strategisch/operativ; VR bisher pro forma','Neuer VR ab Frühling 2027: Organisationsreglement, Pflichtenhefte, Sitzungsleitung delegiert, Oberaufsicht durch nicht-exekutive Mitglieder',2),
((select id from c),'team','Loyales, engagiertes Team; diversifiziertes Geschäftsmodell mit Synergien','AKV unklar, Stellvertretungen lückenhaft; Entscheide laufen über den Inhaber; keine Segment-DB','AKV 100 %, Delegations-Pilot in drei Bereichen, Cockpit mit Segment-DB, Rollenwahl und VSOP-Opting-in',2),
((select id from c),'person','Inhaber bleibt CEO und übernimmt das Präsidium – mit geregelter Doppelrolle','Starkes Konzentrationsrisiko; Rückzug aus operativen Doppelfunktionen noch ohne Zeitachse','Zeithorizont des Rückzugs aus Kundenbeziehungen, Freigaben, Projektleitungen festlegen (Input-Liste 4.2); Delegationsquote messen',1);

-- Risiken (Vorgehensplan Kap. 7)
with o as (select email, id from profiles)
insert into risks (title, early_indicators, countermeasures, owner_id, level, dimension) values
('Eigentümer kann nicht loslassen; Delegation bleibt formal','Entscheide werden weiterhin am PMO/GL vorbei getroffen','Externes Coaching für EI; verbindliche Delegationsmatrix; VR mahnt aktiv ein',(select id from o where email='moser.stefan79@gmail.com'),'hoch','person'),
('Schlüsselpersonen springen während der Übergangsphase ab','Erhöhte Fluktuation, Unzufriedenheit in Gesprächen','Frühzeitige offene Kommunikation, Retention-Massnahmen, Übergangsmodell mit virtueller Beteiligung',(select id from o where email='markus.balsiger@emmenpark.ch'),'mittel','team'),
('Kulturbruch durch zu schnelle Formalisierung','Mitarbeitende empfinden neue Prozesse als bürokratisch','Werte explizit als Leitplanke nutzen, Roll-out partizipativ gestalten, Tempo dosieren',(select id from o where email='tom.burkhalter@emmenpark.ch'),'mittel','fundament'),
('Beteiligungsprogramm scheitert an Bewertung oder Steuerthemen','Verzögerungen bei EXT, fehlendes Ruling','Frühzeitig Steuer-Ruling einholen, Plan B (virtuelle Beteiligung) parallel vorbereiten',(select id from o where email='moser.stefan79@gmail.com'),'mittel','team'),
('Wirtschaftlicher Einbruch verschiebt Prioritäten','Druck auf Marge, Investitionsstopp – 2025: Personalkosten +3.5 PP, Gewinn halbiert','Liquiditätsplanung, Szenarien, Roadmap rollend anpassen, Kernmassnahmen priorisieren',(select id from o where email='moser.stefan79@gmail.com'),'hoch','fundament'),
('Gewaltenteilung bei Personalunion VRP/CEO/Eigentümer zu schwach','Traktanden/Entscheide werden am VR vorbei vorbereitet; Ausstandsregeln nicht gelebt','Sitzungsleitung bei SM, CEO-Beurteilung durch nicht-exekutive Mitglieder, 12-Monats-Review der Governance',(select id from o where email='moser.stefan79@gmail.com'),'mittel','verwaltungsrat');

-- Cockpit: Erfolgsrechnung Jan–Okt 2025 vs. 2024
insert into kpi_snapshots (period, revenue, gross_profit_1, personnel_cost, ebitda, ebit, net_profit, note) values
('2024-10',7550035,5200246,3023156,834006,496506,405993,'Januar–Oktober 2024'),
('2025-10',7527089,5120993,3281493,504419,224419,202674,'Januar–Oktober 2025 · Gewinn inkl. Abgrenzungen CHF 266''978 · Warenkosten 32.0 %, Personal 43.6 %');

-- VSOP
insert into vsop_scenarios (name, multiple, sort) values ('Low',3.5,1),('Base',4.5,2),('High',5.5,3);
with o as (select email, id from profiles)
insert into vsop_participants (profile_id, quota_pct, profilstufe, note)
select id, 2, 'offen', 'Rollenwahl im Aufbaujahr 2027' from o where email in (
 'christian.scheuermeyer@emmenpark.ch','andreas.moser@emmenpark.ch','michelle.vonfluee@emmenpark.ch',
 'damaris.strebel@emmenpark.ch','lina.walter@emmenpark.ch','christian.selau@emmenpark.ch','stefan.raetz@emmenpark.ch');

-- GL-AKV (Rohlinge aus AKV-Dokument)
with o as (select email, id from profiles)
insert into gl_akv (profile_id, role_title, aufgaben, verantwortung, stellvertreter_id, vertritt_id, profilstufe, status) values
((select id from o where email='christian.scheuermeyer@emmenpark.ch'),'Finanzen / Stv. Geschäftsführer','Cockpit, Segment-DB, Liquiditätsplanung, Bankkontakte im Tagesgeschäft','Finanzreporting (Pilotbereich Delegation), CEO-Stellvertretung',(select id from o where email='markus.balsiger@emmenpark.ch'),(select id from o where email='markus.balsiger@emmenpark.ch'),'offen','entwurf'),
((select id from o where email='andreas.moser@emmenpark.ch'),'Leitung Catering','Wachstumstreiber Catering, Übernahme Schlüsselkunden vom Inhaber','Ergebnisverantwortung Catering',(select id from o where email='stefan.raetz@emmenpark.ch'),null,'offen','entwurf'),
((select id from o where email='michelle.vonfluee@emmenpark.ch'),'Leitung Events','Verkauf, Planung, Durchführung Events; Mitarbeitergotti','Ergebnisverantwortung Events (Federführung zu klären)',(select id from o where email='damaris.strebel@emmenpark.ch'),null,'offen','entwurf'),
((select id from o where email='damaris.strebel@emmenpark.ch'),'Leitung Events','Verkauf, Planung, Durchführung Events','Ergebnisverantwortung Events',(select id from o where email='lina.walter@emmenpark.ch'),null,'offen','entwurf'),
((select id from o where email='lina.walter@emmenpark.ch'),'Leitung Events','Verkauf, Planung, Durchführung Events; Mitarbeitergotti','Ergebnisverantwortung Events',(select id from o where email='michelle.vonfluee@emmenpark.ch'),null,'offen','entwurf'),
((select id from o where email='christian.selau@emmenpark.ch'),'Leitung 1881 Kantine','Standort-Ergebnisverantwortung Gastronomie','Standort 1881',null,null,'offen','entwurf'),
((select id from o where email='stefan.raetz@emmenpark.ch'),'Leitung Küche','Produktion über alle Segmente, Wareneinsatz, Qualität','Produktion; Stv. Catering produktionsseitig',null,(select id from o where email='andreas.moser@emmenpark.ch'),'offen','entwurf');

with o as (select email, id from profiles)
insert into delegation_mandates (profile_id, bereich, ziel, status, start_date) values
((select id from o where email='andreas.moser@emmenpark.ch'),'Catering-Leitung','Schlüsselkunden eigenständig führen; Angebote bis CHF [Limite] ohne Inhaber freigeben','entwurf','2027-04-01'),
((select id from o where email='michelle.vonfluee@emmenpark.ch'),'Projektleitung Events','Events von Verkauf bis Abrechnung ohne Inhaber-Freigabe durchführen','entwurf','2027-04-01'),
((select id from o where email='christian.scheuermeyer@emmenpark.ch'),'Finanzreporting','Monatliches Cockpit inkl. Segment-DB eigenständig an den VR liefern','entwurf','2027-04-01');
