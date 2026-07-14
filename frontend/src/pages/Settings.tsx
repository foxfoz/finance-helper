import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { authApi } from '../api/auth';
import { transactionsApi } from '../api/transactions';
import api from '../api/axios';
import type { Transaction } from '../types';
import { Download, Upload, User as UserIcon, Save } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, loadUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    currency: '₽',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        currency: user.currency || '₽',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      await authApi.updateProfile(formData);
      await loadUser();
      setMessage('Профиль сохранён');
    } catch (err) {
      setMessage('Ошибка сохранения профиля');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await transactionsApi.getAll();
      const transactions = response.data.results;

      const csvContent = convertToCSV(transactions);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Ошибка экспорта');
    }
  };

  const convertToCSV = (transactions: Transaction[]) => {
    const headers = ['Дата', 'Тип', 'Категория', 'Фонд', 'Сумма', 'Комментарий'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      t.directory_item_name || '',
      t.fund_name || '',
      t.amount,
      t.comment,
    ]);
    return [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/imports/csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`Импортировано ${response.data.imported_count} записей`);
      setFile(null);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Ошибка импорта');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Настройки</h2>

      {message && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">{message}</div>
      )}

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <UserIcon className="text-primary-600" size={24} />
          <h3 className="text-lg font-semibold">Профиль</h3>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="input"
            >
              <option value="₽">Рубль (₽)</option>
              <option value="$">Доллар ($)</option>
              <option value="€">Евро (€)</option>
            </select>
          </div>

          <button type="submit" disabled={isSaving} className="btn-primary">
            <Save size={18} className="mr-2" />
            {isSaving ? 'Сохранение...' : 'Сохранить профиль'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="text-primary-600" size={24} />
          <h3 className="text-lg font-semibold">Импорт из банка (CSV)</h3>
        </div>

        <form onSubmit={handleImport} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Файл выписки</label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Поддерживаются файлы с колонками: дата, сумма, описание, категория.
            </p>
          </div>

          <button type="submit" disabled={!file || importLoading} className="btn-primary">
            <Upload size={18} className="mr-2" />
            {importLoading ? 'Импорт...' : 'Импортировать'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Download className="text-primary-600" size={24} />
          <h3 className="text-lg font-semibold">Экспорт данных</h3>
        </div>

        <p className="text-gray-600 mb-4">
          Скачайте все операции в формате CSV для резервного копирования или анализа.
        </p>

        <button onClick={handleExport} className="btn-secondary">
          <Download size={18} className="mr-2" />
          Экспортировать операции
        </button>
      </div>
    </div>
  );
};

export default Settings;
