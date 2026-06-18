import { BarChart3 } from "lucide-react"
import type { CampaignMetric } from "#/lib/api"
import { formatCurrency, formatNumber, formatPct } from "#/lib/utils"

export function CampaignTable({ campaigns }: { campaigns: CampaignMetric[] }) {
  return (
    <div className="island-shell rise-in overflow-hidden rounded-2xl" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-6 py-4">
        <BarChart3 className="h-4.5 w-4.5 text-[var(--lagoon)]" />
        <h2 className="text-base font-bold text-[var(--sea-ink)]">캠페인별 성과</h2>
        <span className="ml-auto rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
          {campaigns.length}개
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface)] text-left text-[11px] font-bold uppercase tracking-widest text-[var(--sea-ink-soft)]">
              <th className="px-6 py-3">캠페인</th>
              <th className="px-4 py-3 text-right">노출수</th>
              <th className="px-4 py-3 text-right">클릭수</th>
              <th className="px-4 py-3 text-right">광고비</th>
              <th className="px-4 py-3 text-right">CTR</th>
              <th className="px-6 py-3 text-right">CPC</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr
                key={c.campaign_id}
                className="border-b border-[var(--line)] transition-colors last:border-0 hover:bg-[var(--surface)]"
              >
                <td className="px-6 py-3.5">
                  <span className="font-medium text-[var(--sea-ink)]">{c.campaign_name}</span>
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-[var(--sea-ink-soft)]">{formatNumber(c.impressions)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-[var(--sea-ink-soft)]">{formatNumber(c.clicks)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums font-medium text-[var(--sea-ink)]">{formatCurrency(c.spend)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-[var(--sea-ink-soft)]">{formatPct(c.ctr)}</td>
                <td className="px-6 py-3.5 text-right tabular-nums font-medium text-[var(--sea-ink)]">{formatCurrency(c.cpc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
