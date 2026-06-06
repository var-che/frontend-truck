import React from 'react';
import { Space, Tooltip, Typography } from 'antd';
import { useChromeMessaging } from '../../hooks/useChromeMessaging';

const { Text } = Typography;

const Dot: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: active ? '#52c41a' : '#bfbfbf',
      marginRight: 5,
    }}
  />
);

export const ConnectionStatus = () => {
  const {
    extensionConnected,
    datTabConnected,
    sylectusTabConnected,
  } = useChromeMessaging();

  return (
    <Space size={16} style={{ lineHeight: 1 }}>
      <Tooltip title={extensionConnected ? 'Extension connected' : 'Extension not detected'}>
        <span style={{ cursor: 'default', whiteSpace: 'nowrap' }}>
          <Dot active={extensionConnected} />
          <Text type="secondary" style={{ fontSize: 12 }}>Ext</Text>
        </span>
      </Tooltip>
      <Tooltip title={datTabConnected ? 'DAT tab open' : 'DAT tab not found'}>
        <span style={{ cursor: 'default', whiteSpace: 'nowrap' }}>
          <Dot active={datTabConnected} />
          <Text type="secondary" style={{ fontSize: 12 }}>DAT</Text>
        </span>
      </Tooltip>
      <Tooltip title={sylectusTabConnected ? 'Sylectus tab open' : 'Sylectus tab not found'}>
        <span style={{ cursor: 'default', whiteSpace: 'nowrap' }}>
          <Dot active={sylectusTabConnected} />
          <Text type="secondary" style={{ fontSize: 12 }}>Sylectus</Text>
        </span>
      </Tooltip>
    </Space>
  );
};
