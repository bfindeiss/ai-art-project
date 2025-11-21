# Ausstellungstauglichkeit für "Digital by Nature" (Kunsthalle München)

## Bezug zur Ausstellungsbeschreibung
Die Schau versammelt rund 120 Werke aus allen Schaffensphasen von Miguel Chevalier und betont:
- Generative Installationen, die kontinuierlich neue Bilder erzeugen und auf Besucherbewegungen reagieren.
- Einsatz von KI, 3D-Druck und Robotik, aber zugleich starke sinnliche, physische Präsenz im Raum.
- Partizipative Komponenten wie **In Vitro Pixel Flowers**, bei denen Besucher:innen online und vor Ort Inhalte beisteuern.
- Verknüpfung mit naturhistorischen Objekten, um einen emotionalen, mehrschichtigen Erlebnisraum zu schaffen.

## Abgleich mit aktuellem System
- **Immersion & Projektion:** Das bestehende Setup unterstützt Vierwand-/equirektangulare Projektion und Edge-Blending, passend für großformatige Rauminstallationen.
- **Generative Visuals:** Module wie `NeuralFlow`, `SynapseParticles`, `AIGridMorph` liefern fortlaufend neue Bildwelten und können den "fortlaufend neue Bilder"-Anspruch erfüllen.
- **Interaktion:** Audio- und Webcam-gesteuerte Parameter ermöglichen Bewegungs-/Klang-Resonanz wie in Chevaliers interaktiven Arbeiten. Ein klarer Publikumsindikator für aktive Sensorik fehlt jedoch.
- **Narrativer Layer:** Es gibt keinen kuratierten Kontext (Texte, Kapitel, Naturbezüge) analog zu den naturhistorischen Objekten der Schau.
- **Partizipative Motive:** Besucher:innen können aktuell keine eigenen Inhalte (z.B. Pixelblumen, Zeichnungen) beisteuern; es existiert kein Upload-/Generierungsprozess.
- **Vermittlung & Autonomie:** Ohne Playlist-/Szenensystem ist eine unbeaufsichtigte, dramaturgisch geführte Präsentation erschwert.

## Lücken und Risiken
1. **Fehlender Content-Upload & Generierung:** Keine Schnittstelle für Besucherbeiträge (Blumen/Objekte) oder KI-generierte Naturmotive.
2. **Mangel an kuratierten Szenen:** Keine fest definierte Abfolge mit thematischen Texten, die Bezug auf Natur, KI und Kunstgeschichte nimmt.
3. **Privacy- & Opt-in-Kommunikation:** Keine explizite Einwilligung/Indikator für Kamera- oder Mikrofonnutzung, wichtig in musealem Kontext.
4. **Onboarding & Moderation:** Keine dezenten On-Screen-Guides für Besuchende oder Aufsichtspersonal ohne Tastatur.
5. **Daten-/Asset-Integration:** Fehlende naturhistorische Assets (Kristalle, Unterwasseraufnahmen) für inhaltliche Rahmung.

## Konkrete Anpassungsvorschläge
1. **Szenen-Playlist mit Vermittlungstext**
   - JSON-Playlist (z.B. `config/playlist.json`) mit Reihenfolge, Dauer, Übergängen und kurzen Kapiteln (DE/EN). Renderbar als dezenter Textlayer am unteren Bildschirmrand.
2. **Visitor-Contribution-Modul**
   - Einfaches Upload-Interface (z.B. REST-Endpoint + Dropzone) für PNG/SVG-Motive oder generierte "Pixel Flowers". Assets landen in `/assets/visitor/` und werden zyklisch in einem neuen Visual (`BloomGarden`) verteilt.
3. **Naturmotiv-Bibliothek**
   - Kuratierter Satz an Texturen/Shapes (Kristalle, Plankton, Unterwasserwesen) als Layer für bestehende Visuals; Parametersteuerung über Playlist.
4. **Privacy & Sensor-Status-Overlay**
   - Opt-in-Dialog beim Start, klare Statusanzeige (Mic/Camera aktiv). Fallback-Mode mit voraufgezeichnetem Audio/Noise, falls Sensorsperre.
5. **Operator-/Aufsichtspanel**
   - Minimaler Web-Controller (OSC/Websocket oder Touch-UI) für Modulwechsel, Lautstärke, Sensitivität, Start/Pause der Playlist.
6. **Autoplay & Crossfade**
   - Automatische Szenenwechsel mit weichen Übergängen (Opacity/Farb-LFO) und optionalem Ambient-Sound-Fade pro Szene.

## Fazit
Das System deckt die immersive, generative Basis und Bewegungsresonanz ab, benötigt aber Visitor-Content-Flows, kuratierte Szenen, Vermittlungstexte und Privacy-Onboarding, um den partizipativen, naturbezogenen Anspruch der Ausstellung vollständig zu erfüllen.
