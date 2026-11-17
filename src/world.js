(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.World = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    const WIDTH = 640;
    const HEIGHT = 400;
    const PLAYER_SIZE = 32;
    const INTERACT_RADIUS = 56;

    const NPCS = [
        { id: 'chef_mario', name: 'Chef Mario', role: 'Chef', color: '#e4572e', x: 90, y: 70 },
        { id: 'cashier_bruce', name: 'Cashier Bruce', role: 'Cashier', color: '#4361ee', x: 520, y: 70 },
        { id: 'customer_matthew', name: 'Customer Matthew P', role: 'Customer', color: '#f2b134', x: 300, y: 290 },
    ];

    const BOUNDS = { minX: 0, maxX: WIDTH - PLAYER_SIZE, minY: 0, maxY: HEIGHT - PLAYER_SIZE };

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function nearestNpc(position, npcs = NPCS, radius = INTERACT_RADIUS) {
        let best = null;
        let bestDistance = Infinity;
        for (const npc of npcs) {
            const d = distance(position, npc);
            if (d <= radius && d < bestDistance) {
                best = npc;
                bestDistance = d;
            }
        }
        return best;
    }

    const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'annoyed'];
    const state = { emotions: {} };

    function getEmotion(npcId, st = state) {
        return st.emotions[npcId] || 'neutral';
    }

    // Call this once the API returns an emotion for an NPC. Unknown values fall back to neutral.
    function setEmotion(npcId, emotion, st = state) {
        st.emotions[npcId] = EMOTIONS.includes(emotion) ? emotion : 'neutral';
        return st.emotions[npcId];
    }

    return { EMOTIONS, state, getEmotion, setEmotion, WIDTH, HEIGHT, PLAYER_SIZE, INTERACT_RADIUS, NPCS, BOUNDS, distance, nearestNpc };
});
