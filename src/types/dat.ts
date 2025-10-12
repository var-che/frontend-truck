export interface DatSearchCriteria {
  formParams: {
    origin: {
      city?: string;
      state?: string;
    } | null;
    destination: {
      city?: string;
      state?: string;
    } | null;
    weightPounds: number;
    startDate: string;
    endDate: string;
  };
}

export interface DatResponse {
  exactSearchCriteria: {
    formParams: DatSearchCriteria['formParams'];
  };
  searchId: string;
}

export interface DatSearchResponse {
  searchId: string;
  formParams: {
    weightPounds: number;
    startDate: string;
    endDate: string;
    origin?: {
      city?: string;
      state?: string;
      name?: string;
    };
    destination?: {
      city?: string;
      state?: string;
      name?: string;
    } | null;
  };
}
