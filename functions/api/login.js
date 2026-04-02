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

    const user = await env.DB.prepare('SELECT id, password_hash FROM users WHERE username = ?').bind(username).first();
    if (!user) {
        return new Response(JSON.stringify({ error: '用户名或密码错误' }), { status: 401 });
    }

    // 验证密码
    const [saltHex, hashHex] = user.password_hash.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const derivedHashArray = Array.from(new Uint8Array(derivedBits));
    const derivedHashHex = derivedHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    if (derivedHashHex !== hashHex) {
        return new Response(JSON.stringify({ error: '用户名或密码错误' }), { status: 401 });
    }

    // 生成 JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new jose.SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    return new Response(JSON.stringify({ success: true, token, userId: user.id }));
}