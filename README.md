<p align="center">
  <img src="assets/ui/logo/agent_appetite_logo.png" alt="Agent Appetite" width="420">
</p>

<p align="center">
  <b>a pixel-art restaurant where the NPCs remember you.</b><br>
  <sub>SOFTWARE ENGINEERING-CTW (4350) &middot; Team 8</sub>
</p>

<p align="center">
  <img src="docs/screenshots/menu.png" alt="Agent Appetite main menu" width="720">
</p>

---

## what is agent appetite

Agent Appetite is a small browser game set in a restaurant. You walk around, talk to the staff and the customers, and they talk back with an AI model. What makes it different is memory: every NPC keeps its own memory of you, remembers what you told it, and reacts with emotion to how you treated it.

The restaurant is only the place where players and NPCs meet. The game is about the conversations, not the food orders.

> **you:** my name is Sweeya.
>
> **Chef Mario:** Nice to meet you, Sweeya!
>
> *(next day, new session, different device)*
>
> **you:** hi again.
>
> **Chef Mario:** Hello again, Sweeya.
>
> **you:** your food is terrible.
>
> **Chef Mario:** That was rude. I will remember that.

## see it

<table>
<tr>
<td align="center" width="50%">
<img src="docs/screenshots/login.png" width="100%" alt="Login screen"><br>
<b>login</b><br>
<sub>accounts keep memory with the player, so it follows you across devices.</sub>
</td>
<td align="center" width="50%">
<img src="docs/screenshots/world.png" width="100%" alt="The restaurant"><br>
<b>the restaurant</b><br>
<sub>a scrolling 28x16 tile world. walk with WASD or the arrow keys.</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="docs/screenshots/dialogue2.png" width="100%" alt="Talking to Chef Mario"><br>
<b>talk to anyone</b><br>
<sub>press E near an NPC. their portrait changes with how they feel.</sub>
</td>
<td align="center">
<img src="docs/screenshots/memory.png" width="100%" alt="Memory panel"><br>
<b>what they remember</b><br>
<sub>press M to see the facts each NPC knows about you.</sub>
</td>
</tr>
</table>

## meet the cast

| | |
| --- | --- |
| **Chef Mario** | runs the kitchen. |
| **Cashier Bruce** | works the register. |
| **Customer Matthew P** | eating at table. has opinions. |
| **You** | the new regular. |

Every character has five moods, and the game switches between them based on the AI's reply. The same person can greet you warmly one day and give you the cold shoulder the next.

<p align="center">
  <img src="docs/gallery/emotions.png" alt="Emotion portraits: neutral, happy, sad, angry, annoyed" width="640"><br>
  <sub>neutral &middot; happy &middot; sad &middot; angry &middot; annoyed</sub>
</p>

<p align="center">
  <img src="docs/gallery/characters.png" alt="Character sprites with walk cycles" width="100%"><br>
  <sub>four directions, idle plus a four-frame walk cycle, and a talking pose for the NPCs.</sub>
</p>

## how it works

```mermaid
sequenceDiagram
    autonumber
    actor you
    participant game as browser game
    participant api as backend api
    participant db as postgres + pgvector
    participant llm as deepseek / gemini
    you->>game: walk up to Chef Mario, press E, type a message
    game->>api: POST /api/npcs/chef_mario/talk
    api->>db: facts + relationship for this player and this NPC
    api->>db: vector search for related past conversations
    api->>llm: persona + facts + memories + your message
    llm-->>api: reply + emotion
    api->>db: save the exchange, its embedding, new facts
    api-->>game: reply, emotion, provider
    game-->>you: dialogue box + portrait in the right mood
```

1. **you talk.** the game sends your message with your login token.
2. **the backend remembers.** it loads the facts and mood for this exact player and NPC, and searches past conversations by meaning, not just by exact words.
3. **the model answers in character.** DeepSeek is the first choice. if it fails or is too slow, Gemini takes over without the player noticing.
4. **the game reacts.** the reply comes back with an emotion, which sets the portrait and the icon over the NPC's head.
5. **it all gets saved.** the exchange becomes a fact and a vector embedding, linked to that player and that NPC only.

