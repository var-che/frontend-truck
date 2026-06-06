import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AutoComplete, Input, Tag } from 'antd';
import { debounce } from 'lodash';
import {
  GeocodingService,
  GeocodingProviderType,
  LocationSuggestion,
} from '../../services/geocoding';

export interface LocationResult {
  displayName: string;
  city: string;
  state: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

interface Props {
  placeholder?: string;
  initialValue?: string;
  onSelect: (location: LocationResult | null) => void;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
}

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

/** Returns array of uppercase state codes if all parts are valid US states, else null. */
function parseStateInput(value: string): string[] | null {
  const upper = value.trim().toUpperCase();
  if (!upper) return null;
  const parts = upper.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.every((p) => US_STATES.has(p))) return parts;
  return null;
}

/** Determine if a confirmed value is in "state mode" (no city, all states). */
function isStateModeValue(value: string): boolean {
  return !!parseStateInput(value);
}

const LocationAutocomplete: React.FC<Props> = ({
  placeholder = 'City, State',
  initialValue = '',
  onSelect,
  size = 'small',
  style,
}) => {
  /**
   * confirmedValue: the stored, selected value (shown as chips).
   * searchInput:    what the user is currently typing in the input field.
   * confirmed:      whether a location has been chosen (shows chips).
   */
  const [confirmedValue, setConfirmedValue] = useState(initialValue);
  const [searchInput, setSearchInput] = useState('');
  const [options, setOptions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(() => !!initialValue);

  // Sync when parent changes initialValue (e.g. lane reload)
  useEffect(() => {
    setConfirmedValue(initialValue);
    setConfirmed(!!initialValue);
    setSearchInput('');
  }, [initialValue]);

  const provider = useMemo(
    () => GeocodingService.getProvider(GeocodingProviderType.TRIMBLE_MAPS),
    [],
  );

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query || query.length < 2) {
          setOptions([]);
          setLoading(false);
          return;
        }
        try {
          const suggestions = await provider.searchLocations(query, 8);
          setOptions(suggestions);
        } catch {
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, 400),
    [provider],
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);

    // Ends with comma → user is still typing more states
    if (value.trim().toUpperCase().endsWith(',')) {
      debouncedSearch.cancel();
      setOptions([]);
      setLoading(false);
      return;
    }

    const states = parseStateInput(value);
    if (states) {
      debouncedSearch.cancel();
      setLoading(false);
      const stateValue = states.join(',');
      setOptions([
        {
          id: `state-${stateValue}`,
          label: `${states.join(', ')} — add state`,
          value: stateValue,
          address: stateValue,
          city: '',
          state: stateValue,
          postalCode: '',
          lat: 0,
          lng: 0,
        } as LocationSuggestion,
      ]);
      return;
    }

    if (value) setLoading(true);
    debouncedSearch(value);
  }, [debouncedSearch]);

  /** Clear everything — go back to blank input. */
  const clearAll = useCallback(() => {
    setConfirmedValue('');
    setSearchInput('');
    setOptions([]);
    setConfirmed(false);
    onSelect(null);
  }, [onSelect]);

  const handleSelect = useCallback((_: string, option: any) => {
    const suggestion = option as LocationSuggestion;
    const isStateSuggestion = !suggestion.city && !!suggestion.state && !!parseStateInput(suggestion.state);

    if (isStateSuggestion) {
      // State selection — append to any existing confirmed states
      const incoming = (suggestion.state ?? '').toUpperCase().split(',').map((s: string) => s.trim()).filter(Boolean);
      const existing = confirmed && isStateModeValue(confirmedValue)
        ? (parseStateInput(confirmedValue) || [])
        : [];
      const merged = Array.from(new Set([...existing, ...incoming]));
      const newVal = merged.join(',');

      setConfirmedValue(newVal);
      setConfirmed(true);
      setSearchInput('');
      setOptions([]);
      onSelect({ displayName: newVal, city: '', state: newVal, postalCode: '' });
    } else {
      // City selection — single value, replaces any previous selection
      const display = suggestion.city && suggestion.state
        ? `${suggestion.city}, ${suggestion.state}`
        : suggestion.value || suggestion.label;
      setConfirmedValue(display);
      setConfirmed(true);
      setSearchInput('');
      setOptions([]);
      onSelect({
        displayName: display,
        city: suggestion.city || '',
        state: suggestion.state || '',
        postalCode: suggestion.postalCode || '',
        lat: suggestion.lat,
        lng: suggestion.lng,
      });
    }
  }, [confirmed, confirmedValue, onSelect]);

  /** Remove one state from the confirmed value (or clear entirely if last). */
  const handleRemoveState = useCallback((stateToRemove: string) => {
    const states = parseStateInput(confirmedValue);
    if (!states) { clearAll(); return; }
    const remaining = states.filter((s) => s !== stateToRemove);
    if (remaining.length === 0) { clearAll(); return; }
    const newVal = remaining.join(',');
    setConfirmedValue(newVal);
    onSelect({ displayName: newVal, city: '', state: newVal, postalCode: '' });
  }, [confirmedValue, clearAll, onSelect]);

  const autocompleteOptions = options.map((s) => ({
    ...s,
    value: s.city && s.state ? `${s.city}, ${s.state}` : s.value,
    label: s.city && s.state
      ? `${s.city}, ${s.state}${s.postalCode ? ` (${s.postalCode})` : ''}`
      : s.label,
  }));

  // ── State-mode: chips + always-visible "add more" input ──────────────────
  if (confirmed && confirmedValue && isStateModeValue(confirmedValue)) {
    const states = parseStateInput(confirmedValue) || [];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', ...style }}>
        {states.map((s) => (
          <Tag
            key={s}
            closable
            onClose={(e) => { e.preventDefault(); handleRemoveState(s); }}
            color="blue"
            style={{ margin: 0, userSelect: 'none' }}
          >
            {s}
          </Tag>
        ))}
        {/* Input always stays visible so user can keep typing more states */}
        <AutoComplete
          value={searchInput}
          options={autocompleteOptions}
          onSearch={handleSearch}
          onSelect={handleSelect}
          notFoundContent={loading ? 'Searching…' : searchInput.length >= 2 ? 'No results' : null}
          style={{ width: 70 }}
        >
          <Input size={size} placeholder="+ state" style={{ width: 70 }} />
        </AutoComplete>
      </div>
    );
  }

  // ── City-mode: single chip, no extra input ────────────────────────────────
  if (confirmed && confirmedValue) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', ...style }}>
        <Tag
          closable
          onClose={(e) => { e.preventDefault(); clearAll(); }}
          color="geekblue"
          style={{ margin: 0, userSelect: 'none' }}
        >
          {confirmedValue}
        </Tag>
      </div>
    );
  }

  // ── Unconfirmed: plain autocomplete input ─────────────────────────────────
  return (
    <AutoComplete
      value={searchInput}
      options={autocompleteOptions}
      onSearch={handleSearch}
      onSelect={handleSelect}
      style={{ width: '100%', ...style }}
      allowClear
      onClear={clearAll}
      notFoundContent={loading ? 'Searching…' : searchInput.length >= 2 ? 'No results' : null}
    >
      <Input size={size} placeholder={placeholder} />
    </AutoComplete>
  );
};

export default LocationAutocomplete;


