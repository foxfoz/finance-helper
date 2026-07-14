import React, { useEffect, useState } from 'react';
import { directoriesApi } from '../api/directories';
import type { DirectoryItem } from '../types';
import { Plus, Pencil, Trash2, X, Star } from 'lucide-react';

const Directories: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: '',
    is_favorite: false,
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await directoriesApi.getAll(activeTab);
      setItems(response.data.results);
    } catch (err) {
      console.error('Error fetching directories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, type: activeTab };

    try {
      if (editingId) {
        await directoriesApi.update(editingId, data);
      } else {
        await directoriesApi.create(data);
      }
      setIsModalOpen(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.name?.[0] || 'Ошибка сохранения');
    }
  };

  const handleEdit = (item: DirectoryItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      color: item.color,
      icon: item.icon,
      is_favorite: item.is_favorite,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    try {
      await directoriesApi.delete(id);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      color: '#3B82F6',
      icon: '',
      is_favorite: false,
    });
  };

  const colorOptions = [
    '#22C55E', '#3B82F6', '#F59E0B', '#EF4444',
    '#EC4899', '#8B5CF6', '#06B6D4', '#6B7280',
  ];

  if (loading) {
    return <div className="text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Справочники статей</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={20} className="mr-2" />
          Добавить статью
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'expense'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Расходы
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'income'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Доходы
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: item.color + '20' }}
              >
                {item.icon || '•'}
              </div>
              <div>
                <p className="font-medium">{item.name}</p>
                {item.is_favorite && (
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-gray-100"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Редактировать' : 'Добавить'} статью
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Иконка (эмодзи)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="input"
                  placeholder="🛒"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_favorite"
                  checked={formData.is_favorite}
                  onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="is_favorite" className="text-sm text-gray-700">
                  Избранное
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

export default Directories;
