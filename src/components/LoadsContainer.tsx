import React, { useState } from 'react';
import { Table, Typography } from 'antd';
import { mockLoads } from '../mocks/loadData';
import dayjs from 'dayjs';

const { Text } = Typography;

const LoadsContainer: React.FC = () => {
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

  return (
    <Table
      dataSource={mockLoads}
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
};

export default LoadsContainer;
