# 🎬 SyncRoom — Watch Together. Anywhere.

A modern watch-party platform where users can instantly create rooms, invite friends, watch YouTube videos together, chat, voice chat, screen share, and stream uploaded videos with subtitle support.

## ✨ Features

- **🚪 Instant Rooms** — Create a room with one click, no sign-up required
- **▶️ YouTube Sync** — Watch YouTube videos in perfect sync (<500ms drift)
- **📁 Video Upload** — Upload MP4/WebM/MKV files (up to 3GB) and watch together
- **💬 Live Chat** — Real-time text chat with emoji picker
- **🎤 Voice Chat** — WebRTC peer-to-peer voice with speaking indicators
- **🖥️ Screen Share** — Share your screen for everyone to see
- **📝 Subtitles** — SRT/VTT support with customizable size, background, offset
- **👑 Host Controls** — Host manages playback; auto-transfers on disconnect
- **📱 Mobile Support** — Responsive design with touch-friendly controls
- **🌙 Dark Mode** — Premium dark UI with glassmorphism design
- **📲 PWA** — Installable as a progressive web app

## 🏗️ Architecture

```
┌──────────────────────┐     WebSocket      ┌──────────────────────┐
│    Next.js Client    │◄──────────────────►│  Express + Socket.IO │
│   (Vercel deploy)    │                     │  (Railway/Render)    │
│                      │   WebRTC (P2P)      │                      │
│  React • Zustand     │◄─────────────────►│  Room Manager        │
│  Tailwind • Video.js │                     │  Chat/Media Handlers │
└──────────────────────┘                     └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm 9+

### 1. Clone & Install
```bash
git clone <repo-url> watchparty
cd watchparty
npm install
```

### 2. Configure Environment
```bash
# Server
cp server/.env.example server/.env

# Client  
cp client/.env.local.example client/.env.local
```

### 3. Start Development
```bash
# Start both client and server
npm run dev

# Or start separately
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:3000
```

### 4. Open in Browser
Navigate to `http://localhost:3000`, create a room, and share the link!

## 📁 Project Structure

```
watchparty/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/              # Pages & layouts
│   │   ├── components/       # UI components
│   │   │   ├── ui/           # Button, Input, Modal, Toast, Badge
│   │   │   ├── room/         # MediaPlayer, YouTube, Video, ScreenShare
│   │   │   ├── chat/         # ChatPanel, ChatInput, EmojiPicker
│   │   │   ├── participants/ # ParticipantList, ParticipantItem
│   │   │   ├── voice/        # VoiceControls, SpeakingIndicator
│   │   │   └── layout/       # Sidebar, MobileDrawer
│   │   ├── hooks/            # useSocket, useRoom, useChat, useVoiceChat...
│   │   ├── store/            # Zustand stores
│   │   ├── lib/              # Utilities, socket, webrtc, youtube
│   │   └── types/            # TypeScript definitions
│   └── public/               # Static assets & PWA icons
├── server/                    # Express backend
│   └── src/
│       ├── socket/           # Socket.IO event handlers
│       ├── managers/         # RoomManager, RateLimiter
│       ├── routes/           # Upload, health endpoints
│       ├── storage/          # Local & S3 storage
│       └── middleware/       # CORS, rate limiting, error handling
└── package.json              # Monorepo workspace config
```

## ⚙️ Environment Variables

### Server (`server/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `CLIENT_URL` | `http://localhost:3000` | Frontend URL for CORS |
| `STORAGE_TYPE` | `local` | Storage backend (`local` or `s3`) |
| `UPLOAD_DIR` | `uploads` | Local upload directory |
| `S3_ENDPOINT` | — | S3/R2 endpoint URL |
| `S3_BUCKET` | — | S3/R2 bucket name |
| `S3_ACCESS_KEY` | — | S3/R2 access key |
| `S3_SECRET_KEY` | — | S3/R2 secret key |
| `S3_REGION` | `auto` | S3 region |

### Client (`client/.env.local`)
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | Backend WebSocket URL |
| `NEXT_PUBLIC_TURN_URL` | — | TURN server URL (production) |
| `NEXT_PUBLIC_TURN_USERNAME` | — | TURN credentials |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | — | TURN credentials |

## 🚢 Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import in Vercel
3. Set root directory to `client`
4. Set `NEXT_PUBLIC_SOCKET_URL` to your backend URL
5. Deploy

### Backend → Railway / Render
1. Set root directory to `server`
2. Build command: `npm run build`
3. Start command: `npm run start`
4. Set environment variables (PORT, CLIENT_URL, STORAGE_TYPE, etc.)
5. Deploy

### Production Checklist
- [ ] Set `CLIENT_URL` to your Vercel domain
- [ ] Configure S3/R2 storage for video uploads
- [ ] Add TURN server for reliable WebRTC (recommended: [Metered.ca](https://metered.ca) or self-hosted CoTURN)
- [ ] Enable HTTPS on both frontend and backend

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand, TanStack Query |
| Realtime | Socket.IO |
| Voice/Screen | WebRTC (Mesh) |
| Video | Native HTML5 + YouTube IFrame API |
| Backend | Express, Node.js |
| Storage | Local filesystem / S3-compatible (Cloudflare R2) |

## 📄 License

MIT
