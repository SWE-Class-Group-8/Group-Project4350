(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory;
    } else {
        root.createMockApi = factory;
    }
})(typeof self !== 'undefined' ? self : this, function createMockApi(storage) {
    const KEY = 'agent-appetite-mock-db';
    const load = () => JSON.parse(storage.getItem(KEY) || '{"players":{},"facts":{},"history":{}}');
    const save = (db) => storage.setItem(KEY, JSON.stringify(db));
    const NAMES = { chef_mario: 'Chef Mario', cashier_bruce: 'Cashier Bruce', customer_matthew: 'Customer Matthew' };
    const pair = (player, npcId) => `${player}::${npcId}`;

    async function register(username, password) {
        const name = (username || '').trim();
        if (!name || !password) throw new Error('Username and password are required.');
        const db = load();
        if (db.players[name]) throw new Error('That username is already taken.');
        db.players[name] = { password };
        save(db);
        return { username: name };
    }

    async function login(username, password) {
        const name = (username || '').trim();
        const db = load();
        if (!db.players[name] || db.players[name].password !== password) {
            throw new Error('Incorrect username or password.');
        }
        return { username: name };
    }

    async function talk(username, npcId, message) {
        const db = load();
        const key = pair(username, npcId);
        const facts = db.facts[key] || {};
        const text = message.trim();
        const nameMatch = text.match(/my name is ([\w ]+)/i);
        const hobbyMatch = text.match(/(?:favorite hobby is|i (?:love|like|enjoy)) ([\w ]+)/i);
        if (nameMatch) facts.name = nameMatch[1].trim();
        if (hobbyMatch) facts.hobby = hobbyMatch[1].trim();

        let reply;
        if (/what.*(favorite )?hobby/i.test(text)) {
            reply = facts.hobby ? `You told me you like ${facts.hobby}.` : "You haven't told me your hobby yet.";
        } else if (nameMatch) {
            reply = `Nice to meet you, ${facts.name}!`;
        } else if (hobbyMatch) {
            reply = `${facts.hobby}? Sounds fun.`;
        } else {
            reply = facts.name ? `Hello again, ${facts.name}.` : 'Welcome in! What brings you here?';
        }

        db.facts[key] = facts;
        (db.history[key] = db.history[key] || []).push({ player: text, npc: reply });
        save(db);
        return { reply, emotion: 'neutral', provider: 'mock' };
    }

    async function memories(username) {
        const db = load();
        const prefix = `${username}::`;
        return Object.keys(db.facts)
            .filter((k) => k.startsWith(prefix))
            .map((k) => {
                const npcId = k.slice(prefix.length);
                return { npcId, npcName: NAMES[npcId] || npcId, facts: db.facts[k], relationship: { score: 0, status: 'Neutral' } };
            });
    }

    function logout() {}

    return { register, login, talk, memories, logout };
});
