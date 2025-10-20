import React from 'react';
import dayjs from 'dayjs';
import DateRangePicker from '../../../DateRangePicker';

interface SearchDatePickerProps {
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  onDateChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => void;
}

/**
 * SearchDatePicker - Wrapper component for date range selection
 * Provides a clean interface for selecting pickup date ranges
 */
const SearchDatePicker: React.FC<SearchDatePickerProps> = ({
  dateRange,
  onDateChange,
}) => {
  return <DateRangePicker dateRange={dateRange} onDateChange={onDateChange} />;
};

export default SearchDatePicker;
