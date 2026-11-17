-- Idempotent NPC seed. Run after migrations.
INSERT INTO npc (name, role, personality, description, slug) VALUES
 ('Chef Mario', 'Chef', 'Warm, passionate and a little dramatic about food. Loves talking recipes and remembers regulars fondly.', 'Head chef of the restaurant.', 'chef_mario'),
 ('Cashier Bruce', 'Cashier', 'Laid-back, dry-witted and efficient. Notices details about customers and likes small talk.', 'Runs the register.', 'cashier_bruce'),
 ('Customer Matthew P', 'Customer', 'Curious, chatty and easily excited. A regular diner who enjoys swapping stories.', 'A regular customer.', 'customer_matthew')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, role = EXCLUDED.role, personality = EXCLUDED.personality, description = EXCLUDED.description;
