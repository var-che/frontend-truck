// src/mocks/loadData.ts

interface BoxTruckLoad {
  id: string;
  postedAt: string;
  origin: {
    city: string;
    state: string;
    zipCode: string;
  };
  destination: {
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    name: string;
    phone?: string;
    email?: string;
    company: string;
  };
  comment: string;
  rate?: number;
}

export const mockLoads: BoxTruckLoad[] = [
  {
    id: '1',
    postedAt: '2024-03-12T08:30:00Z',
    origin: {
      city: 'Chicago',
      state: 'IL',
      zipCode: '60612',
    },
    destination: {
      city: 'Detroit',
      state: 'MI',
      zipCode: '48201',
    },
    contact: {
      name: 'John Smith',
      phone: '312-555-0123',
      company: 'Midwest Logistics LLC',
    },
    comment: 'Box truck needed ASAP. Multiple pallets. No touch freight.',
    rate: 850,
  },
  {
    id: '2',
    postedAt: '2024-03-12T09:15:00Z',
    origin: {
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30318',
    },
    destination: {
      city: 'Charlotte',
      state: 'NC',
      zipCode: '28202',
    },
    contact: {
      name: 'Sarah Johnson',
      email: 'sarah.j@southeastfreight.com',
      company: 'Southeast Freight Solutions',
    },
    comment: 'Light load, 12 boxes. Liftgate required.',
    rate: 600,
  },
  {
    id: '3',
    postedAt: '2024-03-12T10:00:00Z',
    origin: {
      city: 'Dallas',
      state: 'TX',
      zipCode: '75207',
    },
    destination: {
      city: 'Houston',
      state: 'TX',
      zipCode: '77002',
    },
    contact: {
      name: 'Mike Wilson',
      phone: '214-555-0189',
      email: 'dispatch@texasexpress.com',
      company: 'Texas Express Shipping',
    },
    comment: 'Same day delivery needed. Food products.',
    rate: 450,
  },
  {
    id: '4',
    postedAt: '2024-03-12T10:45:00Z',
    origin: {
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85034',
    },
    destination: {
      city: 'Las Vegas',
      state: 'NV',
      zipCode: '89119',
    },
    contact: {
      name: 'David Chen',
      phone: '602-555-0144',
      company: 'Southwest Carriers',
    },
    comment: 'Electronics. Handle with care. Team preferred.',
    rate: 700,
  },
  {
    id: '5',
    postedAt: '2024-03-12T11:30:00Z',
    origin: {
      city: 'Seattle',
      state: 'WA',
      zipCode: '98134',
    },
    destination: {
      city: 'Portland',
      state: 'OR',
      zipCode: '97201',
    },
    contact: {
      name: 'Lisa Anderson',
      email: 'dispatch@pacificlogistics.net',
      company: 'Pacific Logistics',
    },
    comment: 'Retail merchandise. Loading dock available. 2hr unload.',
    rate: 550,
  },
];
