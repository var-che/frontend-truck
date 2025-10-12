export interface Driver {
  id: string;
  name: string;
  truckNumber: string;
  currentLocation: {
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  truckEquipment: {
    type:
      | 'box-truck'
      | 'semi-trailer'
      | 'straight-truck'
      | 'van'
      | 'flatbed'
      | 'other';
    length: string; // e.g., "26ft", "53ft"
    capacity?: string; // e.g., "26,000 lbs"
    features?: string[]; // e.g., ["lift-gate", "air-ride", "team-driver"]
  };
  status:
    | 'available'
    | 'in-transit'
    | 'loading'
    | 'unloading'
    | 'maintenance'
    | 'off-duty';
  contactInfo: {
    phone: string;
    email?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverFormData {
  name: string;
  truckNumber: string;
  currentLocation: {
    address: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  truckEquipment: {
    type:
      | 'box-truck'
      | 'semi-trailer'
      | 'straight-truck'
      | 'van'
      | 'flatbed'
      | 'other';
    length: string;
    capacity?: string;
    features?: string[];
  };
  status:
    | 'available'
    | 'in-transit'
    | 'loading'
    | 'unloading'
    | 'maintenance'
    | 'off-duty';
  contactInfo: {
    phone: string;
    email?: string;
  };
  notes?: string;
}

export type TruckType =
  | 'box-truck'
  | 'semi-trailer'
  | 'straight-truck'
  | 'van'
  | 'flatbed'
  | 'other';
export type DriverStatus =
  | 'available'
  | 'in-transit'
  | 'loading'
  | 'unloading'
  | 'maintenance'
  | 'off-duty';
