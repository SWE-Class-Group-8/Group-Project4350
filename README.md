# Agent Appetite

SOFTWARE ENGINEERING-CTW (4350) group project (Team 8): Joshoua Hossain, Sweeya Ghanta, Arturo Hernandez, Jomari Ingol.

A browser-based, small open-world restaurant game where AI NPCs remember each player across sessions and devices and react with emotion. The restaurant is only the setting where players and NPCs meet.

## Architecture

- **Browser client** (`src/`): HTML5/JS game and login.
- **Backend server** (planned): auth, memory retrieval and prompt building.
- **Database** (`database/`): PostgreSQL with pgvector. Tables hold players, NPCs, interactions, per-player facts, relationship scores and embeddings.
- **LLM API** (planned): DeepSeek as primary, Gemini as automatic fallback.

## Setup

Prerequisites: Node.js 22+, PostgreSQL 16 with the [pgvector](https://github.com/pgvector/pgvector) extension.

```
cp .env.example .env
createdb agent_appetite
psql agent_appetite -v ON_ERROR_STOP=1 -f database/schema.sql
for f in database/migrations/*.sql; do psql agent_appetite -v ON_ERROR_STOP=1 -f "$f"; done
```

Fill in `DEEPSEEK_API_KEY` and `GEMINI_API_KEY` in `.env`. Never commit `.env`.

## Running the game client

Open `src/main.html` in a modern desktop browser and move with W/A/S/D.

## Running tests

```
npm test
```

## Contributing

- Branch from `main` (`feature/...`, `fix/...`), open a pull request, and get one teammate review before merging.
- Prefix commits and PR titles with a tag such as `[Feature]`, `[Fix]`, `[Test]` or `[Docs]`, and reference the Jira ticket (KAN-xx).
- CI (`.github/workflows/ci.yml`) runs the tests, applies the database schema to a fresh pgvector Postgres, and rejects AI co-author trailers on pull requests.
