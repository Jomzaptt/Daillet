import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, decrypt } from '../lib/db';
import { ArrowLeft, Plus } from 'lucide-react';
import AddRecordModal from '../components/AddRecordModal';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const [showAdd, setShowAdd] = useState(false);

  const event = useLiveQuery(() => db.events.get(eventId), [eventId]);
  
  const records = useLiveQuery(
    () => db.records.where('eventId').equals(eventId).reverse().sortBy('timestamp'),
    [eventId]
  );

  const categories = useLiveQuery(() => db.categories.toArray(), []);

  if (!event) return <div>加载中...</div>;

  const totalExpense = records?.filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + parseFloat(decrypt(r.amount) || '0'), 0) || 0;
    
  const totalIncome = records?.filter(r => r.type === 'income')
    .reduce((sum, r) => sum + parseFloat(decrypt(r.amount) || '0'), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/events" className="rounded-full p-2 hover:bg-muted">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{decrypt(event.name)}</h1>
            <p className="text-sm text-muted-foreground">
              {event.startDate} ~ {event.endDate}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={16} />
          记一笔
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow">
          <h3 className="text-sm font-medium text-muted-foreground">专题总支出</h3>
          <div className="mt-2 text-2xl font-bold text-destructive">¥ {totalExpense.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow">
          <h3 className="text-sm font-medium text-muted-foreground">专题总收入</h3>
          <div className="mt-2 text-2xl font-bold text-green-600">¥ {totalIncome.toFixed(2)}</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold">记录明细</h3>
        </div>
        <div className="p-6 pt-0">
          {records?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">暂无记录</div>
          ) : (
            <div className="space-y-6">
              {records?.map(record => {
                const category = categories?.find(c => c.id === record.categoryId);
                const isExpense = record.type === 'expense';
                return (
                  <div key={record.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{category ? decrypt(category.name) : '未知'}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.date} {decrypt(record.note) && `· ${decrypt(record.note)}`}
                      </p>
                    </div>
                    <div className={`font-bold ${isExpense ? 'text-destructive' : 'text-green-600'}`}>
                      {isExpense ? '-' : '+'}¥{decrypt(record.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddRecordModal 
          onClose={() => setShowAdd(false)} 
          defaultEventId={eventId}
          dateRange={{ start: event.startDate, end: event.endDate }}
        />
      )}
    </div>
  );
}
