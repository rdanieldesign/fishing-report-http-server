import { TRACKED_PARAMETER_CODES } from "./usgs.constants";

type TimeSlot =
  | "midnight"
  | "early_morning"
  | "morning"
  | "noon"
  | "afternoon"
  | "evening";

const TIME_SLOT_HOURS: Array<{ slot: TimeSlot; hour: number }> = [
  { slot: "midnight", hour: 0 },
  { slot: "early_morning", hour: 4 },
  { slot: "morning", hour: 8 },
  { slot: "noon", hour: 12 },
  { slot: "afternoon", hour: 16 },
  { slot: "evening", hour: 20 },
];

export interface UsgsReading {
  parameterCode: string;
  computationIdentifier: string;
  parameterName: string;
  value: string;
  unit: string;
  recordedAt: Date;
  timeSlot: TimeSlot;
}

interface UsgsFeatureCollection<T> {
  features?: T[];
}

interface MetadataFeature {
  properties: {
    parameter_code: string;
    parameter_name: string;
    computation_identifier: string;
    [key: string]: unknown;
  };
}

interface ContinuousFeature {
  id: string;
  properties: {
    parameter_code: string;
    computation_identifier: string;
    result?: string;
    value?: string;
    unit_of_measure?: string;
    units?: string;
    phenomenonTime?: string;
    resultTime?: string;
    time?: string;
    [key: string]: unknown;
  };
}

// Converts a local clock hour on a given date to the equivalent UTC Date.
// Uses the Intl offset trick: compute the UTC→local offset by formatting a
// reference UTC time in the target timezone, then invert it.
export function localHourToUTC(
  dateStr: string,
  hour: number,
  timezone: string,
): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  const approxUTC = new Date(`${dateStr}T${pad(hour)}:00:00Z`);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(approxUTC);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const h = get("hour") === "24" ? "00" : get("hour");
  const localAsUTC = new Date(
    `${get("year")}-${get("month")}-${get("day")}T${h}:00:00Z`,
  );

  const offsetMs = approxUTC.getTime() - localAsUTC.getTime();
  return new Date(approxUTC.getTime() + offsetMs);
}

function getFeatureTimestamp(feature: ContinuousFeature): Date | null {
  const raw =
    feature.properties.phenomenonTime ??
    feature.properties.resultTime ??
    feature.properties.time;
  if (!raw) return null;
  const d = new Date(raw as string);
  return isNaN(d.getTime()) ? null : d;
}

async function fetchMetadata(
  usgsLocationId: string,
): Promise<MetadataFeature[]> {
  const url = new URL(
    "https://api.waterdata.usgs.gov/ogcapi/v0/collections/time-series-metadata/items",
  );
  url.searchParams.set("monitoring_location_id", usgsLocationId);
  url.searchParams.set("f", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `USGS metadata API failed: ${response.status} ${response.statusText}`,
    );
  }

  const data =
    (await response.json()) as UsgsFeatureCollection<MetadataFeature>;
  return data.features ?? [];
}

async function fetchContinuousData(
  usgsLocationId: string,
  startUTC: Date,
  endUTC: Date,
  parameterCodes: string[],
): Promise<ContinuousFeature[]> {
  const url = new URL(
    "https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous/items",
  );
  url.searchParams.set("f", "json");
  url.searchParams.set("monitoring_location_id", usgsLocationId);
  url.searchParams.set("parameter_code", parameterCodes.join(","));
  url.searchParams.set(
    "datetime",
    `${startUTC.toISOString()}/${endUTC.toISOString()}`,
  );
  url.searchParams.set("limit", "10000");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `USGS continuous API failed: ${response.status} ${response.statusText}`,
    );
  }

  const data =
    (await response.json()) as UsgsFeatureCollection<ContinuousFeature>;
  return data.features ?? [];
}

export async function fetchUsgsReadings(
  usgsLocationId: string,
  date: string,
  timezone: string,
): Promise<UsgsReading[]> {
  const metadata = await fetchMetadata(usgsLocationId);

  const metadataByCode = new Map(
    metadata.map((f) => [
      f.properties.parameter_code,
      {
        parameterName: f.properties.parameter_name,
        computationIdentifier: f.properties.computation_identifier,
      },
    ]),
  );

  const trackedCodes = Array.from(metadataByCode.keys()).filter((code) =>
    TRACKED_PARAMETER_CODES.has(code),
  );

  if (trackedCodes.length === 0) {
    return [];
  }

  const startUTC = localHourToUTC(date, 0, timezone);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);

  const features = await fetchContinuousData(
    usgsLocationId,
    startUTC,
    endUTC,
    trackedCodes,
  );

  const featuresByCode = new Map<string, ContinuousFeature[]>();
  for (const feature of features) {
    const code = feature.properties.parameter_code;
    if (!featuresByCode.has(code)) featuresByCode.set(code, []);
    featuresByCode.get(code)!.push(feature);
  }

  const readings: UsgsReading[] = [];

  for (const { slot, hour } of TIME_SLOT_HOURS) {
    const targetMs = localHourToUTC(date, hour, timezone).getTime();

    for (const code of trackedCodes) {
      const candidates = featuresByCode.get(code) ?? [];
      if (candidates.length === 0) continue;

      const closest = candidates.reduce((best, curr) => {
        const currTs = getFeatureTimestamp(curr);
        const bestTs = getFeatureTimestamp(best);
        if (!currTs) return best;
        if (!bestTs) return curr;
        return Math.abs(currTs.getTime() - targetMs) <
          Math.abs(bestTs.getTime() - targetMs)
          ? curr
          : best;
      });

      const closestTs = getFeatureTimestamp(closest);
      if (!closestTs) continue;

      const meta = metadataByCode.get(code) ?? {
        parameterName: "",
        computationIdentifier: "",
      };

      readings.push({
        parameterCode: code,
        computationIdentifier: meta.computationIdentifier,
        parameterName: meta.parameterName,
        value: closest.properties.result ?? closest.properties.value ?? "",
        unit:
          closest.properties.unit_of_measure ?? closest.properties.units ?? "",
        recordedAt: closestTs,
        timeSlot: slot,
      });
    }
  }

  return readings;
}
