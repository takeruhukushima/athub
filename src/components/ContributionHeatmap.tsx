"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import CalHeatmap from "cal-heatmap";

interface ContributionHeatmapProps {
  data: Array<{ date: string; count: number }>;
}

export function ContributionHeatmap({ data }: ContributionHeatmapProps) {
  const id = useId().replaceAll(":", "");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<CalHeatmap | null>(null);

  const sortedData = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();

    if (calendarRef.current) {
      void calendarRef.current.destroy();
      calendarRef.current = null;
    }
    if (sortedData.length === 0) return;

    const containerId = `contribution-heatmap-${id}`;
    const startDate = new Date(`${sortedData[0].date}T00:00:00.000Z`);
    const monthRange = Math.max(
      1,
      new Set(sortedData.map((item) => item.date.slice(0, 7))).size,
    );
    const calendar = new CalHeatmap();
    calendarRef.current = calendar;
    let disposed = false;

    void calendar.paint({
      itemSelector: `#${containerId}`,
      range: monthRange,
      domain: {
        type: "month",
        gutter: 8,
        label: { position: "top", text: "MMM" },
      },
      subDomain: {
        type: "ghDay",
        width: 10,
        height: 10,
        gutter: 2,
        radius: 2,
      },
      date: { start: startDate },
      data: {
        source: sortedData,
        x: "date",
        y: "count",
        defaultValue: 0,
      },
      scale: {
        color: {
          type: "threshold",
          range: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
          domain: [1, 3, 6, 10],
        },
      },
    });

    return () => {
      disposed = true;
      if (calendarRef.current === calendar) {
        calendarRef.current = null;
      }
      void calendar.destroy();
      if (disposed) {
        container.replaceChildren();
      }
    };
  }, [id, sortedData]);

  if (sortedData.length === 0) {
    return <p className="text-sm text-stone-500">No contributions in this period.</p>;
  }

  return (
    <div className="space-y-2">
      <div
        id={`contribution-heatmap-${id}`}
        ref={containerRef}
        className="overflow-x-auto [&_.ch-domain-text]:fill-stone-500 [&_.ch-domain-text]:text-[10px]"
      />
      <div className="flex items-center justify-end gap-2 text-xs text-stone-500">
        <span>Less</span>
        <span className="h-2.5 w-2.5 rounded-[2px] bg-[#ebedf0]" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-[#9be9a8]" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-[#40c463]" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-[#30a14e]" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-[#216e39]" />
        <span>More</span>
      </div>
    </div>
  );
}
