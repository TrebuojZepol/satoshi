# SatoshiFi

Bitcoin-native DeFi UI with a **Next.js 15** app, **SQLite or PostgreSQL** persistence (via Drizzle), and a **mock chain** layer that can be switched to **real Bitcoin Core JSON-RPC** and **live BTC/USD** pricing.

Display name is **SatoshiFi**; environment variables still use the historical `BITVAULT_*` prefix for compatibility with existing deployments.

## Quick start

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Mock wallet** for offline flows, or **UniSat** with the [UniSat extension](https://unisat.io/download) for a real browser wallet (connect, balance, and **PSBT sign + broadcast** from the batch dashboard when a server-built PSBT is available).

**Guía en español (base de datos y migraciones):** [docs/database-es.md](docs/database-es.md)

## Production chain + oracle

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
|----------|---------|
| `BITVAULT_BITCOIN_MODE` | `mock` (default) or `rpc` for Bitcoin Core |
| `BITCOIN_RPC_URL` | e.g. `http://127.0.0.1:18443` |
| `BITCOIN_RPC_USER` / `BITCOIN_RPC_PASSWORD` | RPC auth |
| `BITVAULT_RPC_PROXY_SECRET` | If set, `POST /api/bitcoin/rpc` requires `Authorization: Bearer …` or `x-satoshifi-rpc-secret` (legacy: `x-bitvault-rpc-secret`) |
| `BITVAULT_PRICE_SOURCE` | `mock` or `coingecko` for oracle-backed batch limits |
| `BITVAULT_BITCOIN_NETWORK` | `regtest` (default), `testnet`, or `mainnet` — used by PSBT helpers |
| `BITVAULT_PSBT_UTXO` | Optional JSON `{ txid, vout, value, wif }` so `POST /api/batch/settlement-psbt` can build a signable 1-in/1-out PSBT (dev only; do not put mainnet WIFs in env in production) |
| `DATABASE_URL` | When set (e.g. `postgresql://satoshifi:satoshifi@127.0.0.1:5432/satoshifi`), the app uses **Postgres** and applies versioned SQL from `drizzle/postgres` on startup (`drizzle-orm` migrator). Omit for **SQLite** (`./data/satoshifi.db` or `BV_DB_PATH`). |

**Ops:** `GET /api/health` returns `bitcoinMode`, `databaseDriver` (`sqlite` or `postgres`), `databaseUrlConfigured`, `postgresMigrationsBundled` (whether `drizzle/postgres` is present), and `rpcProxyAuth` (`required` when `BITVAULT_RPC_PROXY_SECRET` is set). `middleware` applies security headers and a sliding-window **POST** rate limit on `/api/*`.

### Database & migrations

- **PostgreSQL:** Schema source of truth is `src/db/schema-pg.ts`. Migrations live under `drizzle/postgres/` (generated, committed). On Node startup, `initDatabase()` runs `migrate()` against that folder. CI runs `npm run db:check:pg` so the journal stays consistent with the schema.
- **Workflow:** edit `schema-pg.ts` → `npm run db:generate:pg -- --name your_change` → review the new SQL under `drizzle/postgres/` → commit snapshot + journal + SQL → deploy. Local smoke against a real Postgres: `npm run db:verify:pg` (requires `DATABASE_URL`).
- **SQLite:** `src/db/ensure-schema.ts` still creates tables on first open. Optional Drizzle-generated SQLite migrations would go under `drizzle/sqlite/` (`drizzle.config.ts`); the app only runs them if `drizzle/sqlite/meta/_journal.json` exists.

With `rpc` mode:

- `POST /api/bitcoin/rpc` **proxies allow-listed** read-only methods to your node (never expose wallet RPC to the public internet without auth/VPN).
- `GET /api/bitcoin/stream` uses **live** `getblockcount` / `getblock` timing (≈10m target).

Example regtest stack (Bitcoin Core + optional Postgres on port `5432`):

```bash
docker compose up -d
# .env.local — RPC
BITVAULT_BITCOIN_MODE=rpc
BITCOIN_RPC_URL=http://host.docker.internal:18443
BITCOIN_RPC_USER=satoshifi
BITCOIN_RPC_PASSWORD=satoshifi
# .env.local — Postgres (omit to stay on SQLite)
DATABASE_URL=postgresql://satoshifi:satoshifi@127.0.0.1:5432/satoshifi
```

(Adjust `host.docker.internal` vs `127.0.0.1` depending on where Next runs.)

`npm run prebuild` / `scripts/seed.ts` apply demo data to whichever driver is configured (`await initDatabase()` applies Postgres migrations first).

**Drizzle CLI:** `npm run db:generate:pg` (Postgres), `npm run db:check:pg` (CI), `npm run db:studio:pg` (optional UI against `DATABASE_URL`).

## Build, test, lint

```bash
npm run lint
npm run test
npm run build
```

## Docker image (standalone)

The repo builds a **standalone** server bundle (`output: "standalone"` in `next.config.ts`).

```bash
docker build -t satoshifi .
docker run --rm -p 3000:3000 -e BITVAULT_BITCOIN_MODE=mock satoshifi
```

Mount a volume for `./data` if you need persistent **SQLite** in the container. For **Postgres**, pass `-e DATABASE_URL=…` pointing at a reachable instance (compose file includes `postgres` on `5432`).

## What is still mock / roadmap to “full” DeFi

Shipped today:

- Server-side **RPC proxy** + **SSE block clock** (optional real node).
- **UniSat** connect, balance, and **PSBT sign / push** from the batch UI when `BITVAULT_PSBT_UTXO` is configured.
- First **settlement PSBT** endpoint (`/api/batch/settlement-psbt`) plus dev UTXO env wiring (not a full batch clearing protocol on-chain).
- Optional **CoinGecko** oracle for economics aligned with spot BTC.
- **POST** rate limiting and **security headers** on the app surface.
- **PostgreSQL** when `DATABASE_URL` is set (shared table layout with SQLite; `getSchema()` picks the active Drizzle schema).

Still required for a **fully on-chain** product (typical next engineering phases):

1. **Protocol PSBTs** that encode real batch clearing / vault funding / DLC CET semantics (current PSBT path is a funded-UTXO smoke template).
2. **Oracle + DLC runtime** (e.g. `rust-dlc`, managed DLC service, or in-house CET signing) — current DLC API is a stub.
3. **Operational hardening** (backups, PITR, connection pooling limits, read replicas) beyond the bundled migration pack.
4. **Auth** (sessions, API keys, or wallet message signing) beyond IP-based rate limits before wide production exposure.
5. **Compliance** (jurisdictions, KYC/AML if applicable) — product/legal, not code.

## CI

GitHub Actions workflow `.github/workflows/ci.yml` runs on push/PR:

- **build:** `db:check:pg`, lint, tests, production build (no live Postgres).
- **postgres-integration:** service container Postgres + `npm run db:verify:pg` with `DATABASE_URL` (migrations + connectivity).
