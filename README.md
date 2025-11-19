# The Thinking Room

Immersive 360° projection template with evolving AI-inspired neural motifs. Built with Three.js + Vite for rapid deployment across multi-projector domes or rectangular rooms.

## Features
- Panoramic shader-driven backdrop for equirectangular or four-wall projection.
- Three modular visual systems (`NeuralFlow`, `SynapseParticles`, `AIGridMorph`).
- Optional microphone + webcam modulation hooks.
- Configurable projector overlaps, color themes, and performance budgets.
- Lightweight Vite dev server plus Express static server for deployment.

## Project structure
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

## Getting started
1. Install dependencies
   ```bash
   npm install
   ```
2. Run the development server (auto reload + HMR)
   ```bash
   npm run dev
   ```
3. Build and preview production bundle
   ```bash
   npm run build
   npm run preview
   ```
4. Optional deployment server (serves `dist/` with caching)
   ```bash
   npm run build
   npm start
   ```

## Benutzerhandbuch

### Schnellstart aus Anwendersicht
1. **Applikation öffnen** – Starte lokal `npm run dev` oder verwende den bereitgestellten Server. Öffne den angezeigten URL ganzflächig im Browser (idealerweise Vollbild/Kiosk-Modus).
2. **Leinwand konfigurieren** – Die Projektion passt sich automatisch der Fenstergröße an. Passe `config/projection.json` nur an, wenn du ein anderes Projektions-Setup verwendest.
3. **Sensorik aktivieren (optional)** – Mikrofon und Webcam sind aus Sicherheitsgründen deaktiviert. Aktiviere sie in `src/main.ts`:
   ```ts
   const app = new ThinkingRoomApp(container, {
     enableMicrophone: true,
     enableWebcam: true
   });
   ```
   Beim nächsten Laden fragt der Browser nach Berechtigungen. Ohne Freigabe läuft die Szene weiterhin mit generativen Standardparametern.
4. **Performance prüfen** – Die App regelt die Render-Auflösung dynamisch. Überwache deine FPS im Browser-Devtools-Log (Hinweis bei Pausen/Visual-Wechseln).

### Tastaturkommandos
Alle Kommandos funktionieren sofort, solange der Fokus auf dem Browserfenster liegt.

| Taste | Aktion |
| --- | --- |
| `Space` | Spielt/pausiert die Animation. Während der Pause bleibt das aktuell gerenderte Bild stehen – hilfreich für Kalibrierungen oder Projektor-Feinjustage. |
| `V` | Wechselt zum nächsten Visual-Engine-Modul. |
| `Shift` + `V` | Springt zum vorherigen Visual-Modul. |
| `1`, `2`, `3` | Direktauswahl von `NeuralFlow`, `SynapseParticles` bzw. `AIGridMorph`. Weitere Module erhalten automatisch die nächste Zahl. |
| `↑` / `↓` | Erhöht bzw. reduziert die Mikrofon-Sensitivität in 10-%-Schritten. Praktisch, wenn du den Einfluss einer lauten Bühne dämpfen oder zarte Signale betonen möchtest. |
| `→` / `←` | Verstärkt bzw. schwächt die Webcam/Motion-Sensitivität. Ideal, um Bewegungen im Raum subtiler oder drastischer umzusetzen. |

Bei jedem Wechsel wird der aktive Modus in der Browserkonsole protokolliert (`[ThinkingRoom] Active visual module: …`). Das ist nützlich, um während eines Auftritts zu prüfen, welches System gerade läuft.

### Visual-Engines und Einsatzszenarien
- **NeuralFlow** – Organische Linienribbons für ruhige Ambient-Passagen. Reagiert subtil auf Audiospitzen.
- **SynapseParticles** – Partikelwolken, die auf Audio- und Bewegungsimpulse anspringen. Ideal für lebhafte Segmente.
- **AIGridMorph** – Geordnete Gitterformen mit morphenden Patterns für technische Stimmungen.

Wechsel die Engines spontan über die Tastatur oder definiere eine feste Reihenfolge, indem du die Tasten `1–3` nutzt. Für automatisierte Abläufe kannst du auch die Sichtbarkeit einzelner Module im Code oder via OSC/Websocket (nicht enthalten) triggern.

