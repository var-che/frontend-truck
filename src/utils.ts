export const DEFAULT_PRECISION = 5;

const ENCODING_TABLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const DECODING_TABLE = [
  62, -1, -1, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
  -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, -1, -1, -1, -1, 63, -1, 26, 27, 28, 29, 30, 31, 32, 33,
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
];

const FORMAT_VERSION = 1;

export const ABSENT = 0;
export const LEVEL = 1;
export const ALTITUDE = 2;
export const ELEVATION = 3;
export const CUSTOM1 = 6;
export const CUSTOM2 = 7;

const Num = typeof BigInt !== 'undefined' ? BigInt : Number;

interface Header {
  precision: number;
  thirdDim: number;
  thirdDimPrecision: number;
}

interface DecodedPolyline extends Header {
  polyline: number[][];
}

interface EncodeInput {
  precision?: number;
  thirdDim?: number;
  thirdDimPrecision?: number;
  polyline: number[][];
}

export function decode(encoded: string): DecodedPolyline {
  const decoder = decodeUnsignedValues(encoded);
  const header = decodeHeader(decoder[0], decoder[1]);

  const factorDegree = 10 ** header.precision;
  const factorZ = 10 ** header.thirdDimPrecision;
  const { thirdDim } = header;

  let lastLat = 0;
  let lastLng = 0;
  let lastZ = 0;
  const res: number[][] = [];

  let i = 2;
  for (; i < decoder.length; ) {
    const deltaLat = toSigned(decoder[i]);
    const deltaLng = toSigned(decoder[i + 1]);
    lastLat += deltaLat;
    lastLng += deltaLng;

    if (thirdDim) {
      const deltaZ = toSigned(decoder[i + 2]);
      lastZ += deltaZ;
      res.push([
        lastLat / factorDegree,
        lastLng / factorDegree,
        lastZ / factorZ,
      ]);
      i += 3;
    } else {
      res.push([lastLat / factorDegree, lastLng / factorDegree]);
      i += 2;
    }
  }

  if (i !== decoder.length) {
    throw new Error('Invalid encoding. Premature ending reached');
  }

  return {
    ...header,
    polyline: res,
  };
}

function decodeChar(char: string): number {
  const charCode = char.charCodeAt(0);
  return DECODING_TABLE[charCode - 45];
}

function decodeUnsignedValues(encoded: string): bigint[] | number[] {
  let result = Num(0);
  let shift = Num(0);
  const resList: number[] = [];

  encoded.split('').forEach((char) => {
    const value = Num(decodeChar(char));
    result =
      Number(result) | ((Number(value) & Number(Num(0x1f))) << Number(shift));
    if ((Number(value) & Number(Num(0x20))) === Number(Num(0))) {
      resList.push(Number(result));
      result = Num(0);
      shift = Num(0);
    } else {
      shift = (shift as any) + Num(5);
    }
  });

  if (shift > 0) {
    throw new Error('Invalid encoding');
  }

  return resList;
}

function decodeHeader(
  version: bigint | number,
  encodedHeader: bigint | number,
): Header {
  if (+version.toString() !== FORMAT_VERSION) {
    throw new Error('Invalid format version');
  }
  const headerNumber = +encodedHeader.toString();
  const precision = headerNumber & 15;
  const thirdDim = (headerNumber >> 4) & 7;
  const thirdDimPrecision = (headerNumber >> 7) & 15;
  return { precision, thirdDim, thirdDimPrecision };
}

function toSigned(val: bigint | number): number {
  let res = Num(val);
  if (Number(res) & Number(Num(1))) {
    res = ~res;
  }
  res = Number(res) >> Number(Num(1));
  return +res.toString();
}

export function encode(input: EncodeInput): string {
  const {
    precision = DEFAULT_PRECISION,
    thirdDim = ABSENT,
    thirdDimPrecision = 0,
    polyline,
  } = input;

  const multiplierDegree = 10 ** precision;
  const multiplierZ = 10 ** thirdDimPrecision;
  const encodedHeaderList = encodeHeader(
    precision,
    thirdDim,
    thirdDimPrecision,
  );
  const encodedCoords: string[] = [];

  let lastLat = Num(0);
  let lastLng = Num(0);
  let lastZ = Num(0);

  polyline.forEach((location) => {
    const lat = Num(Math.round(location[0] * multiplierDegree));
    encodedCoords.push(encodeScaledValue(Number(lat) - Number(lastLat)));
    lastLat = lat;

    const lng = Num(Math.round(location[1] * multiplierDegree));
    encodedCoords.push(encodeScaledValue(Number(lng) - Number(lastLng)));
    lastLng = lng;

    if (thirdDim) {
      const z = Num(Math.round(location[2] * multiplierZ));
      encodedCoords.push(encodeScaledValue(Number(z) - Number(lastZ)));
      lastZ = z;
    }
  });

  return [...encodedHeaderList, ...encodedCoords].join('');
}

function encodeHeader(
  precision: number,
  thirdDim: number,
  thirdDimPrecision: number,
): string[] {
  if (precision < 0 || precision > 15) {
    throw new Error('precision out of range. Should be between 0 and 15');
  }
  if (thirdDimPrecision < 0 || thirdDimPrecision > 15) {
    throw new Error(
      'thirdDimPrecision out of range. Should be between 0 and 15',
    );
  }
  if (thirdDim < 0 || thirdDim > 7 || thirdDim === 4 || thirdDim === 5) {
    throw new Error('thirdDim should be between 0, 1, 2, 3, 6 or 7');
  }

  const res = (thirdDimPrecision << 7) | (thirdDim << 4) | precision;
  return [encodeUnsignedNumber(FORMAT_VERSION), encodeUnsignedNumber(res)];
}

function encodeUnsignedNumber(val: number): string {
  let res = '';
  let numVal = Num(val);
  while (Number(numVal) > 0x1f) {
    const pos = (Number(numVal) & 0x1f) | 0x20;
    res += ENCODING_TABLE[pos];
    numVal = Num(Number(numVal) >> 5);
  }
  return res + ENCODING_TABLE[Number(numVal)];
}

function encodeScaledValue(value: bigint | number): string {
  let numVal = Num(value);
  const negative = numVal < 0;
  numVal = Number(numVal) << 1;
  if (negative) {
    numVal = ~numVal;
  }

  return encodeUnsignedNumber(Number(numVal));
}

/**
 * Generate a unique search module ID
 * Format: SM_[timestamp]_[random] (e.g., SM_1642601234567_abc123)
 */
export const generateSearchModuleId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `SM_${timestamp}_${random}`;
};

/**
 * Extract timestamp from search module ID
 */
export const getSearchModuleTimestamp = (searchModuleId: string): number => {
  const parts = searchModuleId.split('_');
  if (parts.length >= 2 && parts[0] === 'SM') {
    return parseInt(parts[1], 10);
  }
  return 0;
};
