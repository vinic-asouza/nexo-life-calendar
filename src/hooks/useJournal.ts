import { useEffect, useRef, useState } from 'react';
import { repositories } from '@/repositories';

type SaveState = 'idle' | 'saving' | 'saved';

export function useJournal(date: string) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const debounceRef = useRef<number | null>(null);
  const lastSavedRef = useRef<string>('');
  const currentDateRef = useRef<string>(date);

  // Load entry when date changes
  useEffect(() => {
    let cancelled = false;
    currentDateRef.current = date;
    setLoading(true);
    setSaveState('idle');
    repositories.journal
      .getByDate(date)
      .then((entry) => {
        if (cancelled) return;
        const text = entry?.content ?? '';
        setContent(text);
        lastSavedRef.current = text;
      })
      .catch(() => {
        if (cancelled) return;
        setContent('');
        lastSavedRef.current = '';
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [date]);

  const updateContent = (next: string) => {
    setContent(next);
    if (next === lastSavedRef.current) return;
    setSaveState('saving');
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const targetDate = currentDateRef.current;
    debounceRef.current = window.setTimeout(async () => {
      try {
        await repositories.journal.upsert(targetDate, next);
        if (currentDateRef.current === targetDate) {
          lastSavedRef.current = next;
          setSaveState('saved');
        }
      } catch {
        setSaveState('idle');
      }
    }, 600);
  };

  return { content, loading, saveState, updateContent };
}
