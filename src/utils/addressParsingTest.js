// Test file for Trimble address parsing
// You can run this in the browser console to test address parsing

const testAddressParsing = () => {
  const parseAddressInput = (input) => {
    const trimmed = input.trim();

    // Check for zip code pattern (5 digits or 5+4 format)
    const zipMatch = trimmed.match(/\b(\d{5}(?:-\d{4})?)\b/);
    if (zipMatch) {
      return { zip: zipMatch[1] };
    }

    // Check for city, state pattern (e.g., "Chicago, IL" or "Chicago IL")
    const cityStateMatch = trimmed.match(/^(.+?)[,\s]+([A-Z]{2})\s*$/i);
    if (cityStateMatch) {
      return {
        city: cityStateMatch[1].trim(),
        state: cityStateMatch[2].toUpperCase(),
      };
    }

    // Check for full address with city/state (e.g., "123 Main St, Chicago, IL")
    const fullAddressMatch = trimmed.match(
      /^(.+?),\s*(.+?)[,\s]+([A-Z]{2})\s*$/i,
    );
    if (fullAddressMatch) {
      return {
        address: fullAddressMatch[1].trim(),
        city: fullAddressMatch[2].trim(),
        state: fullAddressMatch[3].toUpperCase(),
      };
    }

    // Default to treating it as a city name
    return { city: trimmed };
  };

  // Test cases
  const testCases = [
    'Chicago IL',
    'Chicago, IL',
    'chicago il',
    '60601',
    '123 Main St, Chicago, IL',
    '123 Main Street, New York, NY',
    'Los Angeles',
    '90210',
    'Miami FL',
  ];

  console.log('Testing address parsing:');
  testCases.forEach((testCase) => {
    const result = parseAddressInput(testCase);
    console.log(`"${testCase}" => `, result);
  });
};

// Uncomment to run test:
// testAddressParsing();
