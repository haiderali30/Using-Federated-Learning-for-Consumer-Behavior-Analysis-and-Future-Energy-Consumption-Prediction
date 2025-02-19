
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  hoursAhead: z.coerce.number(),
  outdoorTemp: z.coerce.number(),
  humidity: z.coerce.number(),
  cloudCover: z.coerce.number(),
  occupancy: z.coerce.number(),
  specialEquipment: z.coerce.number(),
  lightning: z.coerce.number(),
  hvac: z.coerce.number(),
  season: z.string(),
});

const PredictionForm = () => {
  const { toast } = useToast();
  const [prediction, setPrediction] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hoursAhead: 24,
      outdoorTemp: 25,
      humidity: 60,
      cloudCover: 30,
      occupancy: 100,
      specialEquipment: 50,
      lightning: 20,
      hvac: 100,
      season: "summer",
    },
  });

  const getSeasonBooleans = (season: string) => {
    return {
      Winter: season === "winter" ? 1 : 0,
      Spring: season === "spring" ? 1 : 0,
      Summer: season === "summer" ? 1 : 0,
      Fall: season === "autumn" ? 1 : 0,
    };
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const seasonBooleans = getSeasonBooleans(values.season);
      
      const payload = {
        hours_ahead: values.hoursAhead,
        user_inputs: {
          ...seasonBooleans,
          "Outdoor Temp (°C)": values.outdoorTemp,
          "Humidity (%)": values.humidity,
          "Cloud Cover (%)": values.cloudCover,
          "Occupancy": values.occupancy,
          "Special Equipment [kW]": values.specialEquipment,
          "Lighting [kW]": values.lightning,
          "HVAC [kW]": values.hvac,
        },
      };

      console.log("Sending prediction request:", payload);

      const response = await fetch("http://localhost:5001/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();
      console.log("Prediction response:", data);
      
      setPrediction(data.predicted_consumption);
      toast({
        title: "Prediction Generated",
        description: `Predicted consumption: ${data.predicted_consumption.toFixed(2)} kWh`,
      });
    } catch (error) {
      console.error("Prediction error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate prediction. Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="hoursAhead"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours Ahead</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="24" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="outdoorTemp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outdoor Temp (°C)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="humidity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Humidity (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="60" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cloudCover"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cloud Cover (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="occupancy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupancy</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="specialEquipment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Equipment (kW)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lightning"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lighting (kW)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hvac"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HVAC (kW)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="season"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Season</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="autumn">Autumn</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Generate Prediction
        </Button>
        
        {prediction !== null && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <h4 className="font-semibold">Predicted Consumption</h4>
            <p className="text-2xl font-bold text-primary">
              {prediction.toFixed(2)} kWh
            </p>
          </div>
        )}
      </form>
    </Form>
  );
};

export default PredictionForm;
