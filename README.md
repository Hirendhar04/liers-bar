# Liar’s Lounge

A browser-based, private-room bluffing game for 2–4 friends. It uses original procedural 3D lounge art and a custom 20-card playing-card deck, card dealing and table animations, and a server-authoritative rules engine. This is fictional social play only; there are no purchases, cash wagers, or real-world weapon instructions.

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

- Rooms hold two to four seats. Two or more connected players must all ready up to deal. The 20-card deck has six Kings, six Queens, six Aces, and two Jokers; every player starts with five cards.
- The table card is King, Queen, or Ace. On a turn, play one to three cards face down and claim they match that rank. Jokers are wild.
- Any other player may call “LIAR” on the latest claim. If any card is neither the table rank nor a Joker, the claimant takes the penalty; otherwise the challenger does. The current player can also accept the claim.
- The fictional penalty uses one live chamber among six. The server secretly chooses the live chamber and a random trigger, giving a **1/6 (16.7%)** chance of elimination and a **5/6 (83.3%)** chance to survive. Each player has one life; the last player standing wins.
- These odds apply to each independent penalty. Animation never decides the result. Clients receive only the target and timing until the server resolves and broadcasts the outcome. Clients cannot choose or reroll a chamber; duplicate challenges and resolutions are rejected.
- An idle active turn advances after 60 seconds. Disconnecting the active player advances play immediately; reconnecting with that tab’s saved token restores the same seat. An empty room is cleared after five minutes.

## House-rule variants guide

The website’s Rules button explains Basic Deck, Devil, Chaos, and Dice rules. Basic Deck is playable. Devil, Chaos, and Dice remain reference rules and are not selectable modes.

### Basic Liar’s Deck

- Use 20 cards: six Kings, six Queens, six Aces, and two Jokers. Deal five cards per player and choose King, Queen, or Ace as the table card.
- On a turn, play one to three cards face down and claim they match the table card. Jokers are wild.
- Any other player may call “LIAR” on the latest claim. If any card is neither the table rank nor a Joker, the claimant takes the fictional penalty; otherwise the challenger does.
- A live chamber eliminates that player; a harmless result lets them stay. Continue until one player remains.

### Devil Mode

Add a Devil card that must be played alone. If it is challenged and revealed, every other non-eliminated player takes the penalty simultaneously.

### Chaos Mode

Use 12 cards: five Kings, five Queens, one Master, and one Chaos. Deal three cards per player. A Master allows its player to choose who takes the penalty; a Chaos card makes everyone take it.

### Liar’s Dice

Each player starts with five hidden dice. Players bid on how many dice of a face value appear across all cups; every new bid must be higher. Challenge the previous bid to reveal the cups. If the bid was too high, the bidder loses a life; otherwise the challenger does. Losing two lives eliminates a player.

The six-chamber penalty is fictional game mechanics only; no real-world weapon is involved.

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
