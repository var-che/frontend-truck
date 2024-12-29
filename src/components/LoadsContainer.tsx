import React, { useState } from 'react';
import { Table, Tabs, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { mockLoads } from '../mocks/loadData';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AddNewSearch from './AddNewSearch';

dayjs.extend(isBetween);

const { TabPane } = Tabs;

interface LoadsContainerProps {
  driverId: string;
  originStates?: string[];
  destinationStates?: string[];
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
}

const LoadsContainer: React.FC<LoadsContainerProps> = ({
  driverId,
  originStates,
  destinationStates,
  dateRange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Table columns definition
  const columns = [
    {
      title: 'Posted',
      dataIndex: 'postedAt',
      key: 'postedAt',
      render: (text: string) => dayjs(text).format('MM/DD HH:mm'),
      width: '10%',
    },
    {
      title: 'Origin',
      dataIndex: 'origin',
      key: 'origin',
      render: (origin: any) =>
        `${origin.city}, ${origin.state} ${origin.zipCode}`,
      width: '20%',
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
      render: (dest: any) => `${dest.city}, ${dest.state} ${dest.zipCode}`,
      width: '20%',
    },
    {
      title: 'Company',
      dataIndex: ['contact', 'company'],
      key: 'company',
      width: '20%',
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
      render: (contact: any) => {
        const contactInfo = contact.phone || contact.email;
        return `${contact.name} (${contactInfo})`;
      },
      width: '20%',
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => (rate ? `$${rate}` : 'Call'),
      width: '10%',
    },
  ];

  const filterLoadsByDriver = (loads: typeof mockLoads) => {
    return loads.filter((load) => {
      const matchesOrigin =
        !originStates?.length || originStates.includes(load.origin.state);
      const matchesDestination =
        !destinationStates?.length ||
        destinationStates.includes(load.destination.state);
      const withinDateRange =
        !dateRange?.[0] ||
        !dateRange?.[1] ||
        dayjs(load.postedAt).isBetween(dateRange[0], dateRange[1], 'day', '[]');

      return matchesOrigin && matchesDestination && withinDateRange;
    });
  };

  // Filter functions for different time periods
  const filterTodayLoads = () => {
    const today = dayjs().startOf('day');
    return filterLoadsByDriver(
      mockLoads.filter((load) => dayjs(load.postedAt).isSame(today, 'day')),
    );
  };

  const filterTomorrowLoads = () => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    return filterLoadsByDriver(
      mockLoads.filter((load) => dayjs(load.postedAt).isSame(tomorrow, 'day')),
    );
  };

  const LoadsTable: React.FC<{ data: typeof mockLoads }> = ({ data }) => (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      expandable={{
        expandedRowRender: (record) => record.comment,
        expandRowByClick: true,
      }}
      size="small"
      pagination={false}
    />
  );

  const addButton = (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => setIsModalOpen(true)}
    >
      Add
    </Button>
  );

  return (
    <>
      <Tabs defaultActiveKey="all" tabBarExtraContent={{ right: addButton }}>
        <TabPane tab={`All Loads (${mockLoads.length})`} key="all">
          <LoadsTable data={mockLoads} />
        </TabPane>
        <TabPane tab={`Today (${filterTodayLoads().length})`} key="today">
          <LoadsTable data={filterTodayLoads()} />
        </TabPane>
        <TabPane
          tab={`Tomorrow (${filterTomorrowLoads().length})`}
          key="tomorrow"
        >
          <LoadsTable data={filterTomorrowLoads()} />
        </TabPane>
      </Tabs>

      <AddNewSearch
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default LoadsContainer;
