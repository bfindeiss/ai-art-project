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
