import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"
import { fetchMetrics, type MetricsResponse } from "#/lib/api"
import { KpiCards } from "#/components/KpiCards"
import { TrendChart } from "#/components/TrendChart"
import { CampaignTable } from "#/components/CampaignTable"
import { DateRangePicker } from "#/components/DateRangePicker"
import { BarChart3, Loader2 } from "lucide-react"

function getDefaultDates() {
  const now = new Date()
  const until = now.toISOString().slice(0, 10)
  const since = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return { since, until }
}

export const Route = createFileRoute("/")({
  component: Dashboard,
})

function Dashboard() {
  const defaults = getDefaultDates()
  const [since, setSince] = useState(defaults.since)
  const [until, setUntil] = useState(defaults.until)
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (s: string, u: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchMetrics(s, u)
      setData(result)
    } catch (e) {
      setError("데이터를 불러오는 데 실패했습니다. 백엔드 서버를 확인해주세요.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(since, until)
  }, [since, until, loadData])

  const handleDateChange = (newSince: string, newUntil: string) => {
    setSince(newSince)
    setUntil(newUntil)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
        <div className="page-wrap flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[var(--sea-ink)]">Wisebirds</span>
            <span className="hidden rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 sm:inline">Meta Ads</span>
          </div>
          <DateRangePicker since={since} until={until} onChange={handleDateChange} />
        </div>
      </header>

      {/* Content */}
      <main className="page-wrap px-4 pb-10 pt-6">
        <div className="mb-5">
          <h2 className="display-title text-lg font-bold text-[var(--sea-ink)] sm:text-xl">광고 성과 대시보드</h2>
          <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
            {since.replace(/-/g, ".")} — {until.replace(/-/g, ".")}
          </p>
        </div>

        {error && (
          <div className="rise-in mb-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--sea-ink-soft)]">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs font-medium">데이터를 불러오는 중...</span>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <KpiCards summary={data.summary} />
            <TrendChart data={data.daily} />
            <CampaignTable campaigns={data.campaigns} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-4 text-center text-[11px] text-[var(--sea-ink-soft)]">
        Wisebirds &middot; Meta Marketing API Dashboard
      </footer>
    </div>
  )
}
