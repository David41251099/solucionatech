export const ALLOWED_CITIES = [
  "Piedecuesta",
  "Bucaramanga",
  "Floridablanca",
  "Girón",
] as const;

export type AllowedCity = (typeof ALLOWED_CITIES)[number];

export const DEFAULT_CITY: AllowedCity = "Bucaramanga";
