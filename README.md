# Agent Appetite

SOFTWARE ENGINEERING-CTW (4350) group project, Team 8.

A browser-based, small open-world restaurant game where AI NPCs remember each player across sessions and devices and react with emotion. The restaurant is only the setting where players and NPCs meet.

## Current status

| Area | State |
| --- | --- |
| Browser client (`src/`) | Playable against a **mock backend** (browser `localStorage`): menu, register/login, world, NPC dialogue, memory panel. Pixel art, portraits and UI from the asset pack are wired in. |
| Backend server | **Not on `main` yet.** In progress on separate branches. The contract it must follow is [docs/api.md](docs/api.md). |
| Database (`database/`) | Schema and a pgvector migration are on `main`. Merging the table definitions is in progress (KAN-21). |
| LLM integration | **Planned**: DeepSeek primary, Gemini fallback. |
| Embedding model | **Undecided** (KAN-30). The `vector(1536)` dimension is a placeholder. |

See [docs/architecture.md](docs/architecture.md), [docs/test-plan.md](docs/test-plan.md) and [docs/sprint-report.md](docs/sprint-report.md).

## Architecture (summary)

- **Browser client** (`src/`): HTML5/JS game and login. Talks to the API through `src/api.js` (currently the mock).
- **Backend server** (planned): auth, memory retrieval and prompt building.
- **Database**: PostgreSQL with pgvector. Tables hold players, NPCs, memories, per-player facts, relationship scores and embeddings, always keyed by player + NPC pair.
- **LLM APIs** (planned): DeepSeek as primary, Gemini as automatic fallback.

Details and diagram: [docs/architecture.md](docs/architecture.md).

## Setup

Prerequisites: Node.js 22+, PostgreSQL 16 with the [pgvector](https://github.com/pgvector/pgvector) extension. Playing the client against the mock needs only a browser.

```
cp .env.example .env
createdb agent_appetite
psql agent_appetite -v ON_ERROR_STOP=1 -f database/schema.sql
for f in database/migrations/*.sql; do psql agent_appetite -v ON_ERROR_STOP=1 -f "$f"; done
```

### Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (default in `.env.example`: `postgres://postgres:postgres@localhost:5432/agent_appetite`) |
| `DEEPSEEK_API_KEY` | Primary LLM (used by the backend once built) |
| `GEMINI_API_KEY` | Fallback LLM (used by the backend once built) |

Never commit `.env`.

## Running the game client

The game loads art from `assets/`, so serve the repo root over HTTP (opening the file directly will not work):

```
python3 -m http.server 8000        # then open http://localhost:8000/src/main.html?mock=1
```

The game plays against the in-browser mock by default (accounts and memories live in your browser only); add `?api=1` to use a backend on `localhost:3000`. With the backend running (`npm start`, which also serves `/src` and `/assets`), open `http://localhost:3000/src/main.html` instead. Move with W/A/S/D, press E near an NPC to talk, M for the memory panel. Art credits and the asset pack layout are in `assets/PACK_README.txt`.

## Running tests

```
npm test
```

This runs `node --test tests/*.test.js` (movement and world/mock-API tests). Database and backend tests are planned; see [docs/test-plan.md](docs/test-plan.md).

## Project structure

```
.
├── src/                 Browser client
│   ├── main.html        Entry point (menu, login, game canvas)
│   ├── game.js          Game loop, UI, dialogue, memory panel
│   ├── world.js         World layout, NPC placement, nearest-NPC logic
│   ├── movement.js      Bounded player movement
│   └── api.js           Mock backend (localStorage); to be replaced by real API calls
├── database/
│   ├── schema.sql       player, npc, memory, player_fact, npc_relationship
│   ├── migrations/      001_pgvector_embeddings.sql
│   └── test_*.sql, testInsert.sql, testSELECT.sql   Manual SQL checks
├── docs/                API contract, architecture, test plan, sprint report
├── tests/               Node test runner suites
├── .github/             CI workflow and PR template
├── .env.example
└── *.docx, *.pdf, *.drawio   Requirements, team contract, ERD and use-case diagrams
```

## Contributing

- Branch from `main` (`feature/...`, `fix/...`, `docs/...`), open a pull request using the PR template, and get one teammate review before merging.
- Prefix commits and PR titles with a tag such as `[Feature]`, `[Fix]`, `[Test]`, `[Docs]` or `[Chore]`, and reference the Jira ticket (KAN-xx) where one exists.
- `docs/api.md` is the shared contract. Change it only in a PR that updates every consumer.
- CI (`.github/workflows/ci.yml`) runs the tests, applies the schema to a fresh pgvector Postgres, and rejects AI co-author trailers on pull requests.

## Team

| Member | Role |
| --- | --- |
| Joshoua Hossain | TODO: role |
| Sweeya Ghanta | TODO: role |
| Arturo Hernandez | TODO: role |
| Jomari Ingol | TODO: role |
