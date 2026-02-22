declare module "cal-heatmap" {
  type DataRecord = Record<string, string | number>;

  interface CalHeatmapOptions {
    itemSelector?: string;
    range?: number;
    domain?: {
      type?: "year" | "month" | "week" | "xDay" | "ghDay" | "day" | "hour" | "minute";
      gutter?: number;
      label?: {
        text?: string;
        position?: "top" | "right" | "bottom" | "left";
      };
    };
    subDomain?: {
      type?: string;
      width?: number;
      height?: number;
      gutter?: number;
      radius?: number;
    };
    date?: {
      start?: Date;
    };
    data?: {
      source?: DataRecord[];
      x?: string;
      y?: string;
      defaultValue?: number;
    };
    scale?: {
      color?: {
        type?: string;
        scheme?: string;
        range?: string[];
        domain?: number[];
      };
    };
  }

  export default class CalHeatmap {
    paint(options?: CalHeatmapOptions): Promise<unknown>;
    destroy(): Promise<unknown>;
  }
}
