import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Building } from "@/types/building";
import BuildingSelector from "@/components/BuildingSelector";
import DateRangePicker from "@/components/DateRangePicker";
import ConsumptionChart from "@/components/ConsumptionChart";
import PredictionForm from "@/components/PredictionForm";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// API call function to fetch metrics from the backend
const fetchMetrics = async (building: Building, startDate: string, endDate: string) => {
  try {
    console.log(`Fetching metrics for ${building.name} from ${startDate} to ${endDate}`);
    const url = `http://localhost:5001/metrics?building=${encodeURIComponent(building.name)}&start_date=${startDate}&end_date=${endDate}`;
    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch metrics');
    }
    
    // Validate the response data
    if (!data.total_consumption || !data.peak_demand || !data.peak_hour) {
      throw new Error('Invalid response format from server');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    throw error;
  }
};

const Index = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

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
  } | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);
  const [metricsError, setMetricsError] = useState<string>("");

  // Fetch metrics when selectedBuilding or dateRange changes
  useEffect(() => {
    const fetchData = async () => {
      if (selectedBuilding && dateRange.from && dateRange.to) {
        try {
          setLoadingMetrics(true);
          setMetricsError("");
          
          const startDate = format(dateRange.from, "yyyy-MM-dd");
          const endDate = format(dateRange.to, "yyyy-MM-dd");
          
          console.log('Starting fetch for:', {
            building: selectedBuilding.name,
            startDate,
            endDate
          });
          
          const data = await fetchMetrics(selectedBuilding, startDate, endDate);
          
          console.log('Successfully fetched metrics:', data);
          setMetrics(data);
          setMetricsError("");
        } catch (err) {
          console.error('Error in fetch effect:', err);
          setMetricsError(err instanceof Error ? err.message : "Failed to fetch metrics");
          setMetrics(null);
        } finally {
          setLoadingMetrics(false);
        }
      } else {
        console.log('No building or date range selected');
        setMetrics(null);
        setMetricsError("");
      }
    };

    fetchData();
  }, [selectedBuilding, dateRange]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
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
        <div className="flex items-center gap-4">
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
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-2 hover:bg-transparent"
          >
            <span className="text-sm font-medium">Logout</span>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Display error message if fetching metrics fails */}
      {metricsError && (
        <div className="text-red-500 bg-red-100 p-4 rounded-md">
          Error fetching metrics: {metricsError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">Total Consumption</h3>
          <div className="text-3xl font-bold text-primary">
            {loadingMetrics ? (
              "Loading..."
            ) : metrics ? (
              `${(metrics.total_consumption / 1000).toFixed(2)} MWh`
            ) : (
              "No data"
            )}
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
            {loadingMetrics ? (
              "Loading..."
            ) : metrics ? (
              `${metrics.peak_demand.toFixed(1)} kW`
            ) : (
              "No data"
            )}
          </div>
          <p className="text-muted-foreground">Highest in selected period</p>
        </Card>
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">Peak Hours</h3>
          <div className="text-3xl font-bold text-amber-500">
            {loadingMetrics ? (
              "Loading..."
            ) : metrics ? (
              metrics.peak_hour
            ) : (
              "No data"
            )}
          </div>
          <p className="text-muted-foreground">
            {selectedBuilding ? "Building peak time" : "Community peak time"}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Consumption Trends</h3>
          <ConsumptionChart dateRange={dateRange} buildingId={selectedBuilding?.id} />
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
