"use client"
import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/base-button'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import { Input } from '@/components/ui/base-input'
import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxValue,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
} from '@/components/ui/base-combobox'

export type Filter = {
  key: string
  op: 'is' | 'in' | 'contains' | 'between' | 'equals' | 'boolean'
  values: (string | number | boolean | Date)[]
}

export type FilterOption = { value: string; label: string; icon?: React.ReactNode }

export type FilterFieldConfig = {
  key: string
  label: string
  icon?: React.ReactNode
  type: 'text' | 'email' | 'url' | 'select' | 'multiselect' | 'dateRange' | 'number' | 'boolean'
  className?: string
  placeholder?: string
  options?: FilterOption[]
  min?: number
  max?: number
  step?: number
  searchable?: boolean
}

export function createFilter(key: string, op: Filter['op'], values: Filter['values']): Filter {
  return { key, op, values }
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type DateRangeValue = { from: string; to: string }
type FilterValue = string | string[] | DateRangeValue | boolean
type FormValues = Record<string, FilterValue>
type ComboItem = { id: string; value: string; icon?: React.ReactNode }

function MultiSelectChips({
  label,
  options,
  valueIds,
  onChange,
  icon,
  className,
}: {
  label: string
  options: FilterOption[]
  valueIds: string[]
  onChange: (ids: string[]) => void
  icon?: React.ReactNode
  className?: string
}) {
  const items: ComboItem[] = (options ?? []).map((opt) => ({ id: opt.value, value: opt.label ?? opt.value, icon: opt.icon }))
  const selectedItems = items.filter((it) => valueIds.includes(it.id))
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const inputId = React.useId()
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {icon}
      <Combobox
        items={items}
        multiple
        value={selectedItems}
        onValueChange={(value: unknown) => {
          const next = Array.isArray(value) ? (value as ComboItem[]) : []
          onChange(next.map((n) => n.id))
        }}
      >
        <ComboboxChips ref={containerRef}>
          <ComboboxValue>
            {(valueParam) => {
              const value = Array.isArray(valueParam) ? (valueParam as ComboItem[]) : []
              return (
                <>
                  {value.map((v) => (
                    <ComboboxChip key={v.id} aria-label={v.value}>
                      {v.value}
                      <ComboboxChipRemove />
                    </ComboboxChip>
                  ))}
                  <ComboboxInput id={inputId} placeholder={value.length > 0 ? '' : label} />
                </>
              )
            }}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={containerRef}>
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList>
            {(item: ComboItem) => (
              <ComboboxItem key={item.id} value={item}>
                <ComboboxItemIndicator />
                <div className="col-start-2">{item.value}</div>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}


type FiltersProps = {
  fields: FilterFieldConfig[]
  filters: Filter[]
  onChange: (filters: Filter[]) => void
  size?: 'xs' | 'sm' | 'md' | 'lg'
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  // Accept 'outline' for API parity, map to a supported Button variant internally
  variant?: 'outline' | ButtonVariant
}

export function Filters({ fields, filters, onChange, size = 'sm', radius = 'md', variant = 'outline' }: FiltersProps) {
  function emptyDefaults(): FormValues {
    const initial: FormValues = {}
    for (const f of fields) {
      if (f.type === 'multiselect') initial[f.key] = []
      else if (f.type === 'boolean') initial[f.key] = false
      else if (f.type === 'dateRange') initial[f.key] = { from: '', to: '' }
      else initial[f.key] = ''
    }
    return initial
  }

  function hydrateDefaultsFromFilters(flt: Filter[]): FormValues {
    const next: FormValues = emptyDefaults()
    for (const fl of flt) {
      const key = fl.key
      const op = fl.op
      const vals = fl.values
      const field = fields.find((ff) => ff.key === key)
      if (!field) continue
      if (field.type === 'text' || field.type === 'email' || field.type === 'url') {
        if (op === 'contains' && typeof vals[0] === 'string') next[key] = String(vals[0])
      } else if (field.type === 'select') {
        if ((op === 'is' || op === 'equals') && typeof vals[0] === 'string') next[key] = String(vals[0])
      } else if (field.type === 'multiselect') {
        if (op === 'in') next[key] = (vals as string[])
      } else if (field.type === 'dateRange') {
        if (op === 'between') {
          const from = (vals?.[0] as string) || ''
          const to = (vals?.[1] as string) || ''
          next[key] = { from, to }
        }
      } else if (field.type === 'boolean') {
        if (op === 'boolean' && typeof vals[0] === 'boolean') next[key] = Boolean(vals[0])
      } else if (field.type === 'number') {
        if ((op === 'equals' || op === 'is') && typeof vals[0] !== 'undefined') next[key] = String(vals[0] as number)
      }
    }
    return next
  }

  const { register, control, reset, getValues, formState: { isDirty } } = useForm<FormValues>({
    defaultValues: hydrateDefaultsFromFilters(filters),
  })

  // Hydrate form when external filters prop changes (applied state)
  React.useEffect(() => {
    reset(hydrateDefaultsFromFilters(filters))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const controlBase = cn(
    'border border-input shadow-xs shadow-black/5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
    radius === 'full' ? 'rounded-full' : radius === 'lg' ? 'rounded-lg' : radius === 'md' ? 'rounded-md' : radius === 'sm' ? 'rounded' : 'rounded-none',
    size === 'xs' ? 'h-7 px-2' : size === 'sm' ? 'h-8 px-2.5' : size === 'md' ? 'h-9 px-3' : 'h-10 px-4'
  )

  function buildFilters(state: FormValues): Filter[] {
    const next: Filter[] = []
    for (const field of fields) {
      const v = state[field.key]
      if (field.type === 'text' || field.type === 'email' || field.type === 'url') {
        if (typeof v === 'string' && v.trim()) next.push(createFilter(field.key, 'contains', [v.trim()]))
      } else if (field.type === 'select') {
        if (typeof v === 'string' && v) next.push(createFilter(field.key, 'is', [v]))
      } else if (field.type === 'multiselect') {
        if (Array.isArray(v) && v.length) next.push(createFilter(field.key, 'in', v as string[]))
      } else if (field.type === 'dateRange') {
        const rng = v as DateRangeValue
        if ((rng?.from ?? '') || (rng?.to ?? '')) next.push(createFilter(field.key, 'between', [rng?.from ?? '', rng?.to ?? '']))
      } else if (field.type === 'boolean') {
        if (typeof v === 'boolean') next.push(createFilter(field.key, 'boolean', [v]))
      } else if (field.type === 'number') {
        if (typeof v === 'string' && v !== '') next.push(createFilter(field.key, 'equals', [Number(v)]))
      }
    }
    return next
  }

  function apply() {
    onChange(buildFilters(getValues()))
  }

  function clear() {
    const initial = emptyDefaults()
    reset(initial)
    onChange([])
  }

  return (
    <div className="flex items-start gap-2.5 grow self-start">
      {(() => { return null })()}
      <div className="flex flex-wrap items-center gap-2">
        {fields.map((f) => {
          if (f.type === 'text' || f.type === 'email' || f.type === 'url') {
            return (
              <div key={f.key} className={cn('flex items-center gap-1', f.className)}>
                {f.icon}
                <Input
                  type={f.type === 'text' ? 'text' : f.type}
                  className={cn('min-w-[8rem]')}
                  placeholder={f.placeholder}
                  {...register(f.key as keyof FormValues)}
                />
              </div>
            )
          }
          if (f.type === 'select') {
            const items = (f.options ?? []).map((opt) => opt.value)
            return (
              <div key={f.key} className={cn('flex items-center gap-1', f.className)}>
                {f.icon}
                <Controller
                  key={f.key}
                  name={f.key}
                  control={control}
                  defaultValue={''}
                  render={({ field }) => (
                    <Combobox items={items}>
                      <ComboboxControl>
                        <ComboboxValue>
                          <ComboboxInput placeholder={f.label} />
                        </ComboboxValue>
                        <ComboboxClear />
                        <ComboboxIcon />
                      </ComboboxControl>
                      <ComboboxContent>
                        <ComboboxEmpty>No options found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => {
                            const opt = (f.options ?? []).find((o) => o.value === item)
                            return (
                              <ComboboxItem
                                key={item}
                                value={item}
                                onClick={() => { field.onChange(item) }}
                              >
                                <ComboboxItemIndicator />
                                {opt?.icon}
                                {opt?.label ?? item}
                              </ComboboxItem>
                            )
                          }}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
              </div>
            )
          }
          if (f.type === 'multiselect') {
            return (
              <Controller
                key={f.key}
                name={f.key}
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <MultiSelectChips
                    key={f.key}
                    label={f.label}
                    options={f.options ?? []}
                    valueIds={Array.isArray(field.value) ? (field.value as string[]) : []}
                    onChange={(ids) => field.onChange(ids)}
                    icon={f.icon}
                    className={f.className}
                  />
                )}
              />
            )
          }
          if (f.type === 'dateRange') {
            return (
              <Controller
                key={f.key}
                name={f.key}
                control={control}
                defaultValue={{ from: '', to: '' }}
                render={({ field }) => (
                  <DateRangeField
                    key={f.key}
                    className={f.className}
                    controlClassName={controlBase}
                    value={(field.value as DateRangeValue) ?? { from: '', to: '' }}
                    formatFn={(from?: string, to?: string) => {
                      const fmt = (s?: string) => (s ? format(new Date(s), 'yyyy-MM-dd') : '')
                      const a = fmt(from)
                      const b = fmt(to)
                      return a || b ? `${a} – ${b}` : f.label
                    }}
                    onChange={(next) => field.onChange(next)}
                  />
                )}
              />
            )
          }
          if (f.type === 'boolean') {
            return (
              <label key={f.key} className={cn('flex items-center gap-2 text-sm', f.className)}>
                {f.icon}
                <span>{f.label}</span>
                <Controller
                  key={f.key}
                  name={f.key}
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value === true}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              </label>
            )
          }
          if (f.type === 'number') {
            return (
              <div key={f.key} className={cn('flex items-center gap-1', f.className)}>
                {f.icon}
                <Input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  className={cn()}
                  {...register(f.key as keyof FormValues)}
                />
              </div>
            )
          }
          return null
        })}
      </div>
      <div className="flex items-center gap-2">
        {(() => { const buttonVariant: ButtonVariant = variant === 'outline' ? 'ghost' : variant; return (
          <>
            <Button variant={buttonVariant} onClick={apply} disabled={!isDirty}>Apply</Button>
            {filters.length > 0 && (
              <Button variant="destructive" onClick={clear}>Clear</Button>
            )}
          </>
        ) })()}
      </div>
    </div>
  )
}
export function DateRangeField({
  className,
  value,
  onChange,
  formatFn,
  controlClassName,
}: {
  className?: string
  value: DateRangeValue
  onChange: (val: DateRangeValue) => void
  formatFn?: (from?: string, to?: string) => string
  controlClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const label = formatFn ? formatFn(value.from, value.to) : [value.from, value.to].filter(Boolean).join(' – ') || 'Select range'

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!(e.target instanceof Node)) return
      if (!containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const selected = {
    from: value.from ? new Date(value.from) : undefined,
    to: value.to ? new Date(value.to) : undefined,
  }

  const [placement, setPlacement] = React.useState<'bottom' | 'top'>('bottom')
  React.useEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const needed = 360
    setPlacement(spaceBelow >= needed ? 'bottom' : 'top')
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative flex items-center', className)}>
      <button
        type="button"
        className={cn('relative w-[260px] text-left flex items-center gap-2 pr-10', controlClassName)}
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        <span className="truncate">{label}</span>
        {(value.from || value.to) && (
          <span
            className={cn('absolute right-2 inset-y-0 inline-flex items-center justify-center w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30')}
            onClick={(e) => { e.stopPropagation(); onChange({ from: '', to: '' }); setOpen(false) }}
            aria-label="Clear date range"
            title="Clear date range"
            role="button"
          >
            <X className="h-4 w-4" />
          </span>
        )}
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 bg-white border rounded-md shadow-lg p-2',
            placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          )}
        >
          <DayPicker
            mode="range"
            numberOfMonths={2}
            selected={selected}
            onSelect={(next) => {
              const toStr = (d: Date | undefined) => (d ? format(d, 'yyyy-MM-dd') : '')
              const nextVal: DateRangeValue = { from: toStr(next?.from), to: toStr(next?.to) }
              onChange(nextVal)
              if (next?.from && next?.to) setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}