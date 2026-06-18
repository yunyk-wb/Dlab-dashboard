import { CalendarDays } from "lucide-react"

interface DateRangePickerProps {
  since: string
  until: string
  onChange: (since: string, until: string) => void
}

export function DateRangePicker({ since, until, onChange }: DateRangePickerProps) {
  return (
    <div className="island-shell flex items-center gap-2 rounded-xl px-3 py-2">
      <CalendarDays className="h-4 w-4 text-[var(--lagoon)]" />
      <input
        type="date"
        value={since}
        onChange={(e) => onChange(e.target.value, until)}
        className="border-0 bg-transparent px-1 py-0.5 text-sm font-medium text-[var(--sea-ink)] outline-none"
      />
      <span className="text-xs font-medium text-[var(--sea-ink-soft)]">~</span>
      <input
        type="date"
        value={until}
        onChange={(e) => onChange(since, e.target.value)}
        className="border-0 bg-transparent px-1 py-0.5 text-sm font-medium text-[var(--sea-ink)] outline-none"
      />
    </div>
  )
}
