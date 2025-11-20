# The Thinking Room

Immersive 360°-Projektionsvorlage mit sich entwickelnden, KI-inspirierten neuronalen Motiven. Gebaut mit Three.js + Vite für schnellen Einsatz in Multi-Beamer-Domes oder rechteckigen Räumen – egal ob direkt vor der Laptop-Webcam oder riesengroß an der Wand projiziert.

## Features
- Panoramischer Shader-Hintergrund für equirektangulare oder vierwandige Projektionen.
- Fünf modulare Visual-Systeme (`NeuralFlow`, `SynapseParticles`, `AIGridMorph`, `PulseRings`, `AuroraVeil`).
- Direkte Sensorik-Verknüpfung: Mikrofon- und Webcam-Signale beeinflussen Szenenparameter und erscheinen als schemenhafte Overlays (standardmäßig aktiv).
- Konfigurierbare Projektor-Überlappungen, Farbwelten und Performance-Budgets.
- Schlanker Vite-Devserver plus Express-Server für den Produktivbetrieb.

## Projektstruktur
```
├── assets/
├── config/
│   ├── projection.json
│   ├── system.json
│   └── theme.json
├── server/
│   └── index.js
├── src/
│   ├── audio/
│   ├── interactions/
│   ├── shaders/
│   ├── visuals/
│   ├── config.ts
│   ├── thinkingRoomApp.ts
│   └── main.ts
├── index.html
└── package.json
```

## Einstieg
1. Abhängigkeiten installieren
   ```bash
   npm install
   ```
2. Entwicklungsserver starten (inkl. HMR)
   ```bash
   npm run dev
   ```
3. Produktionsbundle bauen und testen
   ```bash
   npm run build
   npm run preview
   ```
4. Optionaler Auslieferungsserver (bedient `dist/` mit Caching)
   ```bash
   npm run build
   npm start
   ```

## Benutzerhandbuch

### Schnellstart aus Anwendersicht
1. **Applikation öffnen** – Starte lokal `npm run dev` oder nutze den bereitgestellten Server. Öffne die angezeigte URL bildschirmfüllend im Browser (idealerweise Vollbild/Kiosk-Modus).
2. **Sensorik bestätigen** – Standardmäßig fragt die App nach Mikrofon- und Webcam-Zugriff. Lehnst du ab, laufen die generativen Defaults weiter, die Overlays bleiben dann dunkel.
3. **Leinwand konfigurieren** – Die Projektion passt sich automatisch an. Nur wenn du von der Auto-Erkennung abweichen willst, passe `config/projection.json` oder nutze die URL-Parameter (siehe unten).
4. **Performance prüfen** – Die App regelt die Render-Auflösung dynamisch. Überwache die FPS im Browser-Devtools-Log (Hinweise erscheinen bei Pausen/Visual-Wechseln).

### Tastaturkommandos
Alle Kommandos funktionieren sofort, solange der Fokus auf dem Browserfenster liegt.

| Taste | Aktion |
| --- | --- |
| `Space` | Spielt/pausiert die Animation. Während der Pause bleibt das aktuell gerenderte Bild stehen – hilfreich für Kalibrierungen oder Projektor-Feinjustage. |
| `V` | Wechselt zum nächsten Visual-Engine-Modul. |
| `Shift` + `V` | Springt zum vorherigen Visual-Modul. |
| `1`, `2`, `3`, … | Direktauswahl der Visual-Module in Reihenfolge. |
| `↑` / `↓` | Erhöht bzw. reduziert die Mikrofon-Sensitivität in 10-%-Schritten. |
| `→` / `←` | Verstärkt bzw. schwächt die Webcam/Motion-Sensitivität. |

Bei jedem Wechsel wird der aktive Modus in der Browserkonsole protokolliert (`[ThinkingRoom] Active visual module: …`). Das ist nützlich, um während eines Auftritts zu prüfen, welches System gerade läuft.

### Visual-Engines und Einsatzszenarien
- **NeuralFlow** – Organische Linienribbons für ruhige Ambient-Passagen. Reagiert subtil auf Audiospitzen.
- **SynapseParticles** – Partikelwolken, die auf Audio- und Bewegungsimpulse anspringen. Ideal für lebhafte Segmente.
- **AIGridMorph** – Geordnete Gitterformen mit morphenden Patterns für technische Stimmungen.
- **PulseRings** – Pulsierende Torus-Ringe, die sich mit Mikrofonpeaks und Motion-Energie ausdehnen.
- **AuroraVeil** – Schleierartige Flächen mit weichen Farbverläufen und feinfühligem Audio/Motion-Feedback.

Wechsle die Engines spontan über die Tastatur oder definiere eine feste Reihenfolge, indem du die Zifferntasten nutzt. Für automatisierte Abläufe kannst du die Sichtbarkeit einzelner Module im Code oder via OSC/Websocket (nicht enthalten) steuern.

### Sensorik im Einsatz
Mikrofon- und Webcam-Streams werden direkt beim Start angefragt. Falls du sie abschalten möchtest (z. B. im Museum ohne Kamera), übergib Flags beim Instanziieren in `src/main.ts`:

```ts
const app = new ThinkingRoomApp(container, {
  enableMicrophone: false,
  enableWebcam: false
});
```

Sobald die Berechtigungen erteilt sind, laufen die Streams permanent durch Analyse-Pipelines. Zusätzlich werden sie nun visuell in Szene gesetzt:

