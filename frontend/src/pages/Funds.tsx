import React, { useEffect, useState } from 'react';
import { fundsApi } from '../api/funds';
import type { Fund } from '../types';
import { Plus, Pencil, Trash2, X, PiggyBank, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const Funds: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [operationType, setOperationType] = useState<'deposit' | 'withdraw'>('deposit');
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
  });
  const [operationData, setOperationData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    comment: '',
  });

  const currency = '₽';

  const fetchFunds = async () => {
    setLoading(true);
    try {
      const response = await fundsApi.getAll();
      setFunds(response.data.results);
    } catch (err) {
      console.error('Error fetching funds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      target_amount: Number(formData.target_amount),
      current_amount: Number(formData.current_amount) || 0,
      target_date: formData.target_date || null,
    };

    try {
      if (editingId) {
        await fundsApi.update(editingId, data);
      } else {
        await fundsApi.create(data);
      }
      setIsModalOpen(false);
      resetForm();
      fetchFunds();
    } catch (err) {
      console.error('Error saving fund:', err);
      alert('Ошибка сохранения');
    }
  };

  const handleOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund) return;

    try {
      if (operationType === 'deposit') {
        await fundsApi.deposit(
          selectedFund.id,
          Number(operationData.amount),
          operationData.date,
          operationData.comment
        );
      } else {
        await fundsApi.withdraw(
          selectedFund.id,
          Number(operationData.amount),
          operationData.date,
          operationData.comment
        );
      }
      setIsOperationModalOpen(false);
      setOperationData({ amount: '', date: new Date().toISOString().split('T')[0], comment: '' });
      fetchFunds();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка операции');
    }
  };

  const handleEdit = (fund: Fund) => {
    setEditingId(fund.id);
    setFormData({
      name: fund.name,
      target_amount: fund.target_amount.toString(),
      current_amount: fund.current_amount.toString(),
      target_date: fund.target_date || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить фонд?')) return;
    try {
      await fundsApi.delete(id);
      fetchFunds();
    } catch (err) {
      console.error('Error deleting fund:', err);
    }
  };

  const openOperation = (fund: Fund, type: 'deposit' | 'withdraw') => {
    setSelectedFund(fund);
    setOperationType(type);
    setIsOperationModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      target_date: '',
    });
  };

  const formatMoney = (amount: number) => {
    return `${amount.toLocaleString('ru-RU')} ${currency}`;
  };

  const totalSaved = funds.reduce((sum, fund) => sum + Number(fund.current_amount), 0);

  if (loading) {
    return <div className="text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Накопительные фонды</h2>
          <p className="text-gray-500">Отложено всего: <span className="font-medium text-blue-600">{formatMoney(totalSaved)}</span></p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={20} className="mr-2" />
          Создать фонд
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {funds.map((fund) => (
          <div key={fund.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <PiggyBank className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">{fund.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatMoney(fund.current_amount)} / {formatMoney(fund.target_amount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(fund)}
                  className="p-1 text-gray-500 hover:text-primary-600"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(fund.id)}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-primary-600 h-2.5 rounded-full"
                style={{ width: `${fund.progress_percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-500">{fund.progress_percent}% выполнено</span>
              <span className="text-gray-500">Осталось {formatMoney(fund.remaining_amount)}</span>
            </div>

            {fund.monthly_required && (
              <p className="text-sm text-blue-600 mb-3">
                Нужно откладывать: {formatMoney(fund.monthly_required)} / месяц
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => openOperation(fund, 'deposit')}
                className="flex-1 btn-primary text-sm py-2"
              >
                <ArrowUpCircle size={16} className="mr-1" />
                Пополнить
              </button>
              <button
                onClick={() => openOperation(fund, 'withdraw')}
                className="flex-1 btn-secondary text-sm py-2"
              >
                <ArrowDownCircle size={16} className="mr-1" />
                Списать
              </button>
            </div>
          </div>
        ))}
      </div>

      {funds.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">У вас пока нет фондов. Создайте первый накопительный фонд.</p>
        </div>
      )}

      {/* Modal for fund creation/editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Редактировать' : 'Создать'} фонд
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Название цели</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Целевая сумма</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Текущая сумма</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Желаемая дата достижения</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
                  Отмена
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingId ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for deposit/withdraw */}
      {isOperationModalOpen && selectedFund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {operationType === 'deposit' ? 'Пополнение' : 'Списание'} фонда «{selectedFund.name}»
              </h3>
              <button
                onClick={() => setIsOperationModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleOperation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                <input
                  type="number"
                  step="0.01"
                  value={operationData.amount}
                  onChange={(e) => setOperationData({ ...operationData, amount: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input
                  type="date"
                  value={operationData.date}
                  onChange={(e) => setOperationData({ ...operationData, date: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                <input
                  type="text"
                  value={operationData.comment}
                  onChange={(e) => setOperationData({ ...operationData, comment: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsOperationModalOpen(false)} className="btn-secondary flex-1">
                  Отмена
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {operationType === 'deposit' ? 'Пополнить' : 'Списать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Funds;
