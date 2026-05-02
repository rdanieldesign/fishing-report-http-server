import { TRACKED_PARAMETER_CODES } from "./usgs.constants";

export interface UsgsReading {
  id: string;
  parameterCode: string;
  computationIdentifier: string;
  parameterName: string;
  value: string;
  unit: string;
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
  [key: string]: unknown;
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
    [key: string]: unknown;
  };
  [key: string]: unknown;
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
  reportDate: string,
  parameterCodes: string[],
): Promise<ContinuousFeature[]> {
  const url = new URL(
    "https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous/items",
  );
  url.searchParams.set("f", "json");
  url.searchParams.set("monitoring_location_id", usgsLocationId);
  url.searchParams.set("parameter_code", parameterCodes.join(","));
  url.searchParams.set("time", reportDate);

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
  reportDate: string,
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

  const availableParameterCodes = new Set(metadataByCode.keys());

  const trackedCodes = Array.from(availableParameterCodes).filter((code) =>
    TRACKED_PARAMETER_CODES.has(code),
  );

  if (trackedCodes.length === 0) {
    return [];
  }

  const features = await fetchContinuousData(
    usgsLocationId,
    reportDate,
    trackedCodes,
  );

  return features.map((feature) => {
    const metadataInfo = metadataByCode.get(
      feature.properties.parameter_code,
    ) || {
      parameterName: "",
      computationIdentifier: "",
    };

    return {
      id: feature.id,
      parameterCode: feature.properties.parameter_code,
      computationIdentifier: metadataInfo.computationIdentifier,
      parameterName: metadataInfo.parameterName,
      value: feature.properties.result || feature.properties.value || "",
      unit:
        feature.properties.unit_of_measure || feature.properties.units || "",
    };
  });
}
