-- database/schema_facts.sql

-- 1. Create the interaction facts table (KAN-13)
CREATE TABLE IF NOT EXISTS interaction_facts (
    id SERIAL PRIMARY KEY,
    player_id INT NOT NULL,
    npc_id INT NOT NULL,
    fact_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed initial NPC data (KAN-14)
INSERT INTO npcs (npc_name, role, base_personality) VALUES 
('Chef Mario', 'Chef', 'Passionate, loud, and takes food very seriously.'),
('Cashier Bruce', 'Cashier', 'Tired, sarcastic, but polite.'),
('Customer Matthew P', 'Customer', 'Picky eater, complains often.')
ON CONFLICT DO NOTHING;
