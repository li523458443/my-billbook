import { useState } from 'react';

export default function Login({ onLogin, onRegister, error, loading }) {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isRegister) {
            if (password !== confirmPassword) {
                alert('两次输入的密码不一致');
                return;
            }
            await onRegister(username, password);
        } else {
            await onLogin(username, password);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>{isRegister ? '注册' : '登录'} 📒 个人记账本</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="用户名"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {isRegister && (
                        <input
                            type="password"
                            placeholder="确认密码"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    )}
                    <button type="submit" disabled={loading}>
                        {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
                    </button>
                </form>
                <button onClick={() => setIsRegister(!isRegister)} style={{ marginTop: '10px' }}>
                    {isRegister ? '返回登录' : '没有账号？立即注册'}
                </button>
                {error && <div className="error">{error}</div>}
            </div>
        </div>
    );
}