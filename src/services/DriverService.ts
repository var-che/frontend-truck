import { Driver, DriverFormData } from '../types/driver';

// Mock API responses - in a real app, these would be HTTP requests
export class DriverService {
  private static drivers: Driver[] = [
    {
      id: '1',
      name: 'John Smith',
      truckNumber: 'TRK-001',
      currentLocation: {
        address: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
      },
      truckEquipment: {
        type: 'semi-trailer',
        length: '53ft',
        capacity: '80,000 lbs',
        features: ['air-ride', 'team-driver'],
      },
      status: 'available',
      contactInfo: {
        phone: '(555) 123-4567',
        email: 'john.smith@truckarooskie.com',
      },
      notes: 'Experienced long-haul driver',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-08-01'),
    },
    {
      id: '2',
      name: 'Maria Rodriguez',
      truckNumber: 'TRK-002',
      currentLocation: {
        address: '456 Industrial Blvd',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
      },
      truckEquipment: {
        type: 'box-truck',
        length: '26ft',
        capacity: '26,000 lbs',
        features: ['lift-gate'],
      },
      status: 'in-transit',
      contactInfo: {
        phone: '(555) 987-6543',
        email: 'maria.rodriguez@truckarooskie.com',
      },
      notes: 'Specializes in local deliveries',
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-08-03'),
    },
    {
      id: '3',
      name: 'Michael Johnson',
      truckNumber: 'TRK-003',
      currentLocation: {
        address: '789 Highway 35',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30301',
      },
      truckEquipment: {
        type: 'flatbed',
        length: '48ft',
        capacity: '48,000 lbs',
        features: ['tarps', 'chains'],
      },
      status: 'loading',
      contactInfo: {
        phone: '(555) 456-7890',
        email: 'michael.johnson@truckarooskie.com',
      },
      notes: 'Flatbed specialist with 15 years experience',
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-08-02'),
    },
  ];

  /**
   * Get all drivers
   */
  static async getAllDrivers(): Promise<Driver[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [...this.drivers];
  }

  /**
   * Get driver by ID
   */
  static async getDriverById(id: string): Promise<Driver | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return this.drivers.find((driver) => driver.id === id) || null;
  }

  /**
   * Create a new driver
   */
  static async createDriver(driverData: DriverFormData): Promise<Driver> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newDriver: Driver = {
      id: Date.now().toString(),
      ...driverData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.drivers.push(newDriver);
    return newDriver;
  }

  /**
   * Update an existing driver
   */
  static async updateDriver(
    id: string,
    driverData: DriverFormData,
  ): Promise<Driver | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const driverIndex = this.drivers.findIndex((driver) => driver.id === id);
    if (driverIndex === -1) {
      return null;
    }

    const existingDriver = this.drivers[driverIndex];
    const updatedDriver: Driver = {
      ...existingDriver,
      ...driverData,
      updatedAt: new Date(),
    };

    this.drivers[driverIndex] = updatedDriver;
    return updatedDriver;
  }

  /**
   * Delete a driver
   */
  static async deleteDriver(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const driverIndex = this.drivers.findIndex((driver) => driver.id === id);
    if (driverIndex === -1) {
      return false;
    }

    this.drivers.splice(driverIndex, 1);
    return true;
  }

  /**
   * Search drivers by various criteria
   */
  static async searchDrivers(query: {
    name?: string;
    truckNumber?: string;
    status?: string;
    city?: string;
    state?: string;
  }): Promise<Driver[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    return this.drivers.filter((driver) => {
      if (
        query.name &&
        !driver.name.toLowerCase().includes(query.name.toLowerCase())
      ) {
        return false;
      }
      if (
        query.truckNumber &&
        !driver.truckNumber
          .toLowerCase()
          .includes(query.truckNumber.toLowerCase())
      ) {
        return false;
      }
      if (query.status && driver.status !== query.status) {
        return false;
      }
      if (
        query.city &&
        !driver.currentLocation.city
          .toLowerCase()
          .includes(query.city.toLowerCase())
      ) {
        return false;
      }
      if (
        query.state &&
        driver.currentLocation.state.toLowerCase() !== query.state.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get drivers by status
   */
  static async getDriversByStatus(status: string): Promise<Driver[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.drivers.filter((driver) => driver.status === status);
  }

  /**
   * Update driver location
   */
  static async updateDriverLocation(
    id: string,
    location: {
      address: string;
      city: string;
      state: string;
      zipCode?: string;
    },
  ): Promise<Driver | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const driverIndex = this.drivers.findIndex((driver) => driver.id === id);
    if (driverIndex === -1) {
      return null;
    }

    this.drivers[driverIndex] = {
      ...this.drivers[driverIndex],
      currentLocation: location,
      updatedAt: new Date(),
    };

    return this.drivers[driverIndex];
  }

  /**
   * Update driver status
   */
  static async updateDriverStatus(
    id: string,
    status: string,
  ): Promise<Driver | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const driverIndex = this.drivers.findIndex((driver) => driver.id === id);
    if (driverIndex === -1) {
      return null;
    }

    this.drivers[driverIndex] = {
      ...this.drivers[driverIndex],
      status: status as any,
      updatedAt: new Date(),
    };

    return this.drivers[driverIndex];
  }

  /**
   * Get drivers in a specific geographic area
   */
  static async getDriversInArea(states: string[]): Promise<Driver[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.drivers.filter((driver) =>
      states
        .map((s) => s.toLowerCase())
        .includes(driver.currentLocation.state.toLowerCase()),
    );
  }

  /**
   * Get available drivers with specific equipment
   */
  static async getAvailableDriversWithEquipment(
    truckType: string,
    features?: string[],
  ): Promise<Driver[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    return this.drivers.filter((driver) => {
      if (driver.status !== 'available') return false;
      if (driver.truckEquipment.type !== truckType) return false;

      if (features && features.length > 0) {
        return features.every((feature) =>
          driver.truckEquipment.features?.includes(feature),
        );
      }

      return true;
    });
  }
}

export default DriverService;
