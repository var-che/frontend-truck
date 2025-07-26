import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Tag, Tooltip, Typography } from 'antd';
import {
  CheckCircleOutlined,
  DisconnectOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { ConnectionStatus } from './connection/ConnectionStatus';

const { Text } = Typography;

interface DatConnectionStatusProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

const DatConnectionStatus: React.FC<DatConnectionStatusProps> = ({
  onConnectionChange,
}) => {
  return <ConnectionStatus />;
};

export default DatConnectionStatus;