> Status: the game and the mock backend are playable. The real backend, LLM calls and memory pipeline are being built. See [current status](#current-status).

## architecture

```mermaid
flowchart LR
    subgraph Browser["browser client (src/)"]
        UI["HTML5/JS game<br/>menu · login · world · dialogue"]
    end
    subgraph Backend["backend server"]
        Auth["auth<br/>register · login · token"]
        Mem["memory<br/>facts + vector search"]
        Prompt["prompt builder"]
        LLM["LLM router"]
    end
    subgraph DB["PostgreSQL + pgvector"]
        T1[("player · npc")]
        T2[("memory · player_fact · npc_relationship")]
        T3[("memory_embedding")]
    end
    DS["DeepSeek<br/>primary"]
    GM["Gemini<br/>fallback"]

    UI -- "JSON /api" --> Auth
    UI --> Mem
    Auth --> T1
    Mem --> T2
    Mem --> T3
    Mem --> Prompt --> LLM
    LLM --> DS
    LLM -. "on error or timeout" .-> GM
```

### data model

Every memory row is tied to one player and one NPC. That is what keeps players' memories private from each other and each NPC's memory separate.

```mermaid
erDiagram
    player ||--o{ memory : says
    npc ||--o{ memory : hears
    player ||--o{ player_fact : "is known by"
    npc ||--o{ player_fact : knows
    player ||--o{ npc_relationship : has
    npc ||--o{ npc_relationship : has
    memory ||--o| memory_embedding : "is embedded as"

    player {
        int player_id PK
        text username UK
        text password_hash
    }
    npc {
        int npc_id PK
        text slug UK
        text name UK
        text role
        text personality
    }
    memory {
        int memory_id PK
        int player_id FK
        int npc_id FK
        text player_message
        text npc_response
    }
    player_fact {
        int fact_id PK
        int player_id FK
        int npc_id FK
        text fact_key
        text fact_value
    }
    npc_relationship {
        int relationship_id PK
        int player_id FK
        int npc_id FK
        int relationship_score "-100 to 100"
        text relationship_status
    }
    memory_embedding {
        int embedding_id PK
        int memory_id FK
        vector embedding
    }
```

More detail: [docs/architecture.md](docs/architecture.md) and the API contract in [docs/api.md](docs/api.md).

## the art

All of the art is pixel art from one shared palette: characters, portraits, emotion icons, the restaurant, food and the whole UI. It was made with AI tools and then put together for this project.

<p align="center">
  <img src="docs/gallery/world_props.png" alt="Kitchen, front of house, decor and food props" width="100%"><br>
  <sub>kitchen, front of house, decor and food.</sub>
</p>

The asset pack layout and file names are in [assets/PACK_README.txt](assets/PACK_README.txt). The two pixel fonts (Press Start 2P and VT323) use the SIL Open Font License.

## current status

| Area | State |
| --- | --- |
| Browser game (`src/`) | **Playable.** menu, register and login, a scrolling restaurant, smooth movement, NPC dialogue with portraits and emotions, memory panel. Runs against a mock backend in the browser. |
| Backend server (`server/`) | Auth, NPC list and CORS are done. The talk and memory routes are not built yet. |
| LLM client | DeepSeek first, Gemini fallback, with timeouts. Done and tested with fakes, not yet tried against the real APIs. |
| Database (`database/`) | Schema, NPC seed and a pgvector migration. |
| Memory pipeline | **Planned.** fact extraction, embeddings and vector search. |
| Embedding model | **Undecided** (KAN-30). The `vector(1536)` size is a placeholder. |

See [docs/test-plan.md](docs/test-plan.md) and [docs/sprint-report.md](docs/sprint-report.md).

## run it

The game loads its art from `assets/`, so serve the repo root over HTTP. Opening the file directly will not work.

```
python3 -m http.server 8000
```

Then open <http://localhost:8000/src/main.html>.

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` or arrows | walk |
| `E` | talk to the NPC next to you |
| `M` | what the NPCs remember about you |
| `F11` | full screen |

The game plays against an in-browser mock by default, so accounts and memories live in your browser only. Add `?api=1` to use a backend on `localhost:3000`, or open the game through the backend itself at <http://localhost:3000/src/main.html>.

### the backend

Needs Node.js 22+ and PostgreSQL 16 with the [pgvector](https://github.com/pgvector/pgvector) extension.

```
cp .env.example .env
createdb agent_appetite
psql agent_appetite -v ON_ERROR_STOP=1 -f database/schema.sql
for f in database/migrations/*.sql; do psql agent_appetite -v ON_ERROR_STOP=1 -f "$f"; done
psql agent_appetite -f database/seed_npcs.sql
npm ci && npm start
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | signs login tokens |
| `PORT`, `CORS_ORIGIN` | server port and allowed origin |
| `DEEPSEEK_API_KEY` | primary LLM |
| `GEMINI_API_KEY` | fallback LLM |

Never commit `.env`.

### tests

```
npm test
```

## project structure

```
.
├── src/                 browser game (main.html, game.js, scene.js, sprites.js, world.js, map.js, movement.js, api.js, httpApi.js)
├── server/              express api: auth, npcs, llm client
├── database/            schema.sql, migrations/, seed_npcs.sql
├── assets/              pixel art: characters, portraits, world, ui, fonts
├── docs/                api contract, architecture, test plan, sprint report, screenshots
├── tests/               node test runner suites
├── .github/             CI workflow and PR template
└── *.docx, *.pdf, *.drawio   requirements, team contract, ERD and use-case diagrams
```

## contributing

- Branch from `main` (`feature/...`, `fix/...`, `docs/...`), open a pull request with the template, and get one teammate review before merging.
- Prefix commits and PR titles with `[Feature]`, `[Fix]`, `[Test]`, `[Docs]` or `[Chore]`, and reference the Jira ticket (KAN-xx) where there is one.
- `docs/api.md` is the shared contract. Change it only in a PR that updates every consumer.
- CI runs the tests, applies the schema to a fresh pgvector Postgres, and rejects AI co-author trailers on pull requests.

## team

| Member | Role |
| --- | --- |
| Joshoua Hossain | TODO: role |
| Sweeya Ghanta | TODO: role |
| Arturo Hernandez | TODO: role |
| Jomari Ingol | TODO: role |
