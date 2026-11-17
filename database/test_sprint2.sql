ROLLBACK;
-- Begin a temporary test transaction

BEGIN;

-- Create a sample player

INSERT INTO player (username, password_hash)
VALUES ('sprint2_test_player', 'TEST_ONLY_NOT_A_REAL_HASH');

-- Create a sample NPC

INSERT INTO npc (name, role, personality, description)
VALUES (
    'Sprint2 Tests Eldric',
    'Shopkeeper',
    'Friendly but cautious',
    'Runs a shop in the villiage'
);

-- Store a conversation between the player and NPC

INSERT INTO memory (player_id, npc_id, player_message, npc_response)
SELECT
    p.player_id,
    n.npc_id,
    'Hello! My name is Alex.',
    'Hello Alex! Welcome to my shop.'
FROM player p
CROSS JOIN npc n
WHERE p.username = 'sprint2_test_player'
  AND n.name = 'Sprint2 Tests Eldric';

-- Store a fact about the learned player 
INSERT INTO player_fact (player_id, npc_id, fact_key, fact_value)
SELECT
    p.player_id,
    n.npc_id,
    'player_name',
    'Alex'
FROM player p
CROSS JOIN npc n
WHERE p.username = 'sprint2_test_player'
  AND n.name = 'Sprint2 Tests Eldric';

-- Commit their initial relationship
INSERT INTO npc_relationship (
    player_id, npc_id, relationship_score, relationship_status
)
SELECT
    p.player_id,
    n.npc_id,
    50,
    'Friendly'
FROM player p
CROSS JOIN npc n
WHERE p.username = 'sprint2_test_player'
  AND n.name = 'Sprint2 Tests Eldric';


-- Retrieve a conversation with player and NPC information
SELECT
    p.username,
    n.name AS npc_name,
    m.player_message,
    m.npc_response,
    m.created_at
FROM memory m
JOIN player p ON m.player_id = p.player_id
JOIN npc n ON m.npc_id = n.npc_id
WHERE p.username = 'sprint2_test_player';


SELECT
    p.username,
    n.name AS npc_name,
    f.fact_key,
    f.fact_value,
    r.relationship_score,
    r.relationship_status
FROM player_fact f
JOIN player p ON f.player_id = p.player_id
JOIN npc n ON f.npc_id = n.npc_id
JOIN npc_relationship r
    ON r.player_id = p.player_id
    AND r.npc_id = n.npc_id
WHERE p.username = 'sprint2_test_player';