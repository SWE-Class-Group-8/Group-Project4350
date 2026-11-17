# Sprint report (DRAFT)

Team 8: Joshoua Hossain, Sweeya Ghanta, Arturo Hernandez, Jomari Ingol.
Sprint dates: TODO (team).

## Goals

- Establish the project foundation: team contract, requirements, wireframes, test scenarios, pitch.
- Deliver a playable browser client with movement and NPC dialogue.
- Define the database schema and the API contract so client and backend can be built in parallel.

## Completed

Sprint board (Done): movement tests, team contract, project description/requirements, wireframes and test scenarios, pitch.

From git history on `main`:

- Team contract, functional requirements and project description/use-case diagram (`6ae683a`, `1d4e899`, `fd4bd17`).
- Initial `player`/`npc` tables, then `memory`, `player_fact`, relationship tables and sprint 2 SQL tests (`3bb3aab`, `d37e699`, `cb6150b`, `37f5e5f`, `7e53ae6`).
- Bounded player movement with tests, PR #2 (`40d3f6c`).
- Backend memory validation and LLM fallback tests (`035dc68`).
- Engineering setup: CI, PR template, pgvector migration, gitignore, README (`5cfe64d`, merged via `d1005db`, `f56a06c`).
- Game client with menu, auth, world, NPC dialogue and memory panel against a mock backend, PR #3 (`7ba2109`, `09231b4`).
- API contract (`97c9794`, `docs/api.md`).

## In progress

- Game world with NPC sprites (KAN-3)
- Pixel art (KAN-5)
- Main menu (KAN-1)
- PostgreSQL tables merge (KAN-21)
- Backend server: TODO (team) owner and branch status.

## To do (not started)

- Embedding model research (KAN-30)
- Quests / forgot-password scope (KAN-31)
- Order mechanic (KAN-32)
- README (KAN-33): this PR drafts it; TODO (team) update the ticket.

## Blockers and risks

- **Backend not on `main`.** The client only runs against a localStorage mock, so cross-device persistence and real LLM behavior are unproven. Owner: TODO.
- **Embedding model undecided (KAN-30).** The schema's `vector(1536)` is a placeholder; changing the dimension later needs a migration and re-embedding.
- **Scope decisions pending:** quests, forgot-password (KAN-31) and the order mechanic (KAN-32) may not fit the timeline.
- **LLM latency and cost:** target is under about 5 seconds per reply with a fallback provider; unmeasured.
- **Schema merge (KAN-21)** must settle before backend queries are finalized.
- API keys must stay in `.env`, never committed.

## Next sprint plan (proposal, TODO team to confirm)

1. Finish KAN-1, KAN-3, KAN-5 and merge KAN-21.
2. Choose the embedding model (KAN-30) and update the migration.
3. Merge a backend implementing `docs/api.md` (auth, talk, memories) with DeepSeek + Gemini fallback.
4. Switch the client from `src/api.js` mock to the real API.
5. Implement the automated tests in [test-plan.md](test-plan.md) and run the 13 scenarios end to end, including cross-device.
6. Decide scope for KAN-31 and KAN-32.

## Metrics

TODO (team): story points, velocity, burndown, meeting notes.
