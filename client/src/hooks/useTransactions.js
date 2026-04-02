import { useState, useCallback } from 'react';
import { apiFetch } from '../services/api';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1, limit: 50 });
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async (filters = {}, page = 1, limit = 50) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', page);
      params.append('limit', limit);
      const url = `/api/transactions?${params.toString()}`;
      const result = await apiFetch(url);
      setTransactions(result.data || []);
      setPagination(result.pagination || { page, total: 0, totalPages: 1, limit });
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTransaction = async (id) => {
    await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
    await fetchTransactions({}, pagination.page, pagination.limit);
  };

  const updateCategory = async (id, category) => {
    await apiFetch(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category }),
    });
    await fetchTransactions({}, pagination.page, pagination.limit);
  };

  return {
    transactions,
    pagination,
    loading,
    fetchTransactions,
    deleteTransaction,
    updateCategory,
  };
}