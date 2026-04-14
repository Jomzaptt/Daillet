import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Wallet, Banknote, Utensils, Home, Car, Coffee, Gamepad2, ShoppingBag, Briefcase, Gift, PiggyBank, TrendingUp } from 'lucide-react';
import { db, encrypt, decrypt } from '../lib/db';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';

const expenseIcons: Record<string, React.ElementType> = {
  Wallet, Utensils, Home, Car, Coffee, Gamepad2, ShoppingBag
};

const incomeIcons: Record<string, React.ElementType> = {
  Banknote, Briefcase, Gift, PiggyBank, TrendingUp
};

export default function AddRecordModal({ 
  onClose,
  defaultEventId,
  dateRange
}: { 
  onClose: () => void,
  defaultEventId?: number,
  dateRange?: { start: string, end: string }
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(dateRange?.start || format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');

  const categories = useLiveQuery(
    () => db.categories.where('type').equals(type).toArray(),
    [type]
  );

  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id!);
    }
  }, [categories, categoryId]);

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount)) || !categoryId) return;

    await db.records.add({
      type,
      amount: encrypt(amount),
      categoryId,
      date,
      note: encrypt(note),
      timestamp: Date.now(),
      eventId: defaultEventId
    });

    onClose();
  };

  const icons = type === 'expense' ? expenseIcons : incomeIcons;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-background p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('add_record')}</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 flex rounded-lg bg-muted p-1">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              type === 'expense' ? 'bg-background shadow' : 'text-muted-foreground'
            }`}
            onClick={() => { setType('expense'); setCategoryId(null); }}
          >
            {t('expenses')}
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              type === 'income' ? 'bg-background shadow' : 'text-muted-foreground'
            }`}
            onClick={() => { setType('income'); setCategoryId(null); }}
          >
            {t('income')}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('amount')}</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-xl font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">{t('category')}</label>
            <div className="grid grid-cols-4 gap-3">
              {categories?.map((cat) => {
                const Icon = icons[cat.icon] || Wallet;
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id!)}
                    className={`flex flex-col items-center justify-center rounded-lg p-2 transition-colors ${
                      isSelected 
                        ? (type === 'expense' ? 'bg-primary text-primary-foreground' : 'bg-green-600 text-white')
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Icon size={24} className="mb-1" />
                    <span className="text-xs">{decrypt(cat.name)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('date')}</label>
              <input
                type="date"
                value={date}
                min={dateRange?.start}
                max={dateRange?.end}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('note')}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('note')}
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={!amount || !categoryId}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
