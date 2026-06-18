"""
Stage 1 — Mock 데이터만 사용하는 최소 버전.

- DuckDB, Meta SDK 없음.
- 서버 메모리에서 고정된 mock 데이터를 그대로 반환.
"""

import random
from datetime import datetime, timedelta

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class Campaign(BaseModel):
    id: str
    name: str
    status: str
    objective: str
    daily_budget: float | None = None
    lifetime_budget: float | None = None


class DailyMetric(BaseModel):
    date: str
    impressions: int
    clicks: int
    spend: float


class CampaignMetric(BaseModel):
    campaign_id: str
    campaign_name: str
    impressions: int
    clicks: int
    spend: float
    ctr: float
    cpc: float


class MetricsSummary(BaseModel):
    impressions: int
    clicks: int
    spend: float
    ctr: float
    cpc: float


class MetricsResponse(BaseModel):
    summary: MetricsSummary
    daily: list[DailyMetric]
    campaigns: list[CampaignMetric]


CAMPAIGNS: list[Campaign] = [
    Campaign(id="camp_1", name="브랜드 인지도 캠페인", status="ACTIVE", objective="BRAND_AWARENESS", daily_budget=50000),
    Campaign(id="camp_2", name="전환 캠페인 - 봄 시즌", status="ACTIVE", objective="CONVERSIONS", daily_budget=100000),
    Campaign(id="camp_3", name="리타겟팅 캠페인", status="ACTIVE", objective="CONVERSIONS", daily_budget=80000),
    Campaign(id="camp_4", name="동영상 조회 캠페인", status="PAUSED", objective="VIDEO_VIEWS", daily_budget=30000),
    Campaign(id="camp_5", name="앱 설치 캠페인", status="ACTIVE", objective="APP_INSTALLS", daily_budget=60000),
]


def _generate_daily_rows(since: str, until: str, campaign_id: str | None) -> list[tuple]:
    start = datetime.strptime(since, "%Y-%m-%d").date()
    end = datetime.strptime(until, "%Y-%m-%d").date()
    targets = [c for c in CAMPAIGNS if campaign_id is None or c.id == campaign_id]

    rows: list[tuple] = []
    for c in targets:
        budget_factor = (c.daily_budget or 50000) / 100000
        random.seed(hash(c.id))
        days = (end - start).days + 1
        for i in range(days):
            date = start + timedelta(days=i)
            impressions = int(random.randint(8000, 25000) * budget_factor)
            clicks = int(random.randint(200, 1200) * budget_factor)
            spend = round(random.uniform((c.daily_budget or 0) * 0.6, (c.daily_budget or 0) * 1.2), 0)
            rows.append((c.id, c.name, date.isoformat(), impressions, clicks, spend))
    return rows


app = FastAPI(title="Stage 1 — Mock Dashboard API")
import os

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    *[o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()],
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "stage": 1, "source": "mock"}


@app.get("/api/campaigns", response_model=list[Campaign])
async def list_campaigns():
    return CAMPAIGNS


@app.get("/api/metrics", response_model=MetricsResponse)
async def get_metrics(
    since: str = Query(default_factory=lambda: (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")),
    until: str = Query(default_factory=lambda: datetime.now().strftime("%Y-%m-%d")),
    campaign_id: str | None = Query(default=None),
):
    rows = _generate_daily_rows(since, until, campaign_id)

    by_date: dict[str, dict] = {}
    for _, _, date, imp, clk, sp in rows:
        d = by_date.setdefault(date, {"impressions": 0, "clicks": 0, "spend": 0.0})
        d["impressions"] += imp
        d["clicks"] += clk
        d["spend"] += sp
    daily = [DailyMetric(date=k, **v) for k, v in sorted(by_date.items())]

    by_camp: dict[str, dict] = {}
    for cid, cname, _, imp, clk, sp in rows:
        c = by_camp.setdefault(cid, {"name": cname, "impressions": 0, "clicks": 0, "spend": 0.0})
        c["impressions"] += imp
        c["clicks"] += clk
        c["spend"] += sp

    campaign_metrics = [
        CampaignMetric(
            campaign_id=cid,
            campaign_name=v["name"],
            impressions=v["impressions"],
            clicks=v["clicks"],
            spend=v["spend"],
            ctr=round(v["clicks"] / v["impressions"] * 100, 2) if v["impressions"] else 0,
            cpc=round(v["spend"] / v["clicks"], 0) if v["clicks"] else 0,
        )
        for cid, v in by_camp.items()
    ]

    total_imp = sum(d.impressions for d in daily)
    total_clk = sum(d.clicks for d in daily)
    total_sp = sum(d.spend for d in daily)

    summary = MetricsSummary(
        impressions=total_imp,
        clicks=total_clk,
        spend=round(total_sp, 0),
        ctr=round(total_clk / total_imp * 100, 2) if total_imp else 0,
        cpc=round(total_sp / total_clk, 0) if total_clk else 0,
    )
    return MetricsResponse(summary=summary, daily=daily, campaigns=campaign_metrics)
