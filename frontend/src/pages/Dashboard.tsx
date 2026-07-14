import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { analyticsApi } from '../api/analytics';
import type { DashboardData, Advice } from '../types';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const currency = '₽';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashboardRes, adviceRes] = await Promise.all([
          analyticsApi.getDashboard(period),
          analyticsApi.getAdvice(),
        ]);
        setData(dashboardRes.data);
        setAdvice(adviceRes.data.advice);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const formatMoney = (amount: number) => {
    return `${amount.toLocaleString('ru-RU')} ${currency}`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'quarter':
        return 'квартал';
      case 'year':
        return 'год';
      default:
        return 'месяц';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка дашборда...</div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-red-600">Ошибка загрузки данных</div>;
  }

  const dynamicData = data.income_dynamic.map((item, index) => {
    const expenseItem = data.expense_dynamic[index] || { total: 0 };
    const label = item.date || `${item.date__month}`;
    return {
      name: label,
      Доходы: Number(item.total),
      Расходы: Number(expenseItem.total),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Главная</h2>
        <div className="flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p === 'month' ? 'Месяц' : p === 'quarter' ? 'Квартал' : 'Год'}
            </button>
          ))}
        </div>
      </div>

      {/* Виджеты */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Баланс за {getPeriodLabel()}</p>
              <p className={`text-2xl font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(data.balance)}
              </p>
            </div>
            <Wallet className="text-primary-500" size={32} />
          </div>
          {data.balance_change_percent !== null && (
            <p className="text-sm mt-2 text-gray-500">
              vs прошлый период: {data.balance_change_percent > 0 ? '+' : ''}
              {data.balance_change_percent}%
            </p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Доходы</p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(data.income)}</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Расходы</p>
              <p className="text-2xl font-bold text-red-600">{formatMoney(data.expense)}</p>
            </div>
            <TrendingDown className="text-red-500" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">В фонды</p>
              <p className="text-2xl font-bold text-blue-600">{formatMoney(data.fund)}</p>
            </div>
            <PiggyBank className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Структура расходов */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Структура расходов</h3>
          {data.expense_structure.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.expense_structure}
                  dataKey="total"
                  nameKey="directory_item__name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {data.expense_structure.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.directory_item__color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatMoney(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Нет данных о расходах за период</p>
          )}
        </div>

        {/* Динамика */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Динамика доходов и расходов</h3>
          {dynamicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dynamicData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value) => formatMoney(Number(value))} />
                <Legend />
                <Bar dataKey="Доходы" fill="#22C55E" />
                <Bar dataKey="Расходы" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Нет данных за период</p>
          )}
        </div>
      </div>

      {/* Фонды */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Прогресс фондов</h3>
        {data.funds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.funds.map((fund) => (
              <div key={fund.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{fund.name}</span>
                  <span className="text-sm text-gray-500">
                    {formatMoney(fund.current_amount)} / {formatMoney(fund.target_amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full"
                    style={{ width: `${fund.progress_percent}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {fund.progress_percent}% — осталось {formatMoney(fund.remaining_amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">У вас пока нет активных фондов</p>
        )}
      </div>

      {/* Топ-5 расходов */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Топ-5 статей расходов</h3>
        {data.top_expenses.length > 0 ? (
          <div className="space-y-3">
            {data.top_expenses.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.directory_item__color }}
                  />
                  <span>{item.directory_item__name}</span>
                </div>
                <span className="font-medium">{formatMoney(item.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Нет расходов за период</p>
        )}
      </div>

      {/* Советы */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Советы</h3>
        {advice.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advice.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  item.type === 'warning'
                    ? 'bg-red-50 border-red-200'
                    : item.type === 'goal'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <h4 className="font-medium mb-1">{item.title}</h4>
                <p className="text-sm text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Пока нет советов. Добавьте больше данных.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
