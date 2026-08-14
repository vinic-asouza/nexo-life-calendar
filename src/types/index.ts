export interface Area {
  id: string;
  name: string;
  color: string; // HSL string like "37 92% 60%"
}

export interface ItemType {
  id: string;
  name: string;
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  customDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  endDate?: string; // YYYY-MM-DD: optional last day the recurrence is valid
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export type GroupingMode = 'type' | 'time';

export interface CalendarItem {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  startTime?: string; // "HH:mm"
  endTime?: string;   // "HH:mm"
  areaId: string;
  typeId: string;
  recurrence?: Recurrence;
  notes?: string;
  status: 'pending' | 'done';
  completedDates?: string[]; // YYYY-MM-DD list of completed occurrences (for recurring items)
  excludedDates?: string[]; // YYYY-MM-DD list of occurrences removed from a recurring item
  checklist?: ChecklistItem[];
  comments?: Comment[];
  createdAt: string;
}

export type ViewMode = 'day' | 'week' | 'month';

export interface FilterState {
  areaIds: string[];
  typeIds: string[];
}

// Default areas
export const DEFAULT_AREAS: Area[] = [
  { id: 'area-personal', name: 'Pessoal', color: '217 91% 60%' },
  { id: 'area-work', name: 'Profissional', color: '37 92% 60%' },
  { id: 'area-health', name: 'Saúde', color: '142 71% 45%' },
  { id: 'area-family', name: 'Família', color: '340 82% 52%' },
];

// Default types
export const DEFAULT_TYPES: ItemType[] = [
  { id: 'type-event', name: 'Evento' },
  { id: 'type-task', name: 'Tarefa' },
  { id: 'type-habit', name: 'Hábito' },
  { id: 'type-reminder', name: 'Lembrete' },
];
