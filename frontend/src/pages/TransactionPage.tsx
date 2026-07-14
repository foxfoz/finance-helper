import React, { useEffect, useState } from 'react';
import { transactionsApi } from '../api/transactions';
import { directoriesApi } from '../api/directories';
import type { Transaction, DirectoryItem } from '../types';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface TransactionPageProps {
  type: 'income' | 'expense';
  title: string;
}

const TransactionPage: React.FC<TransactionPageProps> = ({ type, title }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    directory_item: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    comment: '',
    is_recurring: false,
  });

  const currency = '₽';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        transactionsApi.getAll({ type }),
        directoriesApi.getAll(type),
      ]);
      setTransactions(transactionsRes.data.results);
      setCategories(categoriesRes.data.results);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type,
      directory_item: Number(formData.directory_item),
      amount: Number(formData.amount),
      date: formData.date,
      comment: formData.comment,
      is_recurring: formData.is_recurring,
    };

    try {
      if (editingId) {
        await transactionsApi.update(editingId, data);
      } else {
        await transactionsApi.create(data);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Ошибка сохранения');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormData({
      directory_item: transaction.directory_item?.toString() || '',
      amount: transaction.amount.toString(),
      date: transaction.date,
      comment: transaction.comment,
      is_recurring: transaction.is_recurring,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await transactionsApi.delete(id);
      fetchData();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      directory_item: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      comment: '',
      is_recurring: false,
    });
  };

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const formatMoney = (amount: number) => {
    return `${amount.toLocaleString('ru-RU')} ${currency}`;
  };

  if (loading) {
    return <div className="text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-gray-500">
            Всего за период:{' '}
            <span className={type === 'income' ? 'text-green-600' : 'text-red-600'}>
              {formatMoney(total)}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={20} className="mr-2" />
          Добавить
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Дата</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Категория</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Комментарий</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Сумма</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Действия</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{transaction.date}</td>
                  <td className="py-3 px-4">{transaction.directory_item_name}</td>
                  <td className="py-3 px-4 text-gray-500">{transaction.comment || '-'}</td>
                  <td className={`py-3 px-4 text-right font-medium ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoney(Number(transaction.amount))}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1 text-gray-500 hover:text-primary-600"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Нет записей. Нажмите «Добавить», чтобы создать первую.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Редактировать' : 'Добавить'} {title.toLowerCase()}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                <select
                  value={formData.directory_item}
                  onChange={(e) => setFormData({ ...formData, directory_item: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                <input
                  type="text"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="is_recurring" className="text-sm text-gray-700">
                  Повторяющийся
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
                  Отмена
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingId ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;
