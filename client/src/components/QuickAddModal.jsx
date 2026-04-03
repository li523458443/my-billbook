// client/src/components/QuickAddModal.jsx
import { useState, useRef } from 'react';
import { apiFetch } from '../services/api';

export default function QuickAddModal({ isOpen, onClose, onSuccess, categories }) {
	const [isListening, setIsListening] = useState(false);
	const recognitionRef = useRef(null);

	const startListening = () => {
		if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
			alert('您的浏览器不支持语音输入');
			return;
		}
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		const recognition = new SpeechRecognition();
		recognition.continuous = false;
		recognition.interimResults = false;
		recognition.lang = 'zh-CN';

		recognition.onstart = () => setIsListening(true);
		recognition.onend = () => setIsListening(false);
		recognition.onerror = (event) => {
			console.error('语音识别错误', event.error);
			setIsListening(false);
		};
		recognition.onresult = (event) => {
			const text = event.results[0][0].transcript;
			// 简单解析：期望格式例如 "吃饭 50元" 或 "收入 5000"
			parseVoiceText(text);
		};
		recognition.start();
		recognitionRef.current = recognition;
	};

	const parseVoiceText = (text) => {
		// 简单正则提取数字和类型
		const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
		if (!amountMatch) return;
		const amount = parseFloat(amountMatch[0]);
		let type = 'expense';
		if (text.includes('收入') || text.includes('工资')) type = 'income';
		setFormData(prev => ({ ...prev, amount, type }));
		// 可选：尝试提取对方名称（“给张三”）
		const counterpartyMatch = text.match(/(?:给|付|收)(\w+)/);
		if (counterpartyMatch) {
			setFormData(prev => ({ ...prev, counterparty: counterpartyMatch[1] }));
		}
		alert(`已识别：${type === 'expense' ? '支出' : '收入'} ${amount}元`);
	};
    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 10),
        type: 'expense',
        amount: '',
        counterparty: '',
        category: '餐饮',
        note: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 智能推荐：对方名称失焦时调用
    const handleCounterpartyBlur = async () => {
        const counterparty = formData.counterparty.trim();
        if (!counterparty) return;
        try {
            const res = await apiFetch(`/api/learning/recommend?counterparty=${encodeURIComponent(counterparty)}`);
            if (res.category) {
                setFormData(prev => ({ ...prev, category: res.category }));
                alert(`根据历史记录，推荐分类：${res.category}`);
            }
        } catch (err) {
            console.warn('获取推荐分类失败', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('请输入有效金额');
            return;
        }
        setLoading(true);
        try {
            await apiFetch('/api/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    source: 'manual'
                })
            });
            // 记录学习规则（可选）
            if (formData.counterparty) {
                await apiFetch('/api/learning/record', {
                    method: 'POST',
                    body: JSON.stringify({ counterparty: formData.counterparty, category: formData.category })
                }).catch(err => console.warn);
            }
            alert('记账成功');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            alert('记账失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <h3>快速记账</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>类型</label>
                        <select name="type" value={formData.type} onChange={handleChange} required>
                            <option value="expense">支出</option>
                            <option value="income">收入</option>
                        </select>
                    </div>
                    <div>
                        <label>金额</label>
                        <input
                            type="number"
                            name="amount"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label>对方名称</label>
                        <input
                            type="text"
                            name="counterparty"
                            value={formData.counterparty}
                            onChange={handleChange}
                            onBlur={handleCounterpartyBlur}
                            required
                        />
                    </div>
                    <div>
                        <label>日期</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label>分类</label>
                        <select name="category" value={formData.category} onChange={handleChange}>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>备注</label>
                        <input
                            type="text"
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
						<button type="button" onClick={startListening} disabled={isListening}>   🎤 {isListening ? '聆听中...' : '语音记账'}</button>
                        <button type="button" onClick={onClose} disabled={loading}>取消</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}