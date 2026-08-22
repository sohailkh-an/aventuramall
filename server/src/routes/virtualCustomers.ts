interface VirtualAddressProfile {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface VirtualCustomerProfile {
  name: string;
  email: string;
  phone: string;
  address: VirtualAddressProfile;
}

export interface VirtualCustomerOptions {
  initialBalance: number;
  disableLogin: boolean;
}

interface RandomUserResponse {
  results?: Array<{
    name?: {
      first?: string;
      last?: string;
    };
    email?: string;
    phone?: string;
    cell?: string;
    location?: {
      street?: {
        number?: number;
        name?: string;
      };
      city?: string;
      state?: string;
      postcode?: string | number;
      country?: string;
    };
  }>;
}

type RandomUserFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

const FIRST_NAMES = [
  'Ava',
  'Mia',
  'Sophia',
  'Olivia',
  'Emma',
  'Noah',
  'Liam',
  'Ethan',
  'Mason',
  'Lucas',
  'Amelia',
  'Harper',
];

const LAST_NAMES = [
  'Parker',
  'Morgan',
  'Bennett',
  'Reed',
  'Carter',
  'Brooks',
  'Hayes',
  'Cooper',
  'Sullivan',
  'Wright',
  'Foster',
  'Bailey',
];

const STREETS = [
  'Maple Ridge Road',
  'Cedar Lake Drive',
  'Willow Creek Lane',
  'Oak Hollow Street',
  'Pine Valley Avenue',
  'Sunset Meadow Way',
];

const CITIES = [
  { city: 'Austin', state: 'Texas', zip: '78701' },
  { city: 'Phoenix', state: 'Arizona', zip: '85004' },
  { city: 'Denver', state: 'Colorado', zip: '80202' },
  { city: 'Charlotte', state: 'North Carolina', zip: '28202' },
  { city: 'Columbus', state: 'Ohio', zip: '43215' },
  { city: 'Seattle', state: 'Washington', zip: '98101' },
];

const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me'];

function slugEmailPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '');
}

function buildRealisticEmail(firstName: string, lastName: string, index: number) {
  const domain = EMAIL_DOMAINS[index % EMAIL_DOMAINS.length];
  const suffix = `${Date.now().toString().slice(-5)}${String(index + 1).padStart(2, '0')}`;

  return `${slugEmailPart(firstName)}.${slugEmailPart(lastName)}.${suffix}@${domain}`;
}

export function buildFallbackVirtualProfiles(quantity: number): VirtualCustomerProfile[] {
  return Array.from({ length: quantity }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(index * 3) % LAST_NAMES.length];
    const location = CITIES[index % CITIES.length];

    return {
      name: `${firstName} ${lastName}`,
      email: buildRealisticEmail(firstName, lastName, index),
      phone: `+1 555 ${String(200 + index).padStart(3, '0')} ${String(1000 + index).padStart(4, '0')}`,
      address: {
        street: `${100 + index} ${STREETS[index % STREETS.length]}`,
        city: location.city,
        state: location.state,
        zip: location.zip,
        country: 'United States',
      },
    };
  });
}

function mapRandomUsers(results: NonNullable<RandomUserResponse['results']>, quantity: number) {
  return results.slice(0, quantity).map((result, index) => {
    const firstName = result.name?.first || FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = result.name?.last || LAST_NAMES[index % LAST_NAMES.length];
    const streetNumber = result.location?.street?.number || 100 + index;
    const streetName = result.location?.street?.name || STREETS[index % STREETS.length];

    return {
      name: `${firstName} ${lastName}`,
      email: buildRealisticEmail(firstName, lastName, index),
      phone: result.phone || result.cell || `+1 555 ${String(200 + index).padStart(3, '0')} ${String(1000 + index).padStart(4, '0')}`,
      address: {
        street: `${streetNumber} ${streetName}`,
        city: result.location?.city || CITIES[index % CITIES.length].city,
        state: result.location?.state || CITIES[index % CITIES.length].state,
        zip: String(result.location?.postcode || CITIES[index % CITIES.length].zip),
        country: result.location?.country || 'United States',
      },
    };
  });
}

export async function fetchVirtualCustomerProfiles(quantity: number): Promise<VirtualCustomerProfile[]> {
  try {
    const response = (await fetch(
      `https://randomuser.me/api/?results=${quantity}&nat=us`
    )) as RandomUserFetchResponse;
    if (!response.ok) {
      throw new Error(`Random user API failed with ${response.status}`);
    }

    const payload = (await response.json()) as RandomUserResponse;
    if (!payload.results?.length) {
      throw new Error('Random user API returned no customers');
    }

    return mapRandomUsers(payload.results, quantity);
  } catch {
    return buildFallbackVirtualProfiles(quantity);
  }
}

export function mapProfilesToVirtualCustomerCreateInput(
  profiles: VirtualCustomerProfile[],
  options: VirtualCustomerOptions
) {
  return profiles.map((profile) => ({
    user: {
      email: profile.email,
      name: profile.name,
      emailVerified: true,
      role: 'CUSTOMER' as const,
      phone: profile.phone,
      walletBalance: options.initialBalance,
      package: 'Virtual',
      isBanned: options.disableLogin,
    },
    address: {
      label: 'Home',
      street: profile.address.street,
      city: profile.address.city,
      state: profile.address.state,
      zip: profile.address.zip,
      country: profile.address.country,
      phone: profile.phone,
      isDefault: true,
    },
  }));
}
