
// import { useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Building } from "@/types/building";
// import BuildingSelector from "@/components/BuildingSelector";
// import DateRangePicker from "@/components/DateRangePicker";
// import ConsumptionChart from "@/components/ConsumptionChart";
// import PredictionForm from "@/components/PredictionForm";
// import { format } from "date-fns";
// import { DateRange } from "react-day-picker";

// const Index = () => {
//   const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
//   const [dateRange, setDateRange] = useState<DateRange>({
//     from: new Date(new Date().setDate(new Date().getDate() - 7)),
//     to: new Date(),
//   });

//   return (
//     <div className="min-h-screen p-6 space-y-6">
//       <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">
//             {selectedBuilding 
//               ? `${selectedBuilding.name} Dashboard`
//               : "Energy Consumption Dashboard"}
//           </h1>
//           <p className="text-muted-foreground">
//             {selectedBuilding
//               ? `Monitor and analyze energy usage for ${selectedBuilding.name}`
//               : "Monitor and analyze energy usage across buildings"}
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
//           <BuildingSelector
//             value={selectedBuilding}
//             onChange={setSelectedBuilding}
//           />
//           <DateRangePicker
//             value={dateRange}
//             onChange={(range) => {
//               if (range) setDateRange(range);
//             }}
//           />
//         </div>
//       </header>

//       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//         <Card className="glass-card p-6">
//           <h3 className="text-lg font-semibold mb-2">Total Consumption</h3>
//           <div className="text-3xl font-bold text-primary">
//             {selectedBuilding ? "456.78 kWh" : "2,345.67 kWh"}
//           </div>
//           <p className="text-muted-foreground">
//             {format(dateRange.from || new Date(), "MMM d")} -{" "}
//             {format(dateRange.to || new Date(), "MMM d")}
//           </p>
//         </Card>
//         <Card className="glass-card p-6">
//           <h3 className="text-lg font-semibold mb-2">Peak Demand</h3>
//           <div className="text-3xl font-bold text-destructive">78.9 kW</div>
//           <p className="text-muted-foreground">Highest in last 24 hours</p>
//         </Card>
//         <Card className="glass-card p-6">
//           <h3 className="text-lg font-semibold mb-2">Peak Hours</h3>
//           <div className="text-3xl font-bold text-amber-500">
//             {selectedBuilding ? "2 PM - 4 PM" : "1 PM - 5 PM"}
//           </div>
//           <p className="text-muted-foreground">
//             {selectedBuilding ? "Building peak time" : "Community peak time"}
//           </p>
//         </Card>
//       </div>

//       <div className="grid gap-6 lg:grid-cols-2">
//         <Card className="glass-card p-6">
//           <h3 className="text-lg font-semibold mb-4">Consumption Trends</h3>
//           <ConsumptionChart dateRange={dateRange} buildingId={selectedBuilding?.id} />
//         </Card>
//         {!selectedBuilding && (
//           <Card className="glass-card p-6">
//             <h3 className="text-lg font-semibold mb-4">Consumption Prediction</h3>
//             <PredictionForm />
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Index;



import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Building } from "@/types/building";
import BuildingSelector from "@/components/BuildingSelector";
import DateRangePicker from "@/components/DateRangePicker";
import ConsumptionChart from "@/components/ConsumptionChart";
import PredictionForm from "@/components/PredictionForm";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// API call function to fetch metrics from the backend
const fetchMetrics = async (building: string, startDate: string, endDate: string) => {
  const response = await fetch(
    `http://localhost:5001/metrics?building=${building}&start_date=${startDate}&end_date=${endDate}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch metrics");
  }
  return await response.json();
};

const Index = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  // State variables for fetched metrics
  const [metrics, setMetrics] = useState<{
    total_consumption: number;
    peak_demand: number;
    peak_hour: string;
    average_consumption: number;
    trend_graph: string;
  } | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);
  const [metricsError, setMetricsError] = useState<string>("");

  // Fetch metrics when selectedBuilding or dateRange changes
  useEffect(() => {
    if (selectedBuilding && dateRange.from && dateRange.to) {
      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate = format(dateRange.to, "yyyy-MM-dd");
      setLoadingMetrics(true);
      setMetricsError("");
      fetchMetrics(selectedBuilding.name, startDate, endDate)
        .then((data) => {
          setMetrics(data);
          setLoadingMetrics(false);
        })
        .catch((err) => {
          console.error("Error fetching metrics:", err);
          setMetricsError(err.message);
          setLoadingMetrics(false);
        });
    }
  }, [selectedBuilding, dateRange]);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {selectedBuilding 
              ? `${selectedBuilding.name} Dashboard`
              : "Energy Consumption Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {selectedBuilding
              ? `Monitor and analyze energy usage for ${selectedBuilding.name}`
              : "Monitor and analyze energy usage across buildings"}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <BuildingSelector
            value={selectedBuilding}
            onChange={setSelectedBuilding}
          />
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              if (range) setDateRange(range);
            }}
          />
        </div>
      </header>

      {/* Display error message if fetching metrics fails */}
      {metricsError && (
        <div className="text-red-500">
          Error fetching metrics: {metricsError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">Total Consumption</h3>
          <div className="text-3xl font-bold text-primary">
            {loadingMetrics
              ? "Loading..."
              : metrics
              ? `${metrics.total_consumption.toFixed(2)} kWh`
              : selectedBuilding
              ? "No data"
              : "2,345.67 kWh"}
          </div>
          <p className="text-muted-foreground">
            {dateRange.from && dateRange.to
              ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
              : ""}
          </p>
        </Card>
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">Peak Demand</h3>
          <div className="text-3xl font-bold text-destructive">
            {loadingMetrics
              ? "Loading..."
              : metrics
              ? `${metrics.peak_demand.toFixed(1)} kW`
              : "78.9 kW"}
          </div>
          <p className="text-muted-foreground">Highest in last 24 hours</p>
        </Card>
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">Peak Hours</h3>
          <div className="text-3xl font-bold text-amber-500">
            {loadingMetrics
              ? "Loading..."
              : metrics
              ? metrics.peak_hour
              : selectedBuilding
              ? "2 PM - 4 PM"
              : "1 PM - 5 PM"}
          </div>
          <p className="text-muted-foreground">
            {selectedBuilding ? "Building peak time" : "Community peak time"}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Consumption Trends</h3>
          {loadingMetrics ? (
            <p>Loading...</p>
          ) : metrics && metrics.trend_graph ? (
            <img
              id="trendGraph"
              src={`data:image/png;base64,${metrics.trend_graph}`}
              alt="Consumption Trend Graph"
              style={{ maxWidth: "600px" }}
            />
          ) : (
            <ConsumptionChart dateRange={dateRange} buildingId={selectedBuilding?.id} />
          )}
        </Card>
        {!selectedBuilding && (
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Consumption Prediction</h3>
            <PredictionForm />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
