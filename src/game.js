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
            position = movePlayer(position, key, BOUNDS);
        }
        draw();
    });

    function drawPerson(x, y, color) {
        ctx.fillStyle = '#00000044';
        ctx.fillRect(x + 4, y + PLAYER_SIZE - 4, PLAYER_SIZE - 8, 4);
        ctx.fillStyle = color;
        ctx.fillRect(x + 6, y + 12, PLAYER_SIZE - 12, PLAYER_SIZE - 16);
        ctx.fillStyle = '#ffd7b5';
        ctx.fillRect(x + 8, y, PLAYER_SIZE - 16, 14);
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 11, y + 5, 3, 3);
        ctx.fillRect(x + PLAYER_SIZE - 14, y + 5, 3, 3);
    }

    function draw() {
        ctx.fillStyle = '#c9a87a';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = '#8b5e3c';
        ctx.fillRect(0, 0, WIDTH, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('KITCHEN', 20, 20);
        ctx.fillText('COUNTER', 560, 20);
        ctx.fillStyle = '#a0522d';
        [[240, 260], [440, 200], [120, 220]].forEach(([x, y]) => ctx.fillRect(x, y, 64, 36));

        NPCS.forEach((npc) => {
            drawPerson(npc.x, npc.y, npc.color);
            ctx.fillStyle = '#222';
            ctx.fillText(npc.name, npc.x - 16, npc.y - 6);
        });
        drawPerson(position.x, position.y, '#4ecdc4');

        const near = nearestNpc(position);
        $('prompt').classList.toggle('hidden', !near || !!talkingTo);
        if (near) $('prompt').textContent = `Press E to talk to ${near.name}`;
    }

    show('menu');
})();
