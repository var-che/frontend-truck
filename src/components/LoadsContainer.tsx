import React, { useState } from 'react';
import { Table, Tabs, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { mockLoads } from '../mocks/loadData';
import dayjs from 'dayjs';
import AddNewSearch from './AddNewSearch';

const { TabPane } = Tabs;

const LoadsContainer: React.FC = () => {
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

  // Filter functions for different time periods
  const filterTodayLoads = () => {
    const today = dayjs().startOf('day');
    return mockLoads.filter((load) =>
      dayjs(load.postedAt).isSame(today, 'day'),
    );
  };

  const filterTomorrowLoads = () => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    return mockLoads.filter((load) =>
      dayjs(load.postedAt).isSame(tomorrow, 'day'),
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
