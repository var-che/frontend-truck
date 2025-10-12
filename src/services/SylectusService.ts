import {
  LoadBoardService,
  LoadBoardProvider,
  LoadBoardSearchData,
  LoadBoardSearchResult,
} from '../types/loadboard';
import { SearchState } from '../hooks/useSearchState';
import {
  SylectusSearchParams,
  SylectusSearchResponse,
  SylectusLoad,
} from '../types/sylectus';

export class SylectusService implements LoadBoardService {
  provider = LoadBoardProvider.SYLECTUS;
  name = 'Sylectus';
  isEnabled = true;

  private sendSearchMessage?: (searchData: any) => Promise<any>;

  constructor(sendSearchMessage?: (searchData: any) => Promise<any>) {
    this.sendSearchMessage = sendSearchMessage;
  }

  transformSearchState(searchState: SearchState): LoadBoardSearchData {
    return {
      origin: searchState.origin
        ? {
            city: searchState.origin.city,
            state: searchState.origin.state,
            name: `${searchState.origin.city}, ${searchState.origin.state}`,
            zip: searchState.origin.zip, // Include ZIP code for consistency
          }
        : undefined,
      destination: searchState.destination
        ? {
            city: searchState.destination.city,
            state: searchState.destination.state,
            name: `${searchState.destination.city}, ${searchState.destination.state}`,
            zip: searchState.destination.zip, // Include destination ZIP too
          }
        : null,
      startDate: searchState.dateRange[0]
        ? searchState.dateRange[0].format('YYYY-MM-DD')
        : undefined,
      endDate: searchState.dateRange[1]
        ? searchState.dateRange[1].format('YYYY-MM-DD')
        : undefined,
      originStates: searchState.originStates,
      destinationStates: searchState.destinationStates,
    };
  }

