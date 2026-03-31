import { useState } from 'react';

export default function Login({ onLogin, error: authError, loading }) {
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      await onLogin(password);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>📒 个人记账本</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
          {(authError || localError) && (
            <div className="error-message">{authError || localError}</div>
          )}
        </form>
      </div>
    </div>
  );
}