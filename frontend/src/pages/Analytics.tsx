import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics';
import type { Advice } from '../types';
import { Lightbulb, AlertTriangle, TrendingUp, Target, Repeat } from 'lucide-react';

const Analytics: React.FC = () => {
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const response = await analyticsApi.getAdvice();
        setAdvice(response.data.advice);
      } catch (err) {
        console.error('Error fetching advice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-red-500" size={24} />;
      case 'goal':
        return <Target className="text-blue-500" size={24} />;
      case 'tip':
        return <Repeat className="text-cyan-500" size={24} />;
      default:
        return <TrendingUp className="text-yellow-500" size={24} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-red-50 border-red-200';
      case 'goal':
        return 'bg-blue-50 border-blue-200';
      case 'tip':
        return 'bg-cyan-50 border-cyan-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  if (loading) {
    return <div className="text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="text-primary-600" size={28} />
        <h2 className="text-2xl font-bold">Аналитика и советы</h2>
      </div>

      <p className="text-gray-600">
        Персональные рекомендации на основе ваших финансовых данных. Добавьте больше операций,
        чтобы получать более точные советы.
      </p>

      {advice.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advice.map((item, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl border ${getBgColor(item.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{getIcon(item.type)}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Lightbulb className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Пока недостаточно данных для формирования советов.</p>
          <p className="text-gray-400 text-sm mt-1">
            Добавьте доходы, расходы и фонды — и советы появятся здесь.
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
