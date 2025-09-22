"use client";

import { useState } from "react";
import { Calendar } from "~/components/ui/calendar";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { format, startOfDay, endOfDay, startOfYesterday, endOfYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

const presets = [
  {
    label: "Today",
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date())
    })
  },
  {
    label: "Yesterday",
    getValue: () => ({
      from: startOfYesterday(),
      to: endOfYesterday()
    })
  },
  {
    label: "This Week",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 })
    })
  },
  {
    label: "This Month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    })
  }
];

// Generate hour options
const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0') + ':00'
);

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(value);
  const [fromTime, setFromTime] = useState("00:00");
  const [toTime, setToTime] = useState("23:59");

  const handlePresetSelect = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    setTempRange(range);
    setFromTime("00:00");
    setToTime("23:59");
  };

  const handleApply = () => {
    if (tempRange) {
      // Combine date with time
      const [fromHour, fromMinute] = fromTime.split(':').map(Number);
      const [toHour, toMinute] = toTime.split(':').map(Number);

      const fromDateTime = new Date(tempRange.from);
      fromDateTime.setHours(fromHour, fromMinute, 0, 0);

      const toDateTime = new Date(tempRange.to);
      toDateTime.setHours(toHour, toMinute, 59, 999);

      onChange?.({
        from: fromDateTime,
        to: toDateTime
      });
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(value);
    setIsOpen(false);
  };

  const formatDateRange = (range: DateRange) => {
    if (range.from && range.to) {
      if (format(range.from, 'yyyy-MM-dd') === format(range.to, 'yyyy-MM-dd')) {
        return format(range.from, 'MMM dd, yyyy');
      }
      return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
    }
    return placeholder;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[280px]",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateRange(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Preset Options */}
          <div className="border-r bg-muted/30 p-3 space-y-1 min-w-[120px]">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm h-8"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar and Time Selection */}
          <div className="p-3 space-y-3">
            <Calendar
              mode="range"
              selected={tempRange ? { from: tempRange.from, to: tempRange.to } : undefined}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setTempRange({ from: range.from, to: range.to });
                } else if (range?.from) {
                  setTempRange({ from: range.from, to: range.from });
                }
              }}
              numberOfMonths={1}
              className="rounded-md border-0"
            />

            {/* Time Selection */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-[40px]">From</span>
                <div className="text-sm text-muted-foreground">
                  {tempRange?.from ? format(tempRange.from, 'MMM dd, yyyy') : 'Select date'}
                </div>
                <Select value={fromTime} onValueChange={setFromTime}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-[40px]">To</span>
                <div className="text-sm text-muted-foreground">
                  {tempRange?.to ? format(tempRange.to, 'MMM dd, yyyy') : 'Select date'}
                </div>
                <Select value={toTime} onValueChange={setToTime}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Apply/Cancel Buttons */}
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApply} disabled={!tempRange}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}