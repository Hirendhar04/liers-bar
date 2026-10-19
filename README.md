# Liar’s Lounge

A browser-based, private-room bluffing game for 2–5 friends. It uses original procedural 3D lounge art, actual 52-card playing cards, card dealing and table animations, and a server-authoritative rules engine. This is fictional social play only; there are no purchases, cash wagers, or real-world weapon instructions.

## Run locally

Requirements: Node.js 20 or newer and pnpm (or npm).

```sh
pnpm install
pnpm dev
```

In a second terminal in this folder, start the frontend:

```sh
pnpm dev:web
```

Open the Vite URL (usually `http://localhost:5173`) in two or more browser windows. The frontend proxies Socket.IO to the Node server on port 3000. Create a room, share its five-letter code, ready up, and play. For production, run `pnpm build`, set `NODE_ENV=production`, then run `pnpm start`. `PORT` defaults to `3000`; `HOST` defaults to `127.0.0.1` locally and `0.0.0.0` in production. Set either variable to override those values.

## Rules

- Rooms hold up to five seats. Two or more connected players must all ready up to deal a standard 52-card deck. Each player starts with three lives.
- The active player lays one to three cards face down and claims the current table suit. Other players see the claim, not the card faces. The next player may accept it or call “Call bluff.”
- On a challenge, the server checks the actual suits. If every card matched the declared suit, the challenger is penalized; if any card did not, the player who made the claim is penalized.
- A penalty has six equally likely chambers, exactly one live. The server privately selects the live chamber and a separate uniformly random trigger. Matching values costs one life: **1/6 (16.7%)**. A harmless click occurs **5/6 (83.3%)**. At zero lives a player is eliminated; the last survivor wins.
- These odds apply to each independent penalty. Animation never decides the result. Clients receive only the target and timing until the server resolves and broadcasts the outcome. Clients cannot choose or reroll a chamber; duplicate challenges and resolutions are rejected.
- An idle active turn advances after 60 seconds. Disconnecting the active player advances play immediately; reconnecting with that tab’s saved token restores the same seat. An empty room is cleared after five minutes.

## Project checks

```sh
pnpm test
pnpm typecheck
pnpm build
```

Automated tests cover readiness/dealing, private hands, turn and card validation, challenge secrecy, one-time penalty resolution, and room capacity.

## Online deployment

Deploy the Node process to a host that supports persistent WebSocket connections (for example, Render, Fly.io, or Railway). Build with `pnpm install --frozen-lockfile && pnpm build`, then run with `NODE_ENV=production pnpm start`; the same process serves the frontend and Socket.IO on the platform `PORT`. No external database, account, paid asset, or API key is needed for one server instance. Rooms are in memory and disappear on restart, so use a shared room store and Socket.IO adapter before adding multiple instances. Enable HTTPS at the host or reverse proxy before sharing publicly.

The local app is multiplayer-ready, but publishing it publicly requires a hosting account and deployment credentials. No service has been configured or deployed from this workspace.
