const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem('bill_auth', password);
      setIsLoggedIn(true);
    } else {
      setError(data.error || '密码错误');
    }
  } catch (err) {
    setError('网络错误');
  }
};