  async search(
    searchData: LoadBoardSearchData,
  ): Promise<LoadBoardSearchResult> {
    try {
      console.log('🔍 SylectusService.search() called with data:', searchData);

      // Convert LoadBoardSearchData to SylectusSearchParams
      const sylectusParams: SylectusSearchParams = {
        fromCity: this.extractCityFromLocation(searchData.origin) || '',
        fromState: this.extractStateFromLocation(searchData.origin) || '',
        toCity: this.extractCityFromLocation(searchData.destination),
        toState:
          this.extractStateFromLocation(searchData.destination) ||
          (searchData.destinationStates &&
          searchData.destinationStates.length > 0
            ? searchData.destinationStates[0]
            : ''),
        fromDate: searchData.startDate
          ? this.formatDateForSylectus(searchData.startDate)
          : undefined,
      };

      console.log(
        '🎯 SylectusService: Converted to sylectusParams:',
        sylectusParams,
      );

      // Send data to the extension if messaging is available
      if (this.sendSearchMessage) {
        console.log(
          '📤 SylectusService: Messaging function available, sending search...',
        );
        try {
          const response = await this.searchLoads(sylectusParams);
          console.log(
            '✅ SylectusService: Received response from extension:',
            response,
          );

          return {
            success: true,
            message: `Found ${response.loads.length} loads on Sylectus`,
            data: {
              provider: this.provider,
              searchData,
              originalSearchData: searchData, // Include original search data for lane management
              searchModuleId: searchData.searchModuleId, // Include search module ID
              timestamp: new Date().toISOString(),
              loads: response.loads,
              totalRecords: response.totalRecords,
            },
          };
        } catch (extensionError) {
          console.error(
            '❌ SylectusService: Extension communication failed:',
            extensionError,
          );
          // Continue with fallback behavior below
        }
      } else {
        console.log(
          '⚠️ SylectusService: No messaging function available, using fallback',
        );
      }

      // Fallback: simulate the search if extension is not available
      console.log('🎭 SylectusService: Using fallback simulation mode');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return {
        success: true,
        message: 'Search executed successfully on Sylectus (simulated)',
        data: {
          provider: this.provider,
          searchData,
          originalSearchData: searchData, // Include original search data for lane management
          searchModuleId: searchData.searchModuleId, // Include search module ID
          timestamp: new Date().toISOString(),
          mode: 'simulation',
          loads: [],
          totalRecords: 0,
        },
      };
    } catch (error) {
      console.error('Sylectus search error:', error);
      return {
        success: false,
        message: `Sylectus search failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        data: {
          provider: this.provider,
          searchData,
          searchModuleId: searchData.searchModuleId, // Include search module ID
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Send a search request to Sylectus via the Chrome extension
   */
  async searchLoads(
    params: SylectusSearchParams,
  ): Promise<SylectusSearchResponse> {
    console.log('🚀 SylectusService.searchLoads() called with params:', params);

    return new Promise((resolve, reject) => {
      // Check if messaging function is available
      if (!this.sendSearchMessage) {
        console.error(
          '❌ SylectusService.searchLoads: No messaging function available',
        );
        reject(new Error('Chrome extension messaging not available'));
        return;
      }

      // Prepare the message for the extension
      const message = {
        type: 'SYLECTUS_SEARCH',
        params: {
          fromCity: params.fromCity.toLowerCase(),
          fromState: params.fromState,
          toCity: params.toCity?.toLowerCase() || '',
          toState: params.toState || '',
          miles: params.miles || 120,
          fromDate: params.fromDate || this.formatDate(new Date()),
          loadTypes: params.loadTypes || [],
          maxWeight: params.maxWeight || '',
          minCargo: params.minCargo || '',
          maxCargo: params.maxCargo || '',
          freight: params.freight || 'Both',
          refreshRate: params.refreshRate || 300,
        },
      };

      console.log(
        '📨 SylectusService.searchLoads: Sending message to extension:',
        message,
      );

      // Send message via the messaging function
      this.sendSearchMessage(message)
        .then((response) => {
          console.log(
            '📨 SylectusService.searchLoads: Received response:',
            response,
          );
          if (response?.success) {
            console.log('✅ SylectusService.searchLoads: Search successful');
            resolve(response.data);
          } else {
            console.error(
              '❌ SylectusService.searchLoads: Search failed:',
              response,
            );
            reject(new Error(response?.error || 'Search failed'));
          }
        })
        .catch((error) => {
          console.error(
            '❌ SylectusService.searchLoads: Promise rejected:',
            error,
          );
          reject(error);
        });
    });
  }

  /**
   * Helper methods for parsing and formatting
   */
  private extractCityFromLocation(
    location?: { city?: string; state?: string; name?: string } | null,
  ): string | undefined {
    if (!location) return undefined;
    return location.city;
  }

  private extractStateFromLocation(
    location?: { city?: string; state?: string; name?: string } | null,
  ): string | undefined {
    if (!location) return undefined;
    return location.state;
  }

  private formatDateForSylectus(dateString: string): string {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Format date for Sylectus API (MM/DD/YYYY format)
   */
  private formatDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Format current timestamp for lastaccesstime parameter
   */
  static formatAccessTime(): string {
    return new Date().toString();
  }

  /**
   * Build the POST body for Sylectus search request
   */
  static buildSearchBody(params: SylectusSearchParams): string {
    const currentDate = new Date();
    const formattedDate = `${(currentDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${currentDate
      .getDate()
      .toString()
      .padStart(2, '0')}/${currentDate.getFullYear()}`;

    const formData = new URLSearchParams({
      secondsleft: '293',
      morefreight: 'Both',
      showOptionalFields: 'true',
      fromdate: params.fromDate || formattedDate,
      cb_notexp: 'on',
      procode: '',
      ordercode: '',
      maxlb: params.maxWeight || '',
      mincargo: params.minCargo || '',
      maxcargo: params.maxCargo || '',
      miles: (params.miles || 120).toString(),
      fromcity: params.fromCity.toLowerCase(),
      fromstate: params.fromState,
      tocity: params.toCity?.toLowerCase() || '',
      freight: params.freight || 'Both',
      refreshrate: (params.refreshRate || 300).toString(),
      commandbutton: '+++++SEARCH+++++',
      cb_audible: 'on',
      sortby: 'POSTDATE',
      sortorder: 'DESC',
      postonly: 'N',
      prevrefreshtime: `${params.fromDate || formattedDate} 21:42:01`,
      corplevel: 'M',
      lastaccesstime: SylectusService.formatAccessTime(),
    });

    // Add load type checkboxes if specified
    if (params.loadTypes && params.loadTypes.length > 0) {
      params.loadTypes.forEach((loadType) => {
        formData.append(loadType, 'on');
      });
    }

    return formData.toString();
  }

  /**
   * Parse HTML response from Sylectus to extract load data
   */
  static parseLoadsFromHTML(html: string): SylectusLoad[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const loads: SylectusLoad[] = [];

    // Find all load rows (alternating table-odd-row and table-even-row)
    const loadRows = doc.querySelectorAll(
      'tr.table-odd-row, tr.table-even-row',
    );

    loadRows.forEach((row) => {
      // Skip header row and summary rows
      if (
        row.textContent?.includes('POSTED BY') ||
        row.textContent?.includes('record(s) found') ||
        row.children.length < 10
      ) {
        return;
      }

      try {
        const cells = Array.from(row.children) as HTMLElement[];

        // Skip rows that are just notes (single colspan cell)
        if (
          cells.length === 1 ||
          (cells.length === 2 && cells[0].getAttribute('colspan'))
        ) {
          return;
        }

        const load: SylectusLoad = {
          id: SylectusService.extractLoadId(cells),

          // Required new fields (mapped from legacy data)
          age: SylectusService.extractPostDateTime(cells[5]) || 'N/A',
          rate: SylectusService.extractAmount(cells[2]) || 'N/A',
          trip: SylectusService.extractMiles(cells[6]),
          origin:
            SylectusService.extractPickupLocation(cells[3])?.fullAddress ||
            'N/A',
          dhO: 'N/A', // Deadhead origin not available
          destination:
            SylectusService.extractDeliveryLocation(cells[4])?.fullAddress ||
            'N/A',
          dhD: 'N/A', // Deadhead destination not available
          pickUp: SylectusService.extractPickupDateTime(cells[3]) || 'N/A',
          eq: SylectusService.extractVehicleSize(cells[6]) || 'N/A',
          length: 'N/A', // Length not available
          weight: SylectusService.extractWeight(cells[7]),
          capacity: 'N/A', // Capacity not available
          company: SylectusService.extractPostedBy(cells[0]) || 'N/A',
          pieces: SylectusService.extractPieces(cells[7]),

          // Legacy fields for backward compatibility
          postedBy: SylectusService.extractPostedBy(cells[0]),
          refNo: SylectusService.extractRefNo(cells[1]),
          orderNo: SylectusService.extractOrderNo(cells[2]),
          loadType: SylectusService.extractLoadType(cells[1]),
          brokerMC: SylectusService.extractBrokerMC(cells[1]),
          amount: SylectusService.extractAmount(cells[2]),
          pickupLocation: SylectusService.extractPickupLocation(cells[3]),
          pickupDateTime: SylectusService.extractPickupDateTime(cells[3]),
          deliveryLocation: SylectusService.extractDeliveryLocation(cells[4]),
          deliveryDateTime: SylectusService.extractDeliveryDateTime(cells[4]),
          postDateTime: SylectusService.extractPostDateTime(cells[5]),
          expiresOn: SylectusService.extractExpiresOn(cells[5]),
          vehicleSize: SylectusService.extractVehicleSize(cells[6]),
          miles: SylectusService.extractMiles(cells[6]),
          otherInfo: SylectusService.extractOtherInfo(cells[8]),
          daysToPayCredit: SylectusService.extractCredit(cells[0]),
          saferUrl: SylectusService.extractSaferUrl(cells[0]),
          bidUrl: SylectusService.extractBidUrl(cells[9]),
          reviewData: SylectusService.extractReviewData(cells[10]),
        };

        loads.push(load);
      } catch (error) {
        console.warn('Error parsing load row:', error, row);
      }
    });

    return loads;
  }

  // Helper methods for parsing specific data from cells
  private static extractLoadId(cells: HTMLElement[]): string {
    // Try to extract from order number or create unique ID
    const orderCell = cells[2];
    const orderLink = orderCell?.querySelector('a');
    if (orderLink) {
      const href = orderLink.getAttribute('href') || '';
      const match = href.match(/pronumuk=(\d+)/);
      if (match) return match[1];
    }
    return `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static extractPostedBy(cell: HTMLElement): string {
    // Look for the company name in the link - it's the text content of the main link
    const link = cell.querySelector('a[onclick*="promabprofile"]');
    if (link) {
      let companyName = link.textContent?.trim() || 'Unknown';
      // Remove extra whitespace, &nbsp; entities, and trailing whitespace
      companyName = companyName
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim();
      return companyName;
    }

    // Fallback: look for any link
    const anyLink = cell.querySelector('a');
    if (anyLink) {
      let companyName = anyLink.textContent?.trim() || 'Unknown';
      companyName = companyName
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim();
      return companyName;
    }

    return 'Unknown';
  }

  private static extractRefNo(cell: HTMLElement): string {
    const lines = cell.textContent?.split('\n') || [];
    return lines[0]?.trim() || '';
  }

  private static extractOrderNo(cell: HTMLElement): string {
    const link = cell.querySelector('a');
    return link?.textContent?.trim() || '';
  }

  private static extractLoadType(cell: HTMLElement): string {
    const lines = cell.textContent?.split('\n') || [];
    return lines[1]?.trim() || '';
  }

  private static extractBrokerMC(cell: HTMLElement): string {
    const lines = cell.textContent?.split('\n') || [];
    return lines[2]?.trim() || '';
  }

  private static extractAmount(cell: HTMLElement): string {
    const amountElement = cell.querySelector('font[color="#008000"] b');
    return amountElement?.textContent?.trim() || '';
  }

  private static extractPickupLocation(cell: HTMLElement): {
    city: string;
    state: string;
    zipCode?: string;
    fullAddress: string;
  } {
    // Look for the location text in the nested table structure
    const locationElement = cell.querySelector('td.px9');
    if (locationElement) {
      const locationText = locationElement.textContent?.trim() || '';
      return SylectusService.parseSylectusLocation(locationText);
    }

    // Fallback to cell text content
    const lines = cell.textContent?.split('\n') || [];
    const locationText = lines[0]?.trim() || '';
    return SylectusService.parseSylectusLocation(locationText);
  }

  private static extractDeliveryLocation(cell: HTMLElement): {
    city: string;
    state: string;
    zipCode?: string;
    fullAddress: string;
  } {
    // Split by <br> to get the location part only
    const htmlContent = cell.innerHTML;
    const brSplit = htmlContent.split('<br');

    // The location should be the first part (before the <br>)
    let locationText = '';
    if (brSplit.length > 0) {
      locationText = brSplit[0].replace(/<[^>]*>/g, '').trim();
    }

    // Fallback to text content first line if HTML parsing fails
    if (!locationText) {
      const lines = cell.textContent?.split('\n') || [];
      locationText = lines[0]?.trim() || '';
    }

    return SylectusService.parseSylectusLocation(locationText);
  }

  private static extractPickupDateTime(cell: HTMLElement): string {
    // Look for the time in the nested table structure
    const tableElement = cell.querySelector('table');
    if (tableElement) {
      const rows = tableElement.querySelectorAll('tr');
      if (rows.length > 1) {
        const timeElement = rows[1].querySelector('td');
        if (timeElement) {
          const rawDateTime = timeElement.textContent?.trim() || '';
          return SylectusService.parseSylectusDateTime(rawDateTime);
        }
      }
    }

    // Fallback to looking for time in cell content
    const lines = cell.textContent?.split('\n') || [];
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine !== '' && !trimmedLine.includes(',')) {
        return SylectusService.parseSylectusDateTime(trimmedLine);
      }
    }

    return '';
  }

  private static extractDeliveryDateTime(cell: HTMLElement): string {
    // Look for the delivery time after <br />
    const htmlContent = cell.innerHTML;
    const brSplit = htmlContent.split('<br');

    if (brSplit.length > 1) {
      // Get text after the first <br />
      const afterBr = brSplit[1].replace(/^[^>]*>/, '').trim();
      const cleanAfterBr = afterBr.replace(/<[^>]*>/g, '').trim();
      if (cleanAfterBr) {
        return SylectusService.parseSylectusDateTime(cleanAfterBr);
      }
    }

    // Fallback to looking for lines that contain date/time patterns
    const lines = cell.textContent?.split('\n') || [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // Look for lines that have date patterns or special delivery terms
      if (
        line &&
        (line.includes('/') ||
          line.toLowerCase().includes('direct') ||
          line.toLowerCase().includes('asap'))
      ) {
        return SylectusService.parseSylectusDateTime(line);
      }
    }

    return '';
  }

  private static extractPostDateTime(cell: HTMLElement): string {
    // Split by <br> to separate the two dates
    const htmlContent = cell.innerHTML;
    const brSplit = htmlContent.split('<br');

    if (brSplit.length > 0) {
      // Get the first part (post date)
      const postDatePart = brSplit[0].replace(/<[^>]*>/g, '').trim();
      if (postDatePart) {
        return SylectusService.parseSylectusDateTime(postDatePart);
      }
    }

    // Fallback to first line
    const lines = cell.textContent?.split('\n') || [];
    const rawDateTime = lines[0]?.trim() || '';
    return SylectusService.parseSylectusDateTime(rawDateTime);
  }

  private static extractExpiresOn(cell: HTMLElement): string {
    // Split by <br> to get the second date (expires on)
    const htmlContent = cell.innerHTML;
    const brSplit = htmlContent.split('<br');

    if (brSplit.length > 1) {
      // Get the second part (expires date)
      const expiresPart = brSplit[1]
        .replace(/^[^>]*>/, '')
        .replace(/<[^>]*>/g, '')
        .trim();
      if (expiresPart) {
        return SylectusService.parseSylectusDateTime(expiresPart);
      }
    }

    // Fallback to looking for second line with date pattern
    const lines = cell.textContent?.split('\n') || [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (line && line.includes('/')) {
        return SylectusService.parseSylectusDateTime(line);
      }
    }
    return '';
  }

  private static extractVehicleSize(cell: HTMLElement): string {
    const lines = cell.textContent?.split('\n') || [];
    const rawVehicleSize = lines[0]?.trim() || '';

    // Clean up the vehicle size - sometimes it has extra numbers attached
    // e.g., "SMALL STRAIGHT390" should be "SMALL STRAIGHT"
    const cleanVehicleSize = rawVehicleSize.replace(/\d+$/, '').trim();
    return cleanVehicleSize;
  }

  private static extractMiles(cell: HTMLElement): number {
    const lines = cell.textContent?.split('\n') || [];
    const milesText = lines[1]?.trim() || '0';
    return parseInt(milesText) || 0;
  }

  private static extractPieces(cell: HTMLElement): number {
    const lines = cell.textContent?.split('\n') || [];
    const piecesText = lines[0]?.trim() || '0';
    return parseInt(piecesText) || 0;
  }

  private static extractWeight(cell: HTMLElement): number {
    const lines = cell.textContent?.split('\n') || [];
    const weightText = lines[1]?.trim() || '0';
    return parseInt(weightText) || 0;
  }

  private static extractOtherInfo(cell: HTMLElement): string {
    return cell.textContent?.trim() || '';
  }

  private static extractCredit(cell: HTMLElement): {
    days?: number;
    score?: string;
  } {
    const scoreElements = cell.querySelectorAll(
      'a[href*="transcredithistory"]',
    );

    let days: number | undefined;
    let score: string | undefined;

    if (scoreElements.length >= 2) {
      days = parseInt(scoreElements[0].textContent?.trim() || '0') || undefined;
      score = scoreElements[1].textContent?.trim();
    }

    return { days, score };
  }

  private static extractSaferUrl(cell: HTMLElement): string {
    const saferLink = cell.querySelector('a[href*="safer.fmcsa.dot.gov"]');
    return (
      saferLink
        ?.getAttribute('onclick')
        ?.match(/window\.open\('([^']+)'/)?.[1] || ''
    );
  }

  private static extractBidUrl(cell: HTMLElement): string {
    const bidButton = cell.querySelector('input[name="bidbutton"]');
    if (bidButton) {
      const onclick = bidButton.getAttribute('onclick') || '';
      const match = onclick.match(/openawindow\('([^']+)'/);
      return match?.[1] || '';
    }
    return '';
  }

  private static extractReviewData(cell: HTMLElement): string {
    const hiddenInput = cell.querySelector('input[name="reviewdata"]');
    return hiddenInput?.getAttribute('value') || '';
  }

  // Lane management methods
  static async getLanes(): Promise<any[]> {
    // This would typically fetch from a backend API or local storage
    // For now, return empty array
    console.log('🔍 SylectusService.getLanes() called');
    return [];
  }

  static async updateLane(lane: any): Promise<void> {
    // This would typically update the lane in a backend API or local storage
    console.log('💾 SylectusService.updateLane() called with:', lane);
  }

  static async deleteLane(laneId: string): Promise<void> {
    // This would typically delete the lane from a backend API or local storage
    console.log('🗑️ SylectusService.deleteLane() called with id:', laneId);
  }

  /**
   * Parse Sylectus date/time strings to ISO format
   */
  private static parseSylectusDateTime(rawDateTime: string): string {
    if (!rawDateTime) return '';

    // Remove HTML tags if present (e.g., <FONT COLOR=#FF0000>08/04/2025 14:00</FONT>)
    const cleanDateTime = rawDateTime.replace(/<[^>]*>/g, '').trim();

    // Handle special cases
    if (
      cleanDateTime.toLowerCase() === 'asap' ||
      cleanDateTime.toLowerCase() === 'deliver direct' ||
      cleanDateTime.toLowerCase().includes('direct')
    ) {
      return new Date().toISOString(); // Return current time for ASAP
    }

    // Handle MM/DD/YYYY HH:MM format (most common)
    const dateTimeMatch = cleanDateTime.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/,
    );
    if (dateTimeMatch) {
      const [, month, day, year, hour, minute] = dateTimeMatch;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
      );
      return date.toISOString();
    }

    // Handle MM/DD/YYYY format (date only)
    const dateMatch = cleanDateTime.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dateMatch) {
      const [, month, day, year] = dateMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toISOString();
    }

    // Try to parse as a regular date string
    try {
      const date = new Date(cleanDateTime);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      console.warn('Could not parse Sylectus date:', cleanDateTime);
    }

    // If all else fails, return the original string (better than invalid date)
    return cleanDateTime;
  }

  /**
   * Parse Sylectus location strings
   */
  private static parseSylectusLocation(locationText: string): {
    city: string;
    state: string;
    zipCode?: string;
    fullAddress: string;
  } {
    if (!locationText)
      return { city: '', state: '', fullAddress: locationText };

    const parts = locationText.split(',');
    if (parts.length >= 2) {
      const cityPart = parts[0].trim();
      const stateZipPart = parts[1].trim();

      // Match state and zip code - allow for 5-digit zip codes
      const stateZipMatch = stateZipPart.match(/([A-Z]{2})\s+(\d{5})/);

      if (stateZipMatch) {
        return {
          city: cityPart,
          state: stateZipMatch[1],
          zipCode: stateZipMatch[2],
          fullAddress: locationText,
        };
      } else {
        // If no zip code match, just use the state part
        const stateMatch = stateZipPart.match(/([A-Z]{2})/);
        return {
          city: cityPart,
          state: stateMatch?.[1] || stateZipPart,
          fullAddress: locationText,
        };
      }
    }
    return { city: '', state: '', fullAddress: locationText };
  }
}
