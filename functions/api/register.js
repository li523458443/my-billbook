import * as jose from 'jose';

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const { username, password } = await request.json();
    if (!username || !password) {
        return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), { status: 400 });
    }
    if (password.length < 6) {
        return new Response(JSON.stringify({ error: '密码长度至少6位' }), { status: 400 });
    }

    // 检查用户名是否已存在
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) {
        return new Response(JSON.stringify({ error: '用户名已存在' }), { status: 409 });
    }

    // 使用 PBKDF2 哈希密码（兼容 Workers 环境，无需额外依赖）
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