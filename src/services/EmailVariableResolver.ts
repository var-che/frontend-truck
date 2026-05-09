import { EmailContext, EmailVariable } from "../types/email";
import { SylectusLoad } from "../types/sylectus";
import { Driver } from "../types/driver";

// ---------------------------------------------------------------------------
// Variable registry — every {{variable}} the user can insert
// ---------------------------------------------------------------------------

export const EMAIL_VARIABLES: EmailVariable[] = [
  // Load — origin / destination
  {
    key: "origin",
    label: "Origin",
    description: "Pickup city and state from the load",
    category: "load",
  },
  {
    key: "destination",
    label: "Destination",
    description: "Delivery city and state from the load",
    category: "load",
  },
  {
    key: "pickup_date",
    label: "Pickup Date",
    description: "Scheduled pickup date/time",
    category: "load",
  },
  {
    key: "equipment_type",
    label: "Equipment Type",
    description: "Required equipment (e.g. Van, Flatbed)",
    category: "load",
  },
  {
    key: "load_weight",
    label: "Load Weight",
    description: "Weight of the load",
    category: "load",
  },
  {
    key: "load_length",
    label: "Load Length",
    description: "Required trailer length",
    category: "load",
  },
  {
    key: "rate",
    label: "Rate",
    description: "Posted rate / amount for the load",
    category: "load",
  },
  {
    key: "trip_miles",
    label: "Trip Miles",
    description: "Total loaded miles for the trip",
    category: "load",
  },
  {
    key: "company",
    label: "Broker/Company",
    description: "Name of the posting company",
    category: "load",
  },

  // Driver
  {
    key: "driver_name",
    label: "Driver Name",
    description: "Full name of the assigned driver",
    category: "driver",
  },
  {
    key: "driver_truck",
    label: "Truck Number",
    description: "Driver's truck/unit number",
    category: "driver",
  },
  {
    key: "driver_location",
    label: "Driver Location",
    description: "Driver's current city and state",
    category: "driver",
  },
  {
    key: "driver_phone",
    label: "Driver Phone",
    description: "Driver's contact phone number",
    category: "driver",
  },
  {
    key: "driver_equipment",
    label: "Driver Equipment",
    description: "Driver's truck type and length",
    category: "driver",
  },

  // Computed
  {
    key: "dh_miles",
    label: "Deadhead Miles",
    description: "Miles driver must travel to reach pickup (DH-O)",
    category: "computed",
  },
  {
    key: "eta_to_pickup",
    label: "ETA to Pickup",
    description: "Estimated travel time for driver to reach pickup",
    category: "computed",
  },

  // Meta
  {
    key: "dispatcher_name",
    label: "Dispatcher Name",
    description: "Your name (set in Settings)",
    category: "meta",
  },
  {
    key: "today",
    label: "Today's Date",
    description: "Current date (e.g. Monday, June 16, 2025)",
    category: "meta",
  },
];

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

export function buildContext(
  opts: {
    load?: SylectusLoad;
    driver?: Driver;
    dhMiles?: number;
    etaToPickup?: string;
    dispatcherName?: string;
  } = {}
): EmailContext {
  return {
    ...opts,
    today: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

// ---------------------------------------------------------------------------
// Template resolver — replaces {{key}} with real values
// ---------------------------------------------------------------------------

export function resolveTemplate(template: string, ctx: EmailContext): string {
  const { load, driver } = ctx;

  const values: Record<string, string> = {
    // Load fields
    origin: load?.origin ?? "",
    destination: load?.destination ?? "",
    pickup_date: load?.pickUp ?? "",
    equipment_type: load?.eq ?? "",
    load_weight: load?.weight != null ? String(load.weight) : "",
    load_length: load?.length ?? "",
    rate: load?.rate ?? "",
    trip_miles: load?.trip != null ? String(load.trip) : "",
    company: load?.company ?? "",

    // Driver fields
    driver_name: driver?.name ?? "",
    driver_truck: driver?.truckNumber ?? "",
    driver_location: driver
      ? `${driver.currentLocation.city}, ${driver.currentLocation.state}`
      : "",
    driver_phone: driver?.contactInfo.phone ?? "",
    driver_equipment: driver
      ? `${driver.truckEquipment.type} – ${driver.truckEquipment.length}`
      : "",

    // Computed
    dh_miles:
      ctx.dhMiles != null ? `${Math.round(ctx.dhMiles)} mi` : "",
    eta_to_pickup: ctx.etaToPickup ?? "",

    // Meta
    dispatcher_name: ctx.dispatcherName ?? "",
    today: ctx.today,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return values[key] !== undefined ? values[key] : `{{${key}}}`;
  });
}
