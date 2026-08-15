import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Calendar,
  Megaphone,
  Flag,
  ClipboardList,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';
import { SchoolEvent, Announcement, ThaiHoliday, DutyRoster, ActiveNavTab } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: SchoolEvent) => void;
  onNavigateTab: (tab: ActiveNavTab) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    events: SchoolEvent[];
    announcements: Announcement[];
    holidays: ThaiHoliday[];
    duties: DutyRoster[];
  }>({
    events: [],
    announcements: [],
    holidays: [],
    duties: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ events: [], announcements: [], holidays: [], duties: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ events: [], announcements: [], holidays: [], duties: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<any>(`/search?q=${encodeURIComponent(query)}`);
        setResults({
          events: res.events || [],
          announcements: res.announcements || [],
          holidays: res.holidays || [],
          duties: res.duties || [],
        });
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.events.length +
    results.announcements.length +
    results.holidays.length +
    results.duties.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95">
        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหากิจกรรม, ประกาศ, วันหยุด, ครูเวร..."
            className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              กำลังค้นหาข้อมูล...
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              ไม่พบข้อมูลที่ตรงกับ &quot;{query}&quot;
            </div>
          )}

          {!loading && !query && (
            <div className="py-6 text-center text-xs text-slate-400">
              พิมพ์คำค้นหาเพื่อเริ่มต้นค้นหากิจกรรม ประกาศ หรือข้อมูลอื่นๆ ในระบบ
            </div>
          )}

          {/* Events */}
          {results.events.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>กิจกรรม ({results.events.length})</span>
              </p>
              <div className="space-y-1.5">
                {results.events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      onSelectEvent(ev);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-100 dark:border-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {ev.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {ev.startDate} • {ev.location || ev.department}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {results.announcements.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>ประกาศข่าวสาร ({results.announcements.length})</span>
              </p>
              <div className="space-y-1.5">
                {results.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => {
                      onNavigateTab('announcements');
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-100 dark:border-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {ann.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {ann.content}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holidays */}
          {results.holidays.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-rose-500" />
                <span>วันหยุด ({results.holidays.length})</span>
              </p>
              <div className="space-y-1.5">
                {results.holidays.map((hol) => (
                  <div
                    key={hol.id}
                    onClick={() => {
                      onNavigateTab('holidays');
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-100 dark:border-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {hol.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{hol.date}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
