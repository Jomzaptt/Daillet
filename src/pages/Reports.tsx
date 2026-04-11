import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, decrypt } from '../lib/db';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Reports() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'zh' ? zhCN : enUS;
  const [reportType, setReportType] = useState<'week' | 'month' | 'year'>('month');

  const records = useLiveQuery(() => db.records.where('type').equals('expense').toArray(), []);
  const categories = useLiveQuery(() => db.categories.where('type').equals('expense').toArray(), []);

  if (!records || !categories) return null;

  const now = new Date();
  let startDate: Date, endDate: Date;

  if (reportType === 'week') {
    startDate = startOfWeek(now, { locale: dateLocale });
    endDate = endOfWeek(now, { locale: dateLocale });
  } else if (reportType === 'month') {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  } else {
    startDate = startOfYear(now);
    endDate = endOfYear(now);
  }

  const filteredRecords = records.filter(r => {
    const d = new Date(r.date);
    return d >= startDate && d <= endDate;
  });

  const total = filteredRecords.reduce((sum, r) => sum + parseFloat(decrypt(r.amount) || '0'), 0);

  // Group by category for pie chart
  const categoryTotals = filteredRecords.reduce((acc, r) => {
    const amount = parseFloat(decrypt(r.amount) || '0');
    acc[r.categoryId] = (acc[r.categoryId] || 0) + amount;
    return acc;
  }, {} as Record<number, number>);

  const pieData = Object.keys(categoryTotals).map(catId => {
    const cat = categories.find(c => c.id === Number(catId));
    return {
      name: cat ? decrypt(cat.name) : '未知',
      value: categoryTotals[Number(catId)]
    };
  }).filter(d => d.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666'];

  // Trend data
  let trendData: any[] = [];
  if (reportType === 'week' || reportType === 'month') {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    trendData = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTotal = filteredRecords
        .filter(r => r.date === dateStr)
        .reduce((sum, r) => sum + parseFloat(decrypt(r.amount) || '0'), 0);
      return {
        date: format(day, 'MM-dd'),
        amount: dayTotal
      };
    });
  } else {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    trendData = months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const monthTotal = filteredRecords
        .filter(r => r.date.startsWith(monthStr))
        .reduce((sum, r) => sum + parseFloat(decrypt(r.amount) || '0'), 0);
      return {
        date: format(month, 'MM月', { locale: dateLocale }),
        amount: monthTotal
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('reports')}</h1>
        <div className="flex rounded-lg bg-muted p-1">
          {['week', 'month', 'year'].map(type => (
            <button
              key={type}
              onClick={() => setReportType(type as any)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                reportType === type ? 'bg-background shadow' : 'text-muted-foreground'
              }`}
            >
              {type === 'week' ? '周报' : type === 'month' ? '月报' : '年报'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">总支出</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-destructive">¥ {total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(startDate, 'PP', { locale: dateLocale })} - {format(endDate, 'PP', { locale: dateLocale })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">支出分类占比</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">支出趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={v => `¥${v}`} />
                <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => `¥${value.toFixed(2)}`} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
