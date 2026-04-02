import { useState } from 'react';

export default function Login({ onLogin, onRegister, error, loading }) {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (isRegister && password !== confirmPassword) {
            setLocalError('两次输入的密码不一致');
            return;
        }
        try {
            if (isRegister) {
                await onRegister(username, password);
            } else {
                await onLogin(username, password);
            }
        } catch (err) {
            setLocalError(err.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>{isRegister ? '注册' : '登录'} 个人记账本</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="用户名"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <input
                        type="password"
                        placeholder="密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                    {isRegister && (
                        <input
                            type="password"
                            placeholder="确认密码"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    )}
                    <button type="submit" disabled={loading}>
                        {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
                    </button>
                    {(error || localError) && <div className="error">{error || localError}</div>}
                </form>
                <button className="switch-btn" onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
                </button>
            </div>
        </div>
    );
}