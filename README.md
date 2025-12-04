# Team Chat App — Frontend

## Overview
This folder contains the Vite + React + TypeScript single-page app styled with Tailwind CSS. `main.tsx` mounts the `<App />` tree, `App.tsx` wires `AuthProvider`, `SocketProvider`, and React Router, while the Tailwind/PostCSS config files ensure styles are compiled correctly.

## Tech stack
- Vite 7 + TypeScript for the build tool and compiler.
- React 19 + React Router DOM 7 for UI and routing.
- Tailwind CSS + autoprefixer for utility-first styling.
- Axios for REST API calls and `socket.io-client` for mirroring backend realtime events.
- ESLint + `@eslint/js` + TypeScript tooling for developer comfort.

## Architecture
- **Context**:
  - `AuthContext.tsx` manages user/auth token state, persists values in `localStorage`, exposes `login`, `signup`, `refresh`, `logout`, and auto-refreshes the access token when a refresh token exists.
  - `SocketContext.tsx` watches `accessToken` and instantiates an authenticated Socket.IO client via `services/socket.ts` for realtime events.
- **Hooks**: `useAuth.ts`, `useSocket.ts`, and `useRefreshToken.ts` expose the contexts to components without repeating boilerplate.
- **Services**:
  - `api.ts` builds an Axios instance whose base URL derives from `VITE_API_*` vars, logs those env values (handy for debugging), and attaches the bearer token to every request.
  - `socket.ts` resolves the backend URL (dropping `/api` from `VITE_API_BASE_URL` when necessary) and creates Socket.IO clients that send the access token in `auth`.
- **Routing & UI**:
  - `App.tsx` defines `/login`, `/signup`, and `/chat`, wrapping the protected route with `ProtectedRoute.tsx`.
  - `components/auth/` contains the login/signup forms, each handling validation, error display, and redirecting to `/chat` once authenticated.
  - `components/chat/` orchestrates the workspace: `ChatWindow.tsx` manages channels/messages via the API, handles channel actions, and wires socket handlers; `ChannelList`, `MessageList`, `MessageInput`, and `OnlineUsers` render the channel panel, message feed, input, and presence list, respectively.

## Styling
- Tailwind configuration (`tailwind.config.js`) scans `./src/**/*.{js,jsx,ts,tsx,html}` plus `./public/index.html` and is wired through `postcss.config.js` for PostCSS.
- Global styles are injected in `src/index.css` via `@tailwind base`, `components`, and `utilities`.

## Setup and run instructions
1. Install dependencies: `npm install`.
2. Start the dev server: `npm run dev`.
3. Build for production: `npm run build`.
4. Preview the production build: `npm run preview` (the preview server reads `preview.host` and `preview.port` from `vite.config.ts` to match Render’s expectations).
5. Ensure a backend API is reachable via `VITE_API_BASE_URL`, `VITE_API_SERVER`, or `VITE_API_PORT`.

## Assumptions or limitations
- The frontend assumes the backend exposes `/api/auth`, `/api/channels`, `/api/messages` on the same domain or via CORS, and that JWT access tokens are valid and refreshed via `/auth/refresh`.
- Message history relies on the backend’s cursor-based pagination; no local caching beyond the current session is implemented.
- Socket events (`message:new/updated/deleted`) are processed live; there is no offline queueing or reconnection replay logic apart from Socket.IO’s default behavior.
- Styling assumes Tailwind classes are applied consistently (no custom CSS modules).

## Optional features implemented
- Axios logging within `services/api.ts` that prints the resolved environment variables and final base URL.
- Cursor-aware message fetching that allows the backend to paginate older chat history.
- Inline edit/delete menus inside `components/chat/MessageList.tsx`, with per-user accent colors and safe handling of focus/mouse events.
- Presence UI via `components/chat/OnlineUsers.tsx`, showing online/offline indicators based on backend `isOnline` flags.
- Socket-driven channel join/leave events to keep rooms in sync across tabs.

## Environment
- Variables `VITE_API_BASE_URL`, `VITE_API_SERVER`, and `VITE_API_PORT` are used to reach the backend; if they are not set, the app defaults to `http://localhost:5002`.
- Axios automatically attaches `Authorization: Bearer <accessToken>` from `localStorage`, and the socket connection sends the token within `auth`.
