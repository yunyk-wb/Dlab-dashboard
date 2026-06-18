import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { DailyMetric } from "#/lib/api"
import { formatCurrency, formatNumber } from "#/lib/utils"

export function TrendChart({ data }: { data: DailyMetric[] }) {
  return (
    <div className="island-shell rise-in rounded-xl p-5" style={{ animationDelay: "250ms" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--sea-ink)]">일별 트렌드</h2>
        <div className="flex items-center gap-4 text-xs text-[var(--sea-ink-soft)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> 광고비
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-500" /> 클릭수
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 24 }}>
          <defs>
            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--sea-ink-soft)" }}
            tickFormatter={(v: string) => v.slice(5).replace("-", "/")}
            dy={8}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--sea-ink-soft)" }}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--sea-ink-soft)" }}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-strong)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              padding: "8px 12px",
            }}
            formatter={(value, name) => {
              const v = Number(value)
              if (name === "spend") return [formatCurrency(v), "광고비"]
              if (name === "clicks") return [formatNumber(v), "클릭수"]
              return [formatNumber(v), String(name)]
            }}
            labelFormatter={(label) => String(label)}
            cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="spend"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorSpend)"
            name="spend"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "var(--surface-strong)", stroke: "#3b82f6" }}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="clicks"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#colorClicks)"
            name="clicks"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#8b5cf6" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
