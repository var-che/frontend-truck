import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Divider, Spin } from 'antd';
import {
  DeleteOutlined,
  CalculatorOutlined,
  EnvironmentOutlined,
  UserOutlined,
  SettingOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { useTrimbleRouting } from '../../../context/routing/TrimbleRoutingContext';
import { RoutingElement } from '../../../types/routing';
import TrimbleWaypointManager from './TrimbleWaypointManager';
import TrimbleRouteOptions from './TrimbleRouteOptions';

const { Title, Text } = Typography;

interface TrimbleRoutingElementProps {
  element: RoutingElement;
}

const TrimbleRoutingElement: React.FC<TrimbleRoutingElementProps> = ({
  element,
}) => {
  const { updateElement, deleteElement, calculateRoute, isCalculating } =
    useTrimbleRouting();
  const [showOptions, setShowOptions] = useState(false);

  const handleNameChange = (value: string) => {
    updateElement(element.id, { driverName: value });
  };

  const handleCalculateRoute = () => {
    calculateRoute(element.id);
  };

  const handleDelete = () => {
    deleteElement(element.id);
  };

  const canCalculateRoute = element.waypoints.length >= 2;

  return (
    <Card
      style={{
        width: 400,
        zIndex: element.zIndex,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #d9d9d9',
      }}
      size="small"
      title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <HolderOutlined
              style={{
                cursor: 'grab',
                color: '#999',
                fontSize: '14px',
              }}
              title="Drag to move card"
              data-drag-handle="true"
            />
            <UserOutlined />
            <Input
              placeholder="Driver/Trip Name"
              value={element.driverName}
              onChange={(e) => handleNameChange(e.target.value)}
              bordered={false}
              style={{ fontWeight: 'bold' }}
            />
          </Space>
        </Space>
      }
      extra={
        <Space>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setShowOptions(!showOptions)}
            size="small"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            danger
            size="small"
          />
        </Space>
      }
    >
      {/* Waypoint Management */}
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
          <EnvironmentOutlined /> Waypoints
        </Title>
        <TrimbleWaypointManager
          elementId={element.id}
          waypoints={element.waypoints}
          route={element.route}
        />
      </div>

      {/* Route Options (collapsible) */}
      {showOptions && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <TrimbleRouteOptions
            elementId={element.id}
            routeOptions={element.routeOptions}
          />
        </>
      )}

      {/* Route Calculation */}
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ textAlign: 'center' }}>
        <Button
          type="primary"
          icon={isCalculating ? <Spin size="small" /> : <CalculatorOutlined />}
          onClick={handleCalculateRoute}
          disabled={!canCalculateRoute || isCalculating}
          loading={isCalculating}
          block
        >
          {isCalculating ? 'Calculating Route...' : 'Calculate Route'}
        </Button>

        {!canCalculateRoute && (
          <Text
            type="secondary"
            style={{ fontSize: '12px', marginTop: 4, display: 'block' }}
          >
            Add at least 2 waypoints to calculate route
          </Text>
        )}

        {element.route && (
          <div style={{ marginTop: 8, textAlign: 'left' }}>
            <Text strong style={{ color: '#52c41a' }}>
              Route Summary:
            </Text>
            <br />
            <Text style={{ fontSize: '12px' }}>
              Distance: {element.route.totalDistance.toFixed(1)} mi
            </Text>
            <br />
            <Text style={{ fontSize: '12px' }}>
              Time:{' '}
              {element.route.totalTime
                ? `${Math.floor(element.route.totalTime / 60)}h ${
                    element.route.totalTime % 60
                  }m`
                : 'N/A'}
            </Text>
            <br />
            <Text style={{ fontSize: '12px' }}>
              Fuel Cost: ${element.route.fuelCost?.toFixed(2) || 'N/A'}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TrimbleRoutingElement;
