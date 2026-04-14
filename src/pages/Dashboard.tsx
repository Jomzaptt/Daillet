import { useState, type ElementType } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, decrypt } from '../lib/db';
import { format, parseISO } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Wallet, Utensils, Home, Car, Coffee, Gamepad2, ShoppingBag, Trash2 } from 'lucide-react';

const iconMap: Record<string, ElementType> = {
  Wallet, Utensils, Home, Car, Coffee, Gamepad2, ShoppingBag
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'zh' ? zhCN : enUS;
  
  // State for date filter
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Get categories
  const categories = useLiveQuery(() => db.categories.where('type').equals('expense').toArray(), []);

  // Get records for the selected date
  const records = useLiveQuery(
    () => db.records
      .where('[type+date]')
      .equals(['expense', currentDate])
      .reverse()
      .sortBy('timestamp'),
    [currentDate]
  );

  const handleDelete = async (id: number) => {
    if (confirm(t('confirm_delete') || '确定要删除这条记录吗？')) {
      await db.records.delete(id);
    }
  };

  const totalExpense = records?.reduce((sum, record) => sum + parseFloat(decrypt(record.amount) || '0'), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('expenses')}</h1>
        <div className="flex items-center space-x-2">
          <input 
            type="date" 
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('total_expense')}</h3>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">¥ {totalExpense.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold leading-none tracking-tight">
            {format(parseISO(currentDate), 'PP', { locale: dateLocale })}
          </h3>
        </div>
        <div className="p-6 pt-0">
          {records?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无记录
            </div>
          ) : (
            <div className="space-y-8">
              {records?.map((record) => {
                const category = categories?.find(c => c.id === record.categoryId);
                const Icon = category?.icon ? (iconMap[category.icon] || Wallet) : Wallet;
                const note = decrypt(record.note);
                const amount = decrypt(record.amount);
                
                return (
                  <div key={record.id} className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {category ? decrypt(category.name) : '未知'}
                      </p>
                      {note && <p className="text-sm text-muted-foreground">{note}</p>}
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="font-medium text-destructive">
                        -¥{amount}
                      </span>
                      <button
                        onClick={() => handleDelete(record.id!)}
                        className="flex h-11 w-11 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
