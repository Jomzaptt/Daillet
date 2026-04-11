import { useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Globe, Moon, Sun, Layers } from 'lucide-react';
import { db } from '../lib/db';
import CategoryManager from '../components/CategoryManager';

export default function Settings({ theme, setTheme }: { theme: string, setTheme: (t: string) => void }) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const data = {
      categories: await db.categories.toArray(),
      records: await db.records.toArray(),
      events: await db.events.toArray(),
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daillet-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.categories && data.records) {
          await db.transaction('rw', db.categories, db.records, db.events, async () => {
            await db.categories.clear();
            await db.records.clear();
            await db.events.clear();
            
            await db.categories.bulkAdd(data.categories);
            await db.records.bulkAdd(data.records);
            if (data.events) await db.events.bulkAdd(data.events);
          });
          alert('数据恢复成功！');
          window.location.reload();
        }
      } catch {
        alert('无效的备份文件');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Globe size={20} /> 外观与语言
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>{t('language')}</span>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="rounded-md border bg-transparent px-3 py-1"
              >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span>{t('dark_mode')}</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full p-2 hover:bg-muted"
              >
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Download size={20} /> 数据管理
          </h3>
          <div className="space-y-4">
            <button
              onClick={handleExport}
              className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 hover:bg-muted"
            >
              <Download size={16} /> {t('export')}
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 hover:bg-muted"
            >
              <Upload size={16} /> {t('restore')}
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow md:col-span-2">
          <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Layers size={20} /> {t('manage_categories')}
          </h3>
          <CategoryManager />
        </div>
      </div>
    </div>
  );
}
