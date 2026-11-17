(function () {
    const { WIDTH, HEIGHT, PLAYER_SIZE, NPCS, BOUNDS, nearestNpc } = World;
    const api = createMockApi(window.localStorage);
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const screens = ['menu', 'auth', 'world', 'settings'];
    const $ = (id) => document.getElementById(id);
    const settings = { volume: 5, textSpeed: 5, fullscreen: false };
    let user = null;
    let position = { x: 300, y: 180 };
    let talkingTo = null;
    let authMode = 'login';

    function show(name) {
        screens.forEach((s) => $(s).classList.toggle('hidden', s !== name));
    }

    function setAuthMode(mode) {
        authMode = mode;
        $('auth-title').textContent = mode === 'login' ? 'Log In' : 'Register';
        $('auth-submit').textContent = mode === 'login' ? 'LOG IN' : 'REGISTER';
        $('auth-toggle').textContent = mode === 'login' ? 'Register new account' : 'Back to log in';
        $('auth-error').textContent = '';
    }

    $('btn-login').onclick = () => { setAuthMode('login'); show('auth'); };
    $('btn-register').onclick = () => { setAuthMode('register'); show('auth'); };
    $('btn-settings').onclick = () => show('settings');
    $('btn-exit').onclick = () => window.close();
    $('auth-toggle').onclick = () => setAuthMode(authMode === 'login' ? 'register' : 'login');
    $('auth-back').onclick = () => show('menu');
    $('settings-back').onclick = () => show('menu');
    $('settings-save').onclick = () => {
        settings.volume = Number($('set-volume').value);
        settings.textSpeed = Number($('set-speed').value);
        settings.fullscreen = $('set-full').checked;
        if (settings.fullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen();
        if (!settings.fullscreen && document.fullscreenElement) document.exitFullscreen();
        show('menu');
    };

    $('auth-form').onsubmit = (e) => {
        e.preventDefault();
        try {
            const fn = authMode === 'login' ? api.login : api.register;
            user = fn($('username').value, $('password').value);
            $('hud-user').textContent = user.username;
            show('world');
            draw();
        } catch (err) {
            $('auth-error').textContent = err.message;
        }
    };

    $('btn-logout').onclick = () => { user = null; closeDialogue(); show('menu'); };

    function openDialogue(npc) {
        talkingTo = npc;
        $('dialogue-name').textContent = `${npc.name} (${npc.role})`;
        $('dialogue-log').innerHTML = '';
        addLine(npc.name, 'Hi there. What can I get you?');
        $('dialogue').classList.remove('hidden');
        $('dialogue-input').focus();
    }

    function closeDialogue() {
        talkingTo = null;
        $('dialogue').classList.add('hidden');
    }

    function addLine(who, text) {
        const p = document.createElement('p');
        p.textContent = `${who}: ${text}`;
        $('dialogue-log').appendChild(p);
        $('dialogue-log').scrollTop = $('dialogue-log').scrollHeight;
    }

    $('dialogue-form').onsubmit = async (e) => {
        e.preventDefault();
        const input = $('dialogue-input');
        const text = input.value.trim();
        if (!text || !talkingTo) return;
        input.value = '';
        addLine(user.username, text);
        const reply = await api.talk(user.username, talkingTo.id, text);
        addLine(talkingTo.name, reply);
    };
    $('dialogue-goodbye').onclick = closeDialogue;

    function toggleMemory() {
        const panel = $('memory');
        panel.classList.toggle('hidden');
        if (panel.classList.contains('hidden')) return;
        const list = $('memory-list');
        list.innerHTML = '';
        const mems = api.memories(user.username);
        if (!mems.length) list.textContent = 'No memories yet. Go talk to someone.';
        mems.forEach((m) => {
            const npc = NPCS.find((n) => n.id === m.npcId);
            const li = document.createElement('p');
            const facts = Object.entries(m.facts).map(([k, v]) => `${k}: ${v}`).join(', ');
            li.textContent = `${npc ? npc.name : m.npcId} - ${facts || 'nothing yet'}`;
            list.appendChild(li);
        });
    }

    document.addEventListener('keydown', (e) => {
        if ($('world').classList.contains('hidden') || !user) return;
        if (e.target.tagName === 'INPUT') {
            if (e.key === 'Escape') closeDialogue();
            return;
        }
        const key = e.key.toLowerCase();
        if (key === 'e') {
            const npc = nearestNpc(position);
            if (npc && !talkingTo) openDialogue(npc);
        } else if (key === 'm') {
            toggleMemory();
        } else if (key === 'escape') {
            closeDialogue();
        } else if (!talkingTo) {
            const moved = moveWithCollision(position, key, BOUNDS);
            Sprites.recordMove(key, moved !== position);
            position = moved;
        }
        draw();
    });

    function draw() {
        Sprites.drawTiles(ctx, Sprites.images, GameMap.TILES, GameMap.TILE);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('KITCHEN', 20, 20);
        ctx.fillText('COUNTER', 560, 20);

        NPCS.forEach((npc) => {
            Sprites.drawCharacter(ctx, Sprites.images, npc.id, npc.x, npc.y, npc.color);
            Sprites.drawEmotion(ctx, npc.x, npc.y - 12, World.getEmotion(npc.id));
            ctx.fillStyle = '#222';
            ctx.fillText(npc.name, npc.x - 16, npc.y - 6);
        });
        const p = Sprites.player;
        Sprites.drawCharacter(ctx, Sprites.images, 'player', position.x, position.y, '#4ecdc4', p.facing, p.steps, p.moving);

        const near = nearestNpc(position);
        $('prompt').classList.toggle('hidden', !near || !!talkingTo);
        if (near) $('prompt').textContent = `Press E to talk to ${near.name}`;
    }

    Sprites.init().then(draw);
    show('menu');
})();
