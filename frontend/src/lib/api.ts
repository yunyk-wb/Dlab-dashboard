const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

export interface Campaign {
  id: string
  name: string
  status: string
  objective: string
  daily_budget: number | null
  lifetime_budget: number | null
}

export interface DailyMetric {
  date: string
  impressions: number
  clicks: number
  spend: number
}

export interface CampaignMetric {
  campaign_id: string
  campaign_name: string
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
}

export interface MetricsSummary {
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpc: number
}

export interface MetricsResponse {
  summary: MetricsSummary
  daily: DailyMetric[]
  campaigns: CampaignMetric[]
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/campaigns`)
  if (!res.ok) throw new Error("Failed to fetch campaigns")
  return res.json()
}

export async function fetchMetrics(since: string, until: string, campaignId?: string): Promise<MetricsResponse> {
  const params = new URLSearchParams({ since, until })
  if (campaignId) params.set("campaign_id", campaignId)
  const res = await fetch(`${API_BASE}/metrics?${params}`)
  if (!res.ok) throw new Error("Failed to fetch metrics")
  return res.json()
}
