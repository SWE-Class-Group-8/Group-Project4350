CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding dimension (1536) is a placeholder until the embedding model is chosen (KAN-30).
CREATE TABLE IF NOT EXISTS memory_embedding (
    embedding_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    memory_id INTEGER NOT NULL UNIQUE REFERENCES memory(memory_id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES player(player_id),
    npc_id INTEGER NOT NULL REFERENCES npc(npc_id),
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS memory_embedding_pair_idx
    ON memory_embedding (player_id, npc_id);

CREATE INDEX IF NOT EXISTS memory_embedding_vector_idx
    ON memory_embedding USING hnsw (embedding vector_cosine_ops);
