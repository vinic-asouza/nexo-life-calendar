import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddItem: () => void;
  onToggleSidebar: () => void;
}

const viewLabels: Record<ViewMode, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
};

export function Header({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onAddItem,
  onToggleSidebar,
}: HeaderProps) {
  const dateLabel = (() => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR });
      case 'week':
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
      case 'month':
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
  })();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-card px-4 py-3 md:px-6">
      {/* Left: Logo + sidebar toggle */}
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="flex items-center gap-1 md:hidden">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect y="3" width="20" height="2" rx="1" fill="currentColor"/>
            <rect y="9" width="20" height="2" rx="1" fill="currentColor"/>
            <rect y="15" width="20" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          <span className="text-primary">N</span>EXO
        </h1>
      </div>

      {/* Center: Date navigation */}
      <div className="flex items-center gap-1 md:gap-2">
        <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={onToday}
          className="min-w-[140px] text-center text-sm font-medium capitalize hover:text-primary transition-colors md:min-w-[180px] md:text-base"
        >
          {dateLabel}
        </button>
        <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: View selector + Add */}
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-0.5 rounded-lg bg-muted p-0.5 sm:flex">
          {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                viewMode === mode
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {viewLabels[mode]}
            </button>
          ))}
        </div>
        <Button onClick={onAddItem} size="sm" className="gap-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>
    </header>
  );
}
