import { LoadBoardService, LoadBoardProvider } from '../types/loadboard';
import { DATService } from './DATService';
import { SylectusService } from './SylectusService';

export class LoadBoardRegistry {
  private static instance: LoadBoardRegistry;
  private services: Map<LoadBoardProvider, LoadBoardService> = new Map();
  private messagingFunction?: (searchData: any) => Promise<any>;

  private constructor() {
    // Initialize services without messaging first
    this.initializeServices();
  }

  private initializeServices(): void {
    // Register all available load board services
    this.registerService(new DATService(this.messagingFunction));
    this.registerService(new SylectusService(this.messagingFunction));
  }

  static getInstance(): LoadBoardRegistry {
    if (!LoadBoardRegistry.instance) {
      LoadBoardRegistry.instance = new LoadBoardRegistry();
    }
    return LoadBoardRegistry.instance;
  }

  // Set the messaging function and reinitialize services
  setMessagingFunction(
    messagingFunction: (searchData: any) => Promise<any>,
  ): void {
    console.log(
      '🔧 LoadBoardRegistry: Setting messaging function and reinitializing services',
    );
    this.messagingFunction = messagingFunction;
    this.services.clear();
    this.initializeServices();
    console.log(
      '✅ LoadBoardRegistry: Services reinitialized with messaging function',
    );
  }

  registerService(service: LoadBoardService): void {
    this.services.set(service.provider, service);
  }

  getService(provider: LoadBoardProvider): LoadBoardService | undefined {
    return this.services.get(provider);
  }

  getAllServices(): LoadBoardService[] {
    return Array.from(this.services.values());
  }

  getEnabledServices(): LoadBoardService[] {
    return this.getAllServices().filter((service) => service.isEnabled);
  }

  getServicesByProviders(providers: LoadBoardProvider[]): LoadBoardService[] {
    return providers
      .map((provider) => this.getService(provider))
      .filter((service): service is LoadBoardService => service !== undefined);
  }
}

// Export a singleton instance
export const loadBoardRegistry = LoadBoardRegistry.getInstance();
