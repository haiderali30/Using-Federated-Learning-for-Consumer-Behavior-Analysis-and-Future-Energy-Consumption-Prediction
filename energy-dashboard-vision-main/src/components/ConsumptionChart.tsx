
import { DateRange } from "react-day-picker";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ConsumptionChartProps {
  dateRange: DateRange;
  buildingId?: string;
}

const ConsumptionChart = ({ dateRange, buildingId }: ConsumptionChartProps) => {
  // Mock data - replace with actual API call
  const data = [
    { time: "00:00", consumption: 45 },
    { time: "03:00", consumption: 38 },
    { time: "06:00", consumption: 42 },
    { time: "09:00", consumption: 78 },
    { time: "12:00", consumption: 89 },
    { time: "15:00", consumption: 84 },
    { time: "18:00", consumption: 92 },
    { time: "21:00", consumption: 68 },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="consumption" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
            }}
          />
          <Area
            type="monotone"
            dataKey="consumption"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#consumption)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConsumptionChart;
