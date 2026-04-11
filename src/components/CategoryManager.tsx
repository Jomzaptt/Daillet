import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, encrypt, decrypt } from '../lib/db';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export default function CategoryManager() {
  const { t } = useTranslation();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const categories = useLiveQuery(
    () => db.categories.where('type').equals(type).toArray(),
    [type]
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await db.categories.add({
      type,
      name: encrypt(newName.trim()),
      isDefault: false,
      icon: type === 'expense' ? 'Wallet' : 'Banknote',
    });
    setNewName('');
    setIsAdding(false);
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await db.categories.update(id, { name: encrypt(editName.trim()) });
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除此类别吗？相关的记录将显示为"未知类别"')) {
      await db.categories.delete(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg bg-muted p-1">
        <button
          className={`flex-1 rounded-md py-1 text-sm font-medium transition-all ${
            type === 'expense' ? 'bg-background shadow' : 'text-muted-foreground'
          }`}
          onClick={() => setType('expense')}
        >
          {t('expenses')}
        </button>
        <button
          className={`flex-1 rounded-md py-1 text-sm font-medium transition-all ${
            type === 'income' ? 'bg-background shadow' : 'text-muted-foreground'
          }`}
          onClick={() => setType('income')}
        >
          {t('income')}
        </button>
      </div>

      <div className="space-y-2">
        {categories?.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
            {editingId === cat.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  autoFocus
                />
                <button onClick={() => handleUpdate(cat.id!)} className="text-green-600">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium">{decrypt(cat.name)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingId(cat.id!); setEditName(decrypt(cat.name)); }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Edit2 size={16} />
                  </button>
                  {!cat.isDefault && (
                    <button
                      onClick={() => handleDelete(cat.id!)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {isAdding ? (
          <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="类别名称"
              className="flex-1 rounded border px-2 py-1 text-sm"
              autoFocus
            />
            <button onClick={handleAdd} className="text-green-600">
              <Check size={16} />
            </button>
            <button onClick={() => setIsAdding(false)} className="text-muted-foreground">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted"
          >
            <Plus size={16} /> {t('add_category')}
          </button>
        )}
      </div>
    </div>
  );
}
