# LetsChat 2.0

Professional multi-party video conferencing built with **React**, **Vite**, **Mantine**, and **Agora RTC**.

Create a meeting, share the link, and join with up to 10 participants. Includes **live chat**, **click-to-pin** spotlight layout for 3+ users, and **light/dark theme**.

## Features

- Up to **10 participants** per room (2 minimum)
- **Shareable meeting links** with encoded room settings
- **Identity modes**: anonymous or required display name
- **Join policies**: start muted/unmuted, video optional or required
- **Live in-call chat** via Agora RTM
- **Adaptive UI**:
  - 1–2 people: FaceTime-style full-screen + PiP
  - 3+ people: Google Meet-style main stage + filmstrip; **click a tile to pin** them to the big screen
- **Light / dark theme** toggle (Mantine, persisted automatically)
- Fully responsive (mobile, tablet, desktop)

## Quick start

```bash
npm install
cp .env.example .env   # add your Agora App ID
npm run dev
```

Open `http://localhost:5173`.

### Environment

```env
VITE_AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_primary_certificate
```

- **App ID** — from Agora Console → your project → copy App ID
- **Primary Certificate** — same page, under Security → Primary Certificate (click copy)

`AGORA_APP_CERTIFICATE` stays on the server only (no `VITE_` prefix) — it is never sent to the browser.

### How tokens work

During `yarn dev`, a local API at `/api/agora/token` generates RTC and RTM tokens using your certificate. The client fetches a token automatically before joining a call.

Restart the dev server after updating `.env`.

## Usage

1. Open the home page and create a meeting.
2. Configure name, capacity (2–10), identity, and audio/video rules.
3. Copy the generated link and share it.
4. In a call, use the **chat** button to open the message drawer.
5. With 3+ participants, **click a filmstrip tile** to pin them to the main stage.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Architecture

- **React + Vite + TypeScript + Mantine UI**
- **Agora RTC** (`agora-rtc-sdk-ng`) for audio/video
- **Agora RTM** (`agora-rtm-sdk`) for display names + live chat
- **Room config** via URL today; ready for a future MongoDB API

## Legacy version

The original vanilla WebRTC proof-of-concept (2-user limit) is in [`legacy/`](legacy/).

## License

MIT
