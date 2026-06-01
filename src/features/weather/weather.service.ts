import { fetchWeatherApi } from "openmeteo";
import type { Coordinates } from "../../db/schema";

export interface WeatherDailyRow {
  date: string;
  tempMax: string | null;
  tempMin: string | null;
  tempMean: string | null;
  precipitationSum: string | null;
  weatherCode: number | null;
  windSpeedMax: string | null;
  cloudCoverMin: string | null;
  cloudCoverMax: string | null;
  cloudCoverMean: string | null;
}

const WEATHER_URL = "https://archive-api.open-meteo.com/v1/archive";

function toFixedOrNull(
  value: number | null | undefined,
  decimals: number,
): string | null {
  if (value == null || isNaN(value)) return null;
  return value.toFixed(decimals);
}

export async function fetchWeatherForLocation(
  coordinates: Coordinates,
  startDate: string,
  endDate: string,
): Promise<WeatherDailyRow[]> {
  const params = {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    start_date: startDate,
    end_date: endDate,
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "temperature_2m_mean",
      "precipitation_sum",
      "weather_code",
      "wind_speed_10m_max",
    ],
    hourly: ["cloud_cover"],
    timezone: "auto",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
  };

  const responses = await fetchWeatherApi(WEATHER_URL, params);
  const response = responses[0];
  const utcOffsetSeconds = response.utcOffsetSeconds();
  const daily = response.daily()!;
  const hourly = response.hourly()!;

  // Build per-day cloud cover arrays from hourly data
  const cloudCoverValues = hourly.variables(0)!.valuesArray()!;
  const cloudCoverByDate = new Map<string, number[]>();
  const hourlyCount =
    (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval();
  for (let i = 0; i < hourlyCount; i++) {
    const ts = Number(hourly.time()) + i * hourly.interval();
    const date = new Date((ts + utcOffsetSeconds) * 1000)
      .toISOString()
      .slice(0, 10);
    const val = cloudCoverValues[i];
    if (val != null && !isNaN(val)) {
      if (!cloudCoverByDate.has(date)) cloudCoverByDate.set(date, []);
      cloudCoverByDate.get(date)!.push(val);
    }
  }

  const tempMaxValues = daily.variables(0)!.valuesArray()!;
  const tempMinValues = daily.variables(1)!.valuesArray()!;
  const tempMeanValues = daily.variables(2)!.valuesArray()!;
  const precipValues = daily.variables(3)!.valuesArray()!;
  const weatherCodeValues = daily.variables(4)!.valuesArray()!;
  const windSpeedMaxValues = daily.variables(5)!.valuesArray()!;

  const numDays =
    (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval();

  const rows: WeatherDailyRow[] = [];
  for (let i = 0; i < numDays; i++) {
    const ts = Number(daily.time()) + i * daily.interval();
    const date = new Date((ts + utcOffsetSeconds) * 1000)
      .toISOString()
      .slice(0, 10);

    const hourlyVals = cloudCoverByDate.get(date) ?? [];
    const cloudCoverMin = hourlyVals.length ? Math.min(...hourlyVals) : null;
    const cloudCoverMax = hourlyVals.length ? Math.max(...hourlyVals) : null;
    const cloudCoverMean = hourlyVals.length
      ? hourlyVals.reduce((a, b) => a + b, 0) / hourlyVals.length
      : null;

    const rawWeatherCode = weatherCodeValues[i];
    rows.push({
      date,
      tempMax: toFixedOrNull(tempMaxValues[i], 2),
      tempMin: toFixedOrNull(tempMinValues[i], 2),
      tempMean: toFixedOrNull(tempMeanValues[i], 2),
      precipitationSum: toFixedOrNull(precipValues[i], 3),
      weatherCode:
        rawWeatherCode != null && !isNaN(rawWeatherCode)
          ? Math.round(rawWeatherCode)
          : null,
      windSpeedMax: toFixedOrNull(windSpeedMaxValues[i], 2),
      cloudCoverMin: toFixedOrNull(cloudCoverMin, 2),
      cloudCoverMax: toFixedOrNull(cloudCoverMax, 2),
      cloudCoverMean: toFixedOrNull(cloudCoverMean, 2),
    });
  }

  return rows;
}