#### Mikrofonsteuerung (Audio-Reaktivität)
1. **Analyser Node** – Ein Web-Audio-Analyser bildet den Frequenzverlauf auf 1024 Bins ab und errechnet daraus einen Mittelwert.
2. **Normalisierung & Gain** – Der Wert wird auf `0–1` skaliert und durch deine aktuelle Sensitivität (↑/↓) multipliziert.
3. **Direkte Visualisierung** – Der Pegel steuert nun ein halbtransparentes Overlay (`SensorImprint`): pulsierende Bänder, Glows und Farbschübe machen laute oder leise Passagen unmittelbar sichtbar.
4. **Visual-Response** – Das Ergebnis fließt je nach Modul zusätzlich in unterschiedliche Parameter:
   - *NeuralFlow*: Ribbons werden bei höherem Pegel transparenter/heller und wirken lebendiger.
   - *SynapseParticles*: Audio verstärkt Drift, Geschwindigkeit und Leuchtkraft der Partikel.
   - *PulseRings*: Ringe dehnen sich stärker aus und glühen intensiver.

#### Webcam-Motion (Bewegungs-Reaktivität)
1. **Frame-Differencing** – Ein unsichtbares Video + Canvas vergleicht jedes Bild mit dem Vorgänger und errechnet so Bewegungsenergie.
2. **Normalisierung & Gain** – Das Motion-Maß wird auf `0–1` abgebildet und über die Pfeiltasten rechts/links feinjustiert.
3. **Direkte Visualisierung** – Das Videobild wird als schemenhafte Schicht über der Szene eingeblendet. Bewegungen erscheinen als farbige Silhouetten, die von Audio-Pulsen verzerrt werden.
4. **Visual-Response** – Die Szene reagiert unmittelbar:
   - *SynapseParticles*: Partikelgröße steigt mit Bewegung, wodurch Interaktionen sichtbar „aufflackern“.
   - *AIGridMorph*: Der Shader erhöht die Gitter-Amplitude, sodass das Feld bei Bewegungen stärker pulsiert.
   - *AuroraVeil*: Schleier wölben sich stärker, wenn sich Menschen vor der Kamera bewegen.

Tipp: Passe während des Auftritts das Verhältnis aus Mikro- und Motion-Sensitivität an, bis die Reaktion zur Raumgröße und Publikumsenergie passt.

### Tipps für Operator:innen
- Halte ein Gamepad oder eine kompakte Tastatur bereit, um die oben genannten Shortcuts auch auf der Bühne schnell auszulösen.
- Nutze den Pause-Modus (`Space`), um Projektoren zu synchronisieren oder Besucher:innen einzelne Frames zu zeigen.
- Dokumentiere dein bevorzugtes Setup (z. B. aktive Module, Farbschemata) in einem eigenen Preset-Script, damit du es später reproduzieren kannst.

### Interaction Toggles & On-Screen-Display
Die On-Screen-Display-Tafel blendet kurze Hinweise ein, wenn du Sensitivitäten änderst. Beide Controller liefern `0` zurück, wenn Hardware oder Berechtigungen fehlen – so bleibt die App lauffähig, auch wenn du Sensorik deaktivierst.

### Projektion & Edge Blending
Der Projektionsmodus wird automatisch gewählt:

- **Laptop / Einzelscreen** – schaltet auf `single` (klassische Perspective-Cam ohne Blending) wenn die Fensterfläche klein ist.
- **Wand / Mehr-Projektor** – schaltet auf `four-wall` wenn das Browserfenster groß genug ist **und** `config/projection.json` mehr als einen Projektor angibt. Dann aktiviert sich das Edge-Blend-Overlay automatisch.

Du kannst den Modus jederzeit über URL-Parameter überschreiben:

- `?projection=single` – erzwingt Laptop-Modus.
- `?projection=four-wall` – erzwingt Mehr-Projektor-Modus inklusive Blend-Overlay.
- `?projection=auto` – stellt die Auto-Erkennung wieder her (Default).

Feinjustiere das Edge-Blending über `config/projection.json` (`projectors`, `overlapPx`, `gamma`). Keystone/Warping erledigst du extern (Hardware oder GPU-Warp-Tools).

## Neue Visual-Module hinzufügen
1. Datei in `src/visuals/MyVisual.ts` anlegen, die das `VisualModule`-Interface implementiert.
2. In `src/visuals/visualManager.ts` registrieren (import + in `modules` einfügen).
3. Uniforms für Audio/Bewegung (optional) via `setAudioLevel` oder `setMotionIntensity` anbinden.
4. Hot Reload rendert das neue System sofort während `npm run dev`.

## Projection- & Blending-Hinweise
- Nutze Kurzdistanz-Projektoren an jeder Wand oder rund um den Dome. Setze `config/projection.json` mit `projectors` und `overlapPx`, um das shaderbasierte Edge-Blending anzupassen.
- Physikalisches Warping/Keystone extern erledigen (Hardware oder GPU). Das enthaltene Overlay sorgt für gamma-korrigiertes Feathering der Überlappungen.
- Für 360°-Domes `mode` auf `"equirect"` stellen und ggf. die Kamera-FOV reduzieren.

## Assets & Audio
Lege Ambient-Stems, Impulse Responses oder Palette-LUTs unter `/assets` ab. `src/audio/ambientController.ts` zeigt, wie Audio-Loops geladen und gefadet werden; triggert sie bei Bedarf aus UI oder via OSC.

## Deployment-Tipps
- Zielhardware: 4 × 1080p-Projektoren oder 1 × 4K-Dome-Feed. Halte `maxParticles` im GPU-Budget (~20–30k Gesamt-Vertices für mittelklassige GPUs).
- Nutze den eingebauten dynamischen Resolution-Scaler, um ≥40 FPS zu halten. Werte in `config/system.json` je nach Venue anpassen.
- Für Kiosk-Setups: `npm run build`, dann `npm start` auf einem lokalen Medienserver. Browser im Fullscreen-/Kiosk-Modus betreiben und die Leinwand über mehrere GPUs spannen.
