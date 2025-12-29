"use client";
import * as React from 'react';
import { Badge, badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import AddTaskDialog from '@/components/add-task-dialog';
import { Plus, GripVertical, Briefcase, Heart, User, Target, Tag, Car, Newspaper, Bell } from 'lucide-react';
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from '@/components/ui/kanban';
// lucide icons imported above

type ApiTask = { id: string; title: string; category: string; done: boolean; createdAt: string; updatedAt: string };

type Task = {
  id: string;
  title: string;
  category?: string;
  createdAt?: string;
  completedAt?: string;
};

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
type CategoryMeta = { variant: BadgeVariant; avatar?: string };

const COLUMN_TITLES: Record<string, string> = {
  open: 'Open',
  done: 'Done',
};

const COLUMN_BG: Record<string, string> = {
  open: 'rounded-md border p-2.5 shadow-xs bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-muted/60 dark:to-muted/40',
  done: 'rounded-md border p-2.5 shadow-xs bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-muted/60 dark:to-muted/40',
};

function getIconForCategory(name?: string) {
  const key = (name || '').toLowerCase()
  if (key === 'work') return Briefcase
  if (key === 'health') return Heart
  if (key === 'personal') return User
  if (key === 'goal') return Target
  if (/car|vehicle|auto/.test(key)) return Car
  if (/news|article|feed/.test(key)) return Newspaper
  if (/reminder|alert|notify|bell/.test(key)) return Bell
  return Tag
}

interface TaskCardProps extends Omit<React.ComponentProps<typeof KanbanItem>, 'value' | 'children'> {
  task: Task;
}

function TaskCard({ task, ...props }: TaskCardProps) {
  const categoryMeta: Record<string, CategoryMeta> = {
    work: { variant: 'info', avatar: 'https://icons.bitwarden.com/work/icon.png' },
    health: { variant: 'success', avatar: 'https://icons.bitwarden.com/health/icon.png' },
    personal: { variant: 'primary', avatar: 'https://icons.bitwarden.com/user/icon.png' },
    goal: { variant: 'warning', avatar: 'https://icons.bitwarden.com/goal/icon.png' },
  };

  const defaultMeta: CategoryMeta = { variant: 'secondary' };
  const meta: CategoryMeta = task.category ? categoryMeta[task.category] ?? defaultMeta : defaultMeta;
  const [expanded, setExpanded] = React.useState(false);
  const displayTitle = task.title.length > 10 ? `${task.title.slice(0, 10)}...` : task.title;

  const cardContent = (
    <div
      className="rounded-md border bg-card p-3 shadow-xs"
      onClick={() => setExpanded((v) => !v)}
      role="button"
      aria-expanded={expanded}
    >
      <div className="flex items-start gap-2.5">
        {/* Drag handle on the left */}
        <KanbanItemHandle asChild>
          <Button
            variant="dim"
            size="sm"
            mode="icon"
            className="mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical />
          </Button>
        </KanbanItemHandle>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{displayTitle}</span>
            {task.category && (() => {
              const Icon = getIconForCategory(task.category)
              return (
                <Badge
                  variant={meta.variant}
                  appearance="outline"
                  className="pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize shrink-0 inline-flex items-center gap-1"
                >
                  <Icon className="size-3" />
                  <span>{task.category}</span>
                </Badge>
              );
            })()}
          </div>

          <div className="flex items-center justify-between text-muted-foreground text-[11px] w-full">
            <div>
              {task.createdAt && (
                <time className="text-[10px] tabular-nums whitespace-nowrap">
                  Created {new Date(task.createdAt).toLocaleDateString()}
                </time>
              )}
            </div>
            <div>
              {task.completedAt && (
                <time className="text-[10px] tabular-nums whitespace-nowrap">
                  Completed {new Date(task.completedAt).toLocaleDateString()}
                </time>
              )}
            </div>
          </div>

          {expanded && (
            <div className="mt-2 w-full p-[10px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[12px] break-words">
                <div>
                  <div className="text-muted-foreground">Title</div>
                  <div>{task.title}</div>
                </div>
                {task.category && (
                  <div>
                    <div className="text-muted-foreground">Category</div>
                    <div className="capitalize">{task.category}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Completed</div>
                  <div>{task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <KanbanItem value={task.id} {...props}>
      {cardContent}
    </KanbanItem>
  );
}

interface TaskColumnProps extends Omit<React.ComponentProps<typeof KanbanColumn>, 'children'> {
  tasks: Task[];
}

function TaskColumn({ value, tasks, ...props }: TaskColumnProps) {
  return (
    <KanbanColumn value={value} {...props} className={COLUMN_BG[value] ?? 'rounded-md border bg-card p-2.5 shadow-xs'}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm">{COLUMN_TITLES[value]}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <KanbanColumnHandle asChild>
          <Button variant="dim" size="sm" mode="icon">
            <GripVertical />
          </Button>
        </KanbanColumnHandle>
      </div>
      <KanbanColumnContent value={value} className="flex flex-col gap-2.5 p-0.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </KanbanColumnContent>
    </KanbanColumn>
  );
}

function toColumns(tasks: ApiTask[]): Record<string, Task[]> {
  const open: Task[] = [];
  const done: Task[] = [];
  for (const t of tasks) {
    const item: Task = {
      id: t.id,
      title: t.title,
      category: t.category,
      createdAt: t.createdAt,
      completedAt: t.done ? t.updatedAt : undefined,
    };
    (t.done ? done : open).push(item);
  }
  return { open, done };
}

function invert(columns: Record<string, Task[]>): Map<string, string> {
  const m = new Map<string, string>();
  for (const [col, arr] of Object.entries(columns)) {
    for (const item of arr) m.set(item.id, col);
  }
  return m;
}

import type { Filter } from '@/components/ui/filters';

export default function TasksKanban({ filters = [] }: { filters?: Filter[] }) {
  const [columns, setColumns] = React.useState<Record<string, Task[]>>({ open: [], done: [] });
  const prevMapRef = React.useRef<Map<string, string>>(new Map());
  const [addOpen, setAddOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<string[]>(['work', 'health', 'personal', 'goal']);
  const [canAddCategory, setCanAddCategory] = React.useState<boolean>(false);

  const load = React.useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '100')
      for (const f of filters) {
        if (f.key === 'title' && f.op === 'contains') {
          params.set('title', String(f.values[0] ?? ''))
        } else if (f.key === 'category' && f.op === 'in') {
          const cats = (f.values ?? []).map(String).join(',')
          if (cats) params.set('categories', cats)
        } else if (f.key === 'status' && f.op === 'in') {
          const statuses = (f.values ?? []).map(String).join(',')
          if (statuses) params.set('status', statuses)
        } else if (f.key === 'createdAt' && f.op === 'between') {
          const from = String(f.values[0] ?? '')
          const to = String(f.values[1] ?? '')
          if (from) params.set('createdFrom', from)
          if (to) params.set('createdTo', to)
        }
      }
      const res = await fetch(`/api/tasks?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const cols = toColumns((data?.tasks ?? []) as ApiTask[]);
      setColumns(cols);
      prevMapRef.current = invert(cols);
    } catch {
      setColumns({ open: [], done: [] });
      prevMapRef.current = new Map();
    }
  }, [filters]);

  const loadCategories = React.useCallback(async () => {
    try {
      const res = await fetch('/api/categories', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { ok: boolean; categories?: string[]; canAdd?: boolean }
      if (data.ok) {
        const cats = Array.isArray(data.categories) ? data.categories : ['work', 'health', 'personal', 'goal']
        setCategories(cats)
        setCanAddCategory(Boolean(data.canAdd))
      }
    } catch {
      setCategories(['work', 'health', 'personal', 'goal'])
      setCanAddCategory(false)
    }
  }, [])

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { loadCategories() }, [loadCategories])

  const handleValueChange = async (next: Record<string, Task[]>) => {
    setColumns(next);
    const nextMap = invert(next);
    // Detect moved items and reflect to API
    const changed: Array<{ id: string; column: string }> = [];
    for (const [id, col] of nextMap.entries()) {
      const prev = prevMapRef.current.get(id);
      if (prev && prev !== col) changed.push({ id, column: col });
    }
    prevMapRef.current = nextMap;
    // Process moves (likely just one)
    for (const c of changed) {
      try {
        await fetch(`/api/tasks/${encodeURIComponent(c.id)}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done: c.column === 'done' }),
        });
      } catch { void 0 }
    }
  };

  return (
    <Kanban value={columns} onValueChange={handleValueChange} getItemValue={(item) => item.id}>
      <KanbanBoard className="grid auto-rows-fr grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(columns).map(([columnValue, tasks]) => (
          <KanbanColumn key={columnValue} value={columnValue} className={COLUMN_BG[columnValue] ?? 'rounded-md border bg-card p-2.5 shadow-xs'}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-sm">{COLUMN_TITLES[columnValue]}</span>
                <Badge variant="secondary">{tasks.length}</Badge>
              </div>
              <KanbanColumnHandle asChild>
                <Button variant="dim" size="sm" mode="icon">
                  <GripVertical />
                </Button>
              </KanbanColumnHandle>
            </div>
            <KanbanColumnContent value={columnValue} className="flex flex-col gap-2.5 p-0.5">
              {columnValue === 'open' && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="rounded-md border border-dashed bg-muted/40 p-3 text-left hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="size-4" />
                    <span className="text-sm font-medium">Add task</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Create a new task in Open</p>
                </button>
              )}
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </KanbanColumnContent>
          </KanbanColumn>
        ))}
      </KanbanBoard>
      <KanbanOverlay>
        {({ value, variant }) => {
          if (variant === 'column') {
            const tasks = columns[value] ?? [];
            return <TaskColumn value={String(value)} tasks={tasks} />;
          }

          const task = Object.values(columns)
            .flat()
            .find((task) => task.id === value);

          if (!task) return null;

          return <TaskCard task={task} />;
        }}
      </KanbanOverlay>
      <AddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        canAddCategory={canAddCategory}
        onSuccess={async () => {
          await load()
        }}
      />
    </Kanban>
  );
}