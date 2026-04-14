import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, decrypt } from '../lib/db';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import EventModal from '../components/EventModal';
import { Link } from 'react-router-dom';

export default function Events() {
  const { t } = useTranslation();
  const [showAddEvent, setShowAddEvent] = useState(false);

  const events = useLiveQuery(() => db.events.toArray(), []);
  
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除此专题吗？相关记录也会被一并删除')) {
      await db.transaction('rw', db.events, db.records, async () => {
        await db.events.delete(id);
        await db.records.where('eventId').equals(id).delete();
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('events')}</h1>
        <button
          onClick={() => setShowAddEvent(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={16} />
          新建专题
        </button>
      </div>

      {events?.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground shadow">
          <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>暂无专题记录，点击右上角新建专题</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <Link 
              key={event.id} 
              to={`/events/${event.id}`}
              className="group block rounded-xl border bg-card p-6 shadow transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{decrypt(event.name)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {event.startDate} ~ {event.endDate}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, event.id!)}
                  className="rounded-full p-2 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {showAddEvent && <EventModal onClose={() => setShowAddEvent(false)} />}
    </div>
  );
}
