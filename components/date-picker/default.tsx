'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';

export type DatePickerProps = {
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
};

export function DatePicker({ value, onChange, placeholder = 'Pick a date', className }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleReset = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setDate(undefined);
    onChange?.(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={className ?? 'relative w-[250px]'}>
          <Button type="button" variant="outline" mode="input" placeholder={!date} className="w-full">
            <CalendarIcon role="img" className="text-foreground" />
            <span className={date ? 'text-foreground' : 'text-muted-foreground'}>
              {date ? format(date, 'PPP') : placeholder}
            </span>
          </Button>
          {date && (
            <Button
              type="button"
              variant="dim"
              size="sm"
              className="absolute top-1/2 -end-0 -translate-y-1/2"
              onClick={handleReset}
            >
              <X />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d);
            onChange?.(d);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Default export keeps demo behavior for quick usage
export default function DatePickerDemo() {
  const [date, setDate] = React.useState<Date | undefined>();
  return <DatePicker value={date} onChange={setDate} />;
}