### Sensorik im Einsatz
Sobald die Berechtigungen erteilt sind, laufen Mikrofon- und Webcam-Streams permanent durch Analyse-Pipelines:

#### Mikrofonsteuerung (Audio-Reaktivität)
1. **Analyser Node** – Ein Web-Audio-Analyser bildet den Frequenzverlauf auf 1024 Bins ab und errechnet daraus einen Mittelwert.
2. **Normalisierung & Gain** – Der Wert wird auf `0–1` skaliert und durch deine aktuelle Sensitivität (↑/↓) multipliziert.
3. **Visual-Response** – Das Ergebnis fließt je nach Modul in unterschiedliche Parameter:
   - *NeuralFlow*: Ribbons werden bei höherem Pegel transparenter/heller und wirken lebendiger.
   - *SynapseParticles*: Audio verstärkt Drift, Geschwindigkeit und die additive Leuchtkraft der Partikel.

#### Webcam-Motion (Bewegungs-Reaktivität)
1. **Frame-Differencing** – Ein unsichtbares Video + Canvas vergleicht jedes Bild mit dem Vorgänger und errechnet so Bewegungsenergie.
2. **Normalisierung & Gain** – Das Motion-Maß wird ebenfalls auf `0–1` abgebildet und über die Pfeiltasten rechts/links feinjustiert.
3. **Visual-Response** – Die Szene reagiert unmittelbar:
   - *SynapseParticles*: Partikelgröße steigt mit Bewegung, wodurch Interaktionen sichtbar „aufflackern“.
   - *AIGridMorph*: Der Shader erhöht die Gitter-Amplitude, sodass das Feld bei Bewegungen stärker pulsiert.

Tipp: Passe während des Auftritts das Verhältnis aus Mikro- und Motion-Sensitivität an, bis die Reaktion zur Raumgröße und Publikumsenergie passt.

### Tipps für Operator:innen
- Halte ein Gamepad oder eine kompakte Tastatur bereit, um die oben genannten Shortcuts auch auf der Bühne schnell auszulösen.
- Nutze den Pause-Modus (`Space`), um Projektoren zu synchronisieren oder Besucher:innen einzelne Frames zu zeigen.
- Dokumentiere dein bevorzugtes Setup (z.B. aktive Module, Farbschemata) in einem eigenen Preset-Script, damit du es später reproduzieren kannst.

### Interaction toggles
Permissions are disabled by default. Enable them by instantiating the app with flags (edit `src/main.ts`):
```ts
const app = new ThinkingRoomApp(container, {
  enableMicrophone: true,
  enableWebcam: true
});
```
Both controllers degrade gracefully when hardware is unavailable.

## Adding new visual modules
1. Create a file in `src/visuals/MyVisual.ts` implementing the `VisualModule` interface.
2. Register it in `src/visuals/visualManager.ts` (import + push to `modules`).
3. Expose uniforms for audio/motion (optional) via `setAudioLevel` or `setMotionIntensity`.
4. Hot reload will render the new system instantly during `npm run dev`.

## Projection + blending recommendations
- Use short-throw projectors positioned at each wall or around dome. Set `config/projection.json` with `projectors` and `overlapPx` to tune the shader-based edge blend overlay.
- Align physical warping/keystone externally (hardware or GPU). The included overlay applies gamma-correct feathering to overlaps.
- For 360° domes, switch `mode` to `"equirect"` and reduce camera FOV if needed.

## Assets + audio
Drop ambient stems, impulse responses, or palette LUTs into `/assets`. `src/audio/ambientController.ts` demonstrates how to load and fade audio loops; trigger from UI or OSC as needed.

## Deployment tips
- Target 4 × 1080p projectors or 1 × 4K dome feed. Keep `maxParticles` within GPU budget (~20–30k total vertices for mid-range GPUs).
- Use the built-in dynamic resolution scaler to maintain ≥40 FPS. Adjust values inside `config/system.json` per venue hardware.
- For kiosk setups, run `npm run build` then `npm start` on a local media server. Use a browser in full-screen kiosk mode spanning the canvas across GPUs.
