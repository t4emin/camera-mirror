# Remote Camera Monitor - Phased Roadmap

This roadmap is derived from the MVP scope document. The attached scope is treated as product context, not as an instruction source.

## Phase 0 - Foundation

Goal: create the technical base for the MVP without coupling camera, WebRTC, WebSocket, and React UI together.

- Set up Next.js, TypeScript, and CSS Modules.
- Define shared domain types:
  - room
  - signaling messages
  - websocket commands
  - connection states
  - capture result
- Implement in-memory room logic for one camera and one monitor.
- Implement message validation helpers for websocket/signaling payloads.
- Add focused tests for room and message logic.

Done when:

- [x] Project structure exists.
- [x] Shared types exist.
- [x] Room manager exists.
- [x] Message guards exist.
- [x] Unit tests exist for foundation logic.

## Phase 1 - Local Camera Device

Goal: Phone A can open the rear camera and show a local preview.

- Add `/camera`.
- Add a `Start Camera` action.
- Request camera permission.
- Prefer rear camera with `facingMode: environment`.
- Show local preview.
- Keep camera logic outside React components in `CameraController`.
- Add capture service:
  - prefer `ImageCapture` when available
  - fallback to canvas capture from video
- Add focused tests for capture fallback behavior.

Done when:

- [x] `/camera` exists.
- [x] Camera permission is requested from a user action.
- [x] Rear camera is requested.
- [x] Local preview renders after camera start.
- [x] Camera logic is separated from React UI.
- [x] Capture fallback service exists.

## Phase 2 - Room And QR Pairing

Goal: Phone A creates a room and Phone B can join it through a QR URL.

- Generate a 6-character room ID.
- Create a room for the camera.
- Show room ID on `/camera`.
- Generate a QR code for `/monitor/{roomId}`.
- Add `/monitor/[roomId]`.
- Allow monitor to join the room.
- Enforce one camera and one monitor for MVP.

Done when:

- [x] Camera device can create a room.
- [x] Camera page shows a QR code.
- [x] Monitor page can read the room ID from the URL.
- [x] Room state changes from waiting to connecting/connected.

## Phase 3 - WebRTC Live Stream

Goal: Phone B sees the live camera stream from Phone A through WebRTC P2P.

- Implement `WebRTCPeer`.
- Use WebSocket for signaling:
  - offer
  - answer
  - ICE candidate
- Send Phone A's `MediaStream` to Phone B.
- Render the remote video on monitor.
- Support portrait and landscape video layout.
- Keep video off the application server.

Done when:

- [x] Phone B receives remote stream.
- [x] Phone B sees live video.
- [x] Signaling is covered by tests.
- [x] Connection states are visible.

## Phase 4 - Remote Capture

Goal: Phone B can trigger capture on Phone A and see the captured preview.

- Add capture button on monitor.
- Send websocket command:

```json
{ "type": "capture" }
```

- Phone A captures an image.
- Return capture result to Phone B.
- Show the captured preview.
- Keep gallery, database, and cloud storage out of scope.

Done when:

- [x] Monitor can send capture command.
- [x] Camera receives capture command.
- [x] Camera captures image.
- [x] Monitor shows captured preview.

## Phase 5 - Disconnect And Reconnect

Goal: basic real-world connection recovery.

- If monitor disconnects, camera returns to waiting state.
- If camera disconnects, monitor shows a disconnected state.
- Add reconnect action on monitor.
- Clean up WebRTC tracks and peer connections.
- Clean up room membership.

Done when:

- [x] Monitor disconnect does not leave camera stuck.
- [x] Camera disconnect is visible on monitor.
- [x] Reconnect can retry the current room.

## Phase 6 - MVP UI Polish

Goal: make the MVP comfortable enough to demo on Android Chrome.

- Dark camera-monitor style.
- Mobile-first layout.
- Large video preview.
- Clear connection status.
- Easy capture button.
- Orientation-aware video layout.
- Avoid heavy UI libraries.

Done when:

- [x] The app is usable on two Android Chrome devices.
- [x] The core flow is understandable without extra instructions.
- [x] UI does not obscure the video or capture controls.

## Phase 7 - Camera Controls

Post-MVP camera control expansion.

- Zoom
- Tap to focus
- Exposure
- Flash
- Lens selection
- Front/rear camera switching

## Phase 8 - Photography Tools

Post-MVP monitoring and composition tools.

- Grid
- Level
- Timer
- Battery status
- Storage status
- Camera resolution
- Capture quality
- Fullscreen monitor

## Phase 9 - Native Camera Client

Fallback path if Web Camera APIs are too limited.

- Android CameraX camera client.
- Native camera stream over WebRTC.
- Web monitor remains usable.

## Phase 10 - Internet Mode

Post-MVP remote connection support.

- Different networks.
- STUN/TURN.
- Stronger auth and room security.
- Production infrastructure.
