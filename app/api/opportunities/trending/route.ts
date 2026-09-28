import { NextResponse } from "next/server";
import { fetchTrendingOpportunities } from "@/lib/trendingOpportunities";

function readParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const opportunities = await fetchTrendingOpportunities({
    q: readParam(searchParams.get("q")),
    category: readParam(searchParams.get("category")),
    company: readParam(searchParams.get("company")),
    location: readParam(searchParams.get("location")),
  });

  return NextResponse.json({ opportunities });
}
