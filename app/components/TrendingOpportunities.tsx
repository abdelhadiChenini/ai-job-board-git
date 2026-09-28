"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import OpportunityCarousel, {
  type OpportunityCarouselItem,
} from "@/components/OpportunityCarousel";

type TrendingOpportunitiesProps = {
  title: string;
  initialOpportunities: OpportunityCarouselItem[];
};

export function TrendingOpportunities({
  title,
  initialOpportunities,
}: TrendingOpportunitiesProps) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const company = searchParams.get("company")?.trim() ?? "";
  const location = searchParams.get("location")?.trim() ?? "";
  const isFiltered = Boolean(q || category || company || location);

  const initialRef = useRef(initialOpportunities);
  const [opportunities, setOpportunities] =
    useState<OpportunityCarouselItem[]>(initialRef.current);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isFiltered) {
      setOpportunities(initialRef.current);
      return;
    }

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (company) params.set("company", company);
    if (location) params.set("location", location);

    let cancelled = false;
    setIsPending(true);

    fetch(`/api/opportunities/trending?${params.toString()}`)
      .then((response) =>
        response.ok
          ? response.json()
          : { opportunities: [] as OpportunityCarouselItem[] },
      )
      .then((data: { opportunities?: OpportunityCarouselItem[] }) => {
        if (!cancelled) {
          setOpportunities(data.opportunities ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOpportunities([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [q, category, company, location, isFiltered]);

  return (
    <div
      className="mt-16 transition-opacity duration-200"
      aria-busy={isPending}
      style={isPending ? { opacity: 0.5 } : undefined}
    >
      <OpportunityCarousel title={title} opportunities={opportunities} />
    </div>
  );
}

export default TrendingOpportunities;
