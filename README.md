# Team Chat App — Frontend

## Overview
This folder contains the Vite + React + TypeScript SPA styled with Tailwind CSS. `main.tsx` mounts the `<App />` tree, `App.tsx` wires `AuthProvider`, `SocketProvider`, and route definitions, while the Tailwind/PostCSS config files ensure styles are compiled correctly.

## Architecture
- **Context**:
  - `AuthContext.tsx` manages user/auth token state, persists values in `localStorage`, exposes `login`, `signup`, `refresh`, and `logout`, and automatically refreshes the access token when necessary.
  - `SocketContext.tsx` watches `accessToken`; when present it builds a Socket.IO client via `services/socket.ts`.
- **Hooks**: Lightweight helpers (`useAuth.ts`, `useSocket.ts`, `useRefreshToken.ts`) expose the above contexts.
- **Services**:
  - `api.ts` creates an Axios client whose base URL derives from `VITE_API_*` vars, logs chosen env values for debugging, and attaches the bearer token from storage on every request.
  - `socket.ts` determines the backend URL (stripping `/api` from `VITE_API_BASE_URL` if needed) and creates authenticated Socket.IO instances.
- **Routing & Pages**:
  - `App.tsx` defines routes for `/login`, `/signup`, and `/chat`. The `ProtectedRoute` component guards `/chat` and redirects unauthenticated users.
  - `components/auth/` holds the login/signup forms with inline error states, submission loading indicators, and navigation to the chat workspace after success.
  - `components/chat/` drives the workspace UI: `ChatWindow.tsx` orchestrates channel/message data, handles CRUD actions, and wires socket listeners; `ChannelList`, `MessageList`, `MessageInput`, and `OnlineUsers` each render pieces of the experience with Tailwind styling.

## Styling
- Tailwind is wired via `tailwind.config.js` (watching `./src/**/*.{js,jsx,ts,tsx,html}` and `./public/index.html`) and PostCSS (via `postcss.config.js`) applies Tailwind and Autoprefixer.
- Global styles are injected by `src/index.css`, which imports `@tailwind base`, `components`, and `utilities`.

## Running
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Build for production: `npm run build`
4. Preview the production build: `npm run preview` (host=Render preview defaults from `vite.config.ts`).

## Environment
- The frontend respects `VITE_API_BASE_URL`, `VITE_API_SERVER`, and `VITE_API_PORT` when constructing API/socket URLs. Fallbacks default to `http://localhost:5002`.
- Axios requests automatically add `Authorization: Bearer <accessToken>` for authenticated routes.
