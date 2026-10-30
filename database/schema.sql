-- Player table
-- Stores information about registered players in the game
CREATE TABLE IF NOT EXISTS player (
    player_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- NPC table
-- Stores information about each NPC in the game

CREATE TABLE IF NOT EXISTS npc (
    npc_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(100) NOT NULL,
    personality TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- MEMORY table
-- Stores conversations and interactions between players and NPCs

CREATE TABLE IF NOT EXISTS memory (
    memory_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    player_id INTEGER NOT NULL,
    npc_id INTEGER NOT NULL,
    
    player_message TEXT NOT NULL,
    npc_response TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (player_id) REFERENCES player(player_id),
    FOREIGN KEY (npc_id) REFERENCES npc(npc_id)
);


-- PLAYER_FACT table
-- Stores facts an NPC knows about a player

CREATE TABLE IF NOT EXISTS player_fact (
    fact_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    player_id INTEGER NOT NULL,
    npc_id INTEGER NOT NULL,
    
    fact_key VARCHAR(100) NOT NULL,
    fact_value TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (player_id) REFERENCES player(player_id),
    FOREIGN KEY (npc_id) REFERENCES npc(npc_id)
);


-- NPC_RELATIONSHIP table
-- Stores relationship information between NPCs and players

CREATE TABLE IF NOT EXISTS npc_relationship (
    relationship_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    player_id INTEGER NOT NULL,
    npc_id INTEGER NOT NULL,
    
    relationship_score INTEGER NOT NULL DEFAULT 0
        CHECK (relationship_score BETWEEN -100 AND 100),

    relationship_status VARCHAR(50) NOT NULL DEFAULT 'Neutral',

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (player_id) REFERENCES player(player_id),
    FOREIGN KEY (npc_id) REFERENCES npc(npc_id),

    UNIQUE (player_id, npc_id)
);
