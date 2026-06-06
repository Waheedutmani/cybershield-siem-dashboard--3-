export interface GeoInfo {
  country: string;
  countryCode: string;
  city: string;
  isp: string;
  flag: string;
}

const countries: Array<{ country: string; code: string; city: string; isp: string; flag: string }> = [
  { country: 'Russia', code: 'RU', city: 'Moscow', isp: 'Rostelecom', flag: '🇷🇺' },
  { country: 'China', code: 'CN', city: 'Beijing', isp: 'China Telecom', flag: '🇨🇳' },
  { country: 'United States', code: 'US', city: 'New York', isp: 'Comcast', flag: '🇺🇸' },
  { country: 'Brazil', code: 'BR', city: 'São Paulo', isp: 'Vivo Telecom', flag: '🇧🇷' },
  { country: 'Germany', code: 'DE', city: 'Berlin', isp: 'Deutsche Telekom', flag: '🇩🇪' },
  { country: 'India', code: 'IN', city: 'Mumbai', isp: 'Jio Fiber', flag: '🇮🇳' },
  { country: 'North Korea', code: 'KP', city: 'Pyongyang', isp: 'Star JV', flag: '🇰🇵' },
  { country: 'Iran', code: 'IR', city: 'Tehran', isp: 'MCI', flag: '🇮🇷' },
  { country: 'Nigeria', code: 'NG', city: 'Lagos', isp: 'MTN Nigeria', flag: '🇳🇬' },
  { country: 'Ukraine', code: 'UA', city: 'Kyiv', isp: 'Kyivstar', flag: '🇺🇦' },
  { country: 'Romania', code: 'RO', city: 'Bucharest', isp: 'Digi Communications', flag: '🇷🇴' },
  { country: 'Vietnam', code: 'VN', city: 'Hanoi', isp: 'Viettel', flag: '🇻🇳' },
  { country: 'Indonesia', code: 'ID', city: 'Jakarta', isp: 'Telkomsel', flag: '🇮🇩' },
  { country: 'Turkey', code: 'TR', city: 'Istanbul', isp: 'Turkcell', flag: '🇹🇷' },
  { country: 'South Korea', code: 'KR', city: 'Seoul', isp: 'SK Broadband', flag: '🇰🇷' },
  { country: 'United Kingdom', code: 'GB', city: 'London', isp: 'BT Group', flag: '🇬🇧' },
  { country: 'France', code: 'FR', city: 'Paris', isp: 'Orange SA', flag: '🇫🇷' },
  { country: 'Japan', code: 'JP', city: 'Tokyo', isp: 'NTT Communications', flag: '🇯🇵' },
  { country: 'Australia', code: 'AU', city: 'Sydney', isp: 'Telstra', flag: '🇦🇺' },
  { country: 'Netherlands', code: 'NL', city: 'Amsterdam', isp: 'KPN', flag: '🇳🇱' },
];

const highRiskCountries = ['North Korea', 'Iran', 'Russia', 'China', 'Nigeria', 'Vietnam', 'Indonesia', 'Romania'];

const ipToIndexCache: Map<string, number> = new Map();

function hashIpToIndex(ip: string): number {
  if (ipToIndexCache.has(ip)) return ipToIndexCache.get(ip)!;
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const idx = Math.abs(hash) % countries.length;
  ipToIndexCache.set(ip, idx);
  return idx;
}

export function getGeoInfo(ip: string): GeoInfo {
  const idx = hashIpToIndex(ip);
  const entry = countries[idx];
  return {
    country: entry.country,
    countryCode: entry.code,
    city: entry.city,
    isp: entry.isp,
    flag: entry.flag,
  };
}

export function isHighRiskCountry(country: string): boolean {
  return highRiskCountries.includes(country);
}

export function getRandomGeoInfo(): GeoInfo {
  const entry = countries[Math.floor(Math.random() * countries.length)];
  return {
    country: entry.country,
    countryCode: entry.code,
    city: entry.city,
    isp: entry.isp,
    flag: entry.flag,
  };
}

export function getRiskLabel(country: string): { label: string; color: string } {
  if (isHighRiskCountry(country)) {
    return { label: 'High Risk', color: 'text-neon-red' };
  }
  return { label: 'Low Risk', color: 'text-neon-green' };
}
