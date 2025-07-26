import React from 'react';
import { DatePicker, Typography, Col } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  onDateChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateChange,
}) => {
  return (
    <Col span={24}>
      <Title level={5}>Select Pickup Dates</Title>
      <RangePicker
        value={dateRange}
        onChange={(dates) =>
          onDateChange(dates ? [dates[0], dates[1]] : [null, null])
        }
        format="MM/DD/YYYY"
        placeholder={['Start Date', 'End Date']}
      />
    </Col>
  );
};

export default DateRangePicker;
