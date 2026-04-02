export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const { username, password } = await request.json();
    if (!username || !password) {
        return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), { status: 400 });
    }

    // 检查用户名是否已存在
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) {
        return new Response(JSON.stringify({ error: '用户名已存在' }), { status: 409 });
    }

    // 使用 Web Crypto API 的 scrypt 派生密钥（实际存储的是 salt+hash，这里简化）
    // 注意：scrypt 是异步的，且需要盐。为了简单，我们使用 bcryptjs 的替代方案？或者使用 pbkdf2。
    // 但 Workers 支持 crypto.subtle.pbkdf2。
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const passwordHash = `${saltHex}:${hashHex}`;

    await env.DB.prepare(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).bind(username, passwordHash).run();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
}