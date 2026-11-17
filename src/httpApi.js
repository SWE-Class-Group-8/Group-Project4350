(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory;
    } else {
        root.createHttpApi = factory;
    }
})(typeof self !== 'undefined' ? self : this, function createHttpApi(opts) {
    const baseUrl = ((opts && opts.baseUrl) || '').replace(/\/+$/, '');
    const doFetch = (opts && opts.fetch) || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    const storage = opts && opts.storage;
    const TOKEN_KEY = 'agent-appetite-token';

    const FRIENDLY = {
        502: 'The NPC is lost for words, try again.',
        401: 'Your session expired. Please log in again.',
        404: 'That character could not be found.'
    };

    async function request(method, path, body, overrides) {
        const headers = { 'Content-Type': 'application/json' };
        const token = storage && storage.getItem(TOKEN_KEY);
        if (token && !(overrides && overrides.noAuth)) headers.Authorization = `Bearer ${token}`;
        let res;
        try {
            res = await doFetch(baseUrl + path, {
                method, headers, body: body === undefined ? undefined : JSON.stringify(body)
            });
        } catch (e) {
            throw new Error('Cannot reach the server.');
        }
        let data = null;
        try { data = await res.json(); } catch (e) { data = null; }
        if (!res.ok) {
            const map = Object.assign({}, FRIENDLY, overrides && overrides.errors);
            const msg = map[res.status] || (data && data.error) || `Request failed (${res.status}).`;
            const err = new Error(msg);
            err.status = res.status;
            throw err;
        }
        return data;
    }

    async function authenticate(path, username, password, errors) {
        const data = await request('POST', path, { username: (username || '').trim(), password }, { noAuth: true, errors });
        if (storage) storage.setItem(TOKEN_KEY, data.token);
        return { username: data.username };
    }

    const register = (username, password) =>
        authenticate('/api/register', username, password, { 409: 'That username is already taken.' });

    const login = (username, password) =>
        authenticate('/api/login', username, password, { 401: 'Incorrect username or password.' });

    async function talk(username, npcId, message) {
        const data = await request('POST', `/api/npcs/${encodeURIComponent(npcId)}/talk`, { message });
        return { reply: data.reply, emotion: data.emotion, provider: data.provider };
    }

    async function memories() {
        const data = await request('GET', '/api/memories');
        return data.memories || [];
    }

    function logout() {
        if (storage) storage.removeItem(TOKEN_KEY);
    }

    return { register, login, talk, memories, logout };
});
