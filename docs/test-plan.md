# Test plan

`npm test` runs `node --test tests/*.test.js`. Current suites: `tests/movement.test.js`, `tests/world.test.js`. The mock-API tests run against `src/api.js`, not a real server. Scenario numbering below is a draft: TODO (team) align numbers and wording with the "test scenarios" deliverable on the sprint board.

Status key: **Mock** = covered against the mock backend only; **Planned** = not written; **Manual** = needs real browsers/devices.

| # | Scenario | Planned automated test | Status |
| --- | --- | --- | --- |
| 1 | Register a new account | Integration: `POST /api/register` returns 201 + token; row in `player` with hashed password | Mock (`world.test.js`); backend Planned |
| 2 | Register with a taken username | `POST /api/register` returns 409 | Mock (duplicate username test); backend Planned |
| 3 | Login with valid credentials | `POST /api/login` returns 200 + token | Mock (`world.test.js`); backend Planned |
| 4 | Login with invalid credentials | 401 with the same message for bad user or bad password | Mock (wrong password test); backend Planned |
| 5 | Talk to an NPC and get an in-character reply | `POST /api/npcs/:id/talk` returns reply, valid emotion, provider; LLM stubbed | Planned |
| 6 | NPC remembers a fact in a later conversation | Tell name, then ask; reply/prompt includes the fact; fact row stored | Mock (memory test); backend Planned |
| 7 | Memory is separate per player | Player A's fact never appears for player B | Mock (separate-memory test); backend Planned |
| 8 | Memory is separate per NPC | Fact told to NPC 1 is not recalled by NPC 2 | Mock (separate-memory test); backend Planned |
| 9 | Memory persists across sessions | Log out/in (new token), facts still returned by `GET /api/memories` | Planned |
| 10 | Memory persists across devices | Two clients with separate storage, same account, see same memories | Planned (cannot be proven by the localStorage mock) |
| 11 | NPC reacts emotionally | Stubbed LLM returns each emotion; client shows it; unknown emotion falls back to `neutral` | Planned |
| 12 | LLM fallback to Gemini | DeepSeek stub fails, Gemini answers, `provider` is `gemini`; both fail gives 502 | Partial (fallback unit test exists on another branch, commit 035dc68); backend Planned |
| 13 | Unauthenticated or invalid requests rejected | Missing/bad token gives 401; invalid message gives 400; unknown NPC gives 404 | Planned |

Also covered today: bounded player movement (`movement.test.js`) and nearest-NPC proximity (`world.test.js`). CI also applies `database/schema.sql` and migrations to a fresh pgvector Postgres.

TODO (team): choose a backend test approach (stubbed LLM and a test Postgres in CI) and add vector-search tests once the embedding model is chosen (KAN-30).
