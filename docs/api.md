# Agent Appetite API contract

All branches code against this file. Change it only through a PR that updates every consumer.

- Base path: `/api`. JSON in and out (`Content-Type: application/json`).
- Auth: `Authorization: Bearer <token>` on every route except register and login.
- Errors: `{ "error": "message" }` with the HTTP status below.
- Usernames: 3-30 chars, `[A-Za-z0-9_]`. Passwords: 8-128 chars, stored only as a hash. Messages: 1-500 chars.

## POST /api/register
Request: `{ "username": "sam", "password": "secret123" }`
- 201 `{ "token": "...", "username": "sam" }`
- 400 invalid input, 409 username taken

## POST /api/login
Request: `{ "username": "sam", "password": "secret123" }`
- 200 `{ "token": "...", "username": "sam" }`
- 401 incorrect username or password (same message for both)

## GET /api/npcs
- 200 `{ "npcs": [ { "id": "chef_mario", "name": "Chef Mario", "role": "Chef" } ] }`

## POST /api/npcs/:id/talk
Request: `{ "message": "My name is Sam" }`
- 200 `{ "reply": "Nice to meet you, Sam!", "emotion": "happy", "provider": "deepseek" }`
- `emotion`: one of `neutral`, `happy`, `sad`, `angry`, `annoyed`.
- `provider`: `deepseek` or `gemini` (the one that produced the reply).
- 400 invalid message, 401 missing or bad token, 404 unknown NPC
- 502 both LLM providers failed (the client shows a retry message)
- Target latency: under about 5 seconds.

## GET /api/memories
Memories belong to the authenticated player only.
- 200 `{ "memories": [ { "npcId": "chef_mario", "npcName": "Chef Mario", "facts": { "name": "Sam", "hobby": "pizza" }, "relationship": { "score": 20, "status": "Friendly" } } ] }`

## NPC ids
`chef_mario`, `cashier_bruce`, `customer_matthew` (the `id` field is the stable string; the database keeps its own integer key and maps it).

## Isolation rules (tested by the scenarios)
- A player never sees another player's facts or conversation.
- An NPC never recalls what was told only to a different NPC.
- Memory persists across sessions and devices (it lives server-side, keyed by account).
