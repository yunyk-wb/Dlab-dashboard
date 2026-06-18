import { Banknote, Eye, MousePointerClick, PercentIcon, Target } from "lucide-react"
import type { MetricsSummary } from "#/lib/api"
import { formatCurrency, formatNumber, formatPct } from "#/lib/utils"

interface KpiCardProps {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
}

function KpiCard({ label, value, icon, iconBg }: KpiCardProps) {
  return (
    <div className="island-shell rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <p className="text-[11px] font-medium tracking-wide text-[var(--sea-ink-soft)]">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-[var(--sea-ink)]">{value}</p>
    </div>
  )
}

export function KpiCards({ summary }: { summary: MetricsSummary }) {
  const cards: KpiCardProps[] = [
    { label: "광고비", value: formatCurrency(summary.spend), icon: <Banknote className="h-4 w-4 text-blue-300" />, iconBg: "bg-blue-500/15" },
    { label: "노출수", value: formatNumber(summary.impressions), icon: <Eye className="h-4 w-4 text-violet-300" />, iconBg: "bg-violet-500/15" },
    { label: "클릭수", value: formatNumber(summary.clicks), icon: <MousePointerClick className="h-4 w-4 text-emerald-300" />, iconBg: "bg-emerald-500/15" },
    { label: "CTR", value: formatPct(summary.ctr), icon: <PercentIcon className="h-4 w-4 text-amber-300" />, iconBg: "bg-amber-500/15" },
    { label: "CPC", value: formatCurrency(summary.cpc), icon: <Target className="h-4 w-4 text-rose-300" />, iconBg: "bg-rose-500/15" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, i) => (
        <div key={card.label} className="rise-in" style={{ animationDelay: `${i * 50}ms` }}>
          <KpiCard {...card} />
        </div>
      ))}
    </div>
  )
}
