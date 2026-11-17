(function () {
    const { WIDTH, HEIGHT, VIEW_W, VIEW_H, NPCS, BOUNDS, nearestNpc } = World;
    const params = new URLSearchParams(window.location.search);
    const backend = window.API_BASE_URL || (window.location.port === '3000' ? window.location.origin : params.get('api') === '1' ? 'http://localhost:3000' : null);
    const api = params.get('mock') === '1' || !backend
        ? createMockApi(window.localStorage)
        : createHttpApi({ baseUrl: backend, storage: window.localStorage });
    let toastTimer = null;
    function toast(msg) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.add('hidden'), 4000);
    }
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    canvas.width = VIEW_W / 2;
    canvas.height = VIEW_H / 2;
    ctx.imageSmoothingEnabled = false;

    const screens = ['menu', 'auth', 'world', 'settings'];
    const $ = (id) => document.getElementById(id);
    const settings = { volume: 5, textSpeed: 5, fullscreen: false };
    let user = null;
    let position = { x: 450, y: 300 };
    let talkingTo = null;
    const held = new Set();
    const SPEED = 130;
    let travel = 0;
    let last = 0;
    const MOVE_KEYS = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
    let authMode = 'login';

    function show(name) {
        screens.forEach((s) => $(s).classList.toggle('hidden', s !== name));
    }

    function setAuthMode(mode) {
        authMode = mode;
        $('auth-title').textContent = mode === 'login' ? 'LOGIN' : 'REGISTER';
        $('auth-submit').className = `imgbtn ${mode === 'login' ? 'b-login' : 'b-register'}`;
        $('auth-toggle').textContent = mode === 'login' ? 'NO ACCOUNT?' : 'HAVE AN ACCOUNT?';
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

    $('auth-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const fn = authMode === 'login' ? api.login : api.register;
            user = await fn($('username').value, $('password').value);
            $('hud-user').textContent = user.username;
            show('world');
            startLoop();
        } catch (err) {
            $('auth-error').textContent = err.message;
        }
    };

    $('btn-logout').onclick = () => { api.logout(); user = null; closeDialogue(); stopLoop(); show('menu'); };

    function openDialogue(npc) {
        talkingTo = npc;
        $('dialogue-name').textContent = npc.name.toUpperCase();
        setPortrait(npc.id, World.getEmotion(npc.id));
        $('dialogue-log').innerHTML = '';
        addLine(npc.name, 'Hi there. What can I get you?', true);
        $('dialogue').classList.remove('hidden');
        $('dialogue-input').focus();
    }

    function closeDialogue() {
        talkingTo = null;
        $('dialogue').classList.add('hidden');
    }

    function setPortrait(npcId, emotion) {
        $('dialogue-portrait').src = `../assets/portraits/${npcId}/${emotion}.png`;
    }

    function addLine(who, text, isNpc) {
        const p = document.createElement('p');
        if (isNpc) p.className = 'npc';
        p.textContent = `${who}: ${text}`;
        $('dialogue-log').appendChild(p);
        $('dialogue-log').scrollTop = $('dialogue-log').scrollHeight;
    }

    $('dialogue-form').onsubmit = async (e) => {
        e.preventDefault();
        const input = $('dialogue-input');
        const text = input.value.trim();
        if (!text || !talkingTo) return;
        const npc = talkingTo;
        const sayBtn = $('dialogue-say');
        input.value = '';
        addLine(user.username, text);
        sayBtn.disabled = true;
        $('thinking').classList.remove('hidden');
        try {
            const res = await api.talk(user.username, npc.id, text);
            const emotion = World.setEmotion(npc.id, res.emotion);
            setPortrait(npc.id, emotion);
            addLine(npc.name, res.reply, true);
        } catch (err) {
            toast(err.message);
        } finally {
            sayBtn.disabled = false;
            $('thinking').classList.add('hidden');
        }
    };
    $('dialogue-goodbye').onclick = closeDialogue;

    async function toggleMemory() {
        const panel = $('memory');
        panel.classList.toggle('hidden');
        if (panel.classList.contains('hidden')) return;
        const list = $('memory-list');
        list.innerHTML = '';
        let mems;
        try {
            mems = await api.memories(user.username);
        } catch (err) {
            toast(err.message);
            return;
        }
        if (!mems.length) list.textContent = 'No memories yet. Go talk to someone.';
        mems.forEach((m) => {
                        const li = document.createElement('p');
            const facts = Object.entries(m.facts).map(([k, v]) => `${k}: ${v}`).join(', ');
            li.textContent = `${m.npcName || m.npcId} - ${facts || 'nothing yet'}${m.relationship ? ` (${m.relationship.status})` : ''}`;
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
        } else if (MOVE_KEYS[key]) {
            e.preventDefault();
            held.add(key);
        }
    });

    document.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => held.clear());

    function updatePlayer(dt) {
        let dx = 0;
        let dy = 0;
        if (!talkingTo) {
            held.forEach((k) => { dx += MOVE_KEYS[k][0]; dy += MOVE_KEYS[k][1]; });
        }
        const p = Sprites.player;
        if (!dx && !dy) { p.moving = false; return; }
        const len = Math.hypot(dx, dy);
        const before = position;
        position = stepMove(position, (dx / len) * SPEED * dt, (dy / len) * SPEED * dt, BOUNDS);
        const travelled = Math.hypot(position.x - before.x, position.y - before.y);
        p.facing = directionFromVector(dx, dy, p.facing);
        p.moving = travelled > 0;
        if (p.moving) { travel += travelled; p.steps = Math.floor(travel / 14); }
    }

    let raf = null;

    function facingPlayer(npc) {
        const dx = position.x - npc.x;
        const dy = position.y - npc.y;
        if (Math.hypot(dx, dy) > 110) return 'down';
        return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }

    function draw(now) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(0.5, 0.5);
        const camX = Math.round(Math.min(Math.max(position.x + 16 - VIEW_W / 2, 0), WIDTH - VIEW_W));
        const camY = Math.round(Math.min(Math.max(position.y + 16 - VIEW_H / 2, 0), HEIGHT - VIEW_H));
        ctx.translate(-camX, -camY);
        Scene.drawBackground(ctx, Sprites.images);

        const near = nearestNpc(position);
        const blink = Math.floor(now / 350) % 2;
        const talkFrame = Math.floor(now / 160) % 2;
        const chars = NPCS.map((npc) => ({
            y: npc.y,
            draw: () => {
                const talking = talkingTo && talkingTo.id === npc.id;
                Sprites.drawCharacter(ctx, Sprites.images, npc.id, npc.x, npc.y, { talkFrame: talking ? talkFrame : undefined, direction: facingPlayer(npc) });
                Sprites.drawEmotion(ctx, Sprites.images, npc.x, npc.y, World.getEmotion(npc.id));
                if (near && near.id === npc.id && !talkingTo) {
                    const key = `world/interaction_highlights/press_e_key_${blink ? 'down' : 'up'}`;
                    Sprites.drawImage(ctx, Sprites.images, key, npc.x, npc.y - 58);
                }
            },
        }));
        const p = Sprites.player;
        chars.push({
            y: position.y,
            draw: () => Sprites.drawCharacter(ctx, Sprites.images, 'player', position.x, position.y, { direction: p.facing, steps: p.steps, moving: p.moving }),
        });
        Scene.drawDepthSorted(ctx, Sprites.images, chars);

        $('prompt').classList.toggle('hidden', !near || !!talkingTo);
        if (near) $('prompt').textContent = `E: TALK TO ${near.name.toUpperCase()}`;
    }

    function frame(now) {
        updatePlayer(Math.min((now - (last || now)) / 1000, 0.05));
        last = now;
        draw(now);
        raf = requestAnimationFrame(frame);
    }
    function startLoop() { if (!raf) raf = requestAnimationFrame(frame); }
    function stopLoop() { cancelAnimationFrame(raf); raf = null; last = 0; held.clear(); }

    function fit() {
        const scale = Math.min(window.innerWidth / 960, window.innerHeight / 610);
        const app = $('app');
        app.style.transform = `scale(${scale})`;
        app.style.top = `${Math.max(0, (window.innerHeight - 610 * scale) / 2)}px`;
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11' || (e.key.toLowerCase() === 'f' && e.target.tagName !== 'INPUT' && !user)) {
            e.preventDefault();
            document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
        }
    });
    window.addEventListener('resize', fit);
    fit();

    Sprites.init();
    show('menu');
})();
