# Remote Camera Monitor

MVP web app for using one phone as a camera and another phone as a remote monitor/controller. It supports a TV-style pairing code flow and can be deployed on Vercel.

## Run

Install dependencies:

```sh
npm install
```

Run HTTP for desktop/local development:

```sh
npm run dev
```

For mobile camera testing over LAN, generate a local certificate and run HTTPS:

```sh
npm run cert
npm run dev:https
```

Open the camera device at:

```text
https://YOUR_LAN_IP:3000/camera
```

Then scan the QR code from the monitor phone, or open `/monitor` and type the pair code.

## Deploy On Vercel

Push the repository to GitHub, then import it in Vercel.

Vercel will build with:

```sh
npm run build
```

The WebSocket endpoint is:

```text
/api/ws
```

Important: Vercel WebSockets are currently function-backed. This MVP keeps room state in memory, so it works best for small demos where both devices land on the same function instance. For production reliability across scaled instances, add a shared realtime store/pubsub such as Upstash Redis.

## MVP Flow

1. Phone A opens `/camera`.
2. Tap `Start Camera`.
3. Phone A creates a 6-digit pair code and shows a QR code.
4. Phone B opens `/monitor`, enters the pair code, or scans the QR code.
5. Phone A confirms the monitor request with `Accept`.
6. Phone B receives the live WebRTC stream.
7. Phone B taps `Capture`.
8. Phone A captures an image and Phone B sees the preview.

## Notes

- Camera access requires a secure context on real mobile browsers.
- The included certificate is local development only.
- The app supports one camera and one monitor per room.
- Room state is in memory and resets when the server/function restarts.
- Video is sent over WebRTC P2P, not through the app server.
