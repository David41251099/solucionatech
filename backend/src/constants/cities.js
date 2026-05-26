export const ALLOWED_CITIES = [
  'Piedecuesta',
  'Bucaramanga',
  'Floridablanca',
  'Girón',
];

export const DEFAULT_CITY = 'Bucaramanga';

const CITY_LOOKUP = new Map(
  ALLOWED_CITIES.map((city) => [
    city
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
    city,
  ])
);

export const normalizeCity = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalizedKey = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return CITY_LOOKUP.get(normalizedKey) ?? null;
};

export const isAllowedCity = (value) => normalizeCity(value) !== null;
