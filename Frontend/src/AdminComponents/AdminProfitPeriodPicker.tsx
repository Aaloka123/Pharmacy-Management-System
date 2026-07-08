import { useEffect, useMemo, useRef, useState } from 'react'
import { LuCalendarDays, LuChevronDown, LuHistory } from 'react-icons/lu'
import {
  buildAdminProfitPeriodGroups,
  type AdminProfitPeriodOption,
} from '../lib/adminProfitApi'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const MONTH_SHORT_DESC = [...MONTH_SHORT].reverse()

type AdminProfitPeriodPickerProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

const periodGroups = buildAdminProfitPeriodGroups(12)

const allOptions: AdminProfitPeriodOption[] = [
  periodGroups.allHistory,
  ...periodGroups.years.flatMap((yearGroup) => yearGroup.months),
]

const AdminProfitPeriodPicker = ({ value, onChange, className = '' }: AdminProfitPeriodPickerProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const selectedOption = useMemo(
    () => allOptions.find((option) => option.value === value) ?? periodGroups.allHistory,
    [value],
  )

  const isAllHistory = value === periodGroups.allHistory.value

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <LuCalendarDays aria-hidden className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Period</span>
          <span className="block truncate text-sm font-semibold text-slate-800">{selectedOption.label}</span>
        </span>
        <LuChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          role="dialog"
          aria-label="Select profit period"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Select period</p>
            <p className="mt-0.5 text-xs text-slate-500">View profit by month or across all sales</p>
          </div>

          <div className="max-h-[min(24rem,70vh)] overflow-y-auto p-3">
            <button
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                isAllHistory
                  ? 'border-teal-300 bg-teal-50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:border-teal-200 hover:bg-teal-50/60'
              }`}
              onClick={() => handleSelect(periodGroups.allHistory.value)}
              type="button"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isAllHistory ? 'bg-teal-600 text-white' : 'bg-white text-teal-700'
                }`}
              >
                <LuHistory aria-hidden className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">{periodGroups.allHistory.label}</span>
                <span className="block text-xs text-slate-500">Every product sold, all time</span>
              </span>
            </button>

            {periodGroups.years.map((yearGroup) => {
              const availableMonths = new Map(yearGroup.months.map((month) => [month.month, month]))

              return (
                <div className="mt-4" key={yearGroup.year}>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{yearGroup.year}</p>
                    <span className="text-[10px] font-medium text-slate-400">Tap a month</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MONTH_SHORT_DESC.map((shortLabel, index) => {
                      const month = 12 - index
                      const option = availableMonths.get(month)
                      const isSelected = option?.value === value
                      const isCurrent = option?.isCurrent ?? false
                      const isDisabled = !option

                      return (
                        <button
                          aria-disabled={isDisabled}
                          aria-pressed={isSelected}
                          className={`relative flex flex-col items-center justify-center rounded-lg border px-1 py-2 text-center transition ${
                            isDisabled
                              ? 'cursor-not-allowed border-transparent bg-slate-50 text-slate-300'
                              : isSelected
                                ? 'border-teal-500 bg-teal-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50'
                          }`}
                          disabled={isDisabled}
                          key={`${yearGroup.year}-${month}`}
                          onClick={() => option && handleSelect(option.value)}
                          type="button"
                        >
                          <span className="text-[11px] font-semibold">{shortLabel}</span>
                          {isCurrent && !isSelected ? (
                            <span className="mt-0.5 rounded-full bg-teal-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-teal-700">
                              Now
                            </span>
                          ) : null}
                          {isCurrent && isSelected ? (
                            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-teal-100">
                              Now
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminProfitPeriodPicker
