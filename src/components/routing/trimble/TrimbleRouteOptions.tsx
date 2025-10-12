import React from 'react';
import { InputNumber, Switch, Typography, Row, Col, Divider } from 'antd';
import { useTrimbleRouting } from '../../../context/routing/TrimbleRoutingContext';
import { RouteOptions } from '../../../types/routing';

const { Title, Text } = Typography;

interface TrimbleRouteOptionsProps {
  elementId: string;
  routeOptions: RouteOptions;
}

const TrimbleRouteOptions: React.FC<TrimbleRouteOptionsProps> = ({
  elementId,
  routeOptions,
}) => {
  const { updateElement } = useTrimbleRouting();

  const handleOptionChange = (updates: Partial<RouteOptions>) => {
    updateElement(elementId, {
      routeOptions: { ...routeOptions, ...updates },
    });
  };

  const handleTruckSpecChange = (field: string, value: number) => {
    handleOptionChange({
      truckSpecs: {
        ...routeOptions.truckSpecs,
        [field]: value,
      },
    });
  };

  return (
    <div>
      <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
        Route Options
      </Title>

      {/* Route Preferences */}
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        <Col span={8}>
          <Text style={{ fontSize: '11px' }}>Avoid Tolls</Text>
          <br />
          <Switch
            size="small"
            checked={routeOptions.avoidTolls}
            onChange={(checked) => handleOptionChange({ avoidTolls: checked })}
          />
        </Col>
        <Col span={8}>
          <Text style={{ fontSize: '11px' }}>Avoid Highways</Text>
          <br />
          <Switch
            size="small"
            checked={routeOptions.avoidHighways}
            onChange={(checked) =>
              handleOptionChange({ avoidHighways: checked })
            }
          />
        </Col>
        <Col span={8}>
          <Text style={{ fontSize: '11px' }}>Avoid Ferries</Text>
          <br />
          <Switch
            size="small"
            checked={routeOptions.avoidFerries}
            onChange={(checked) =>
              handleOptionChange({ avoidFerries: checked })
            }
          />
        </Col>
      </Row>

      <Divider style={{ margin: '8px 0' }} />

      {/* Fuel Settings */}
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Text style={{ fontSize: '11px' }}>Fuel Cost ($/gal)</Text>
          <InputNumber
            size="small"
            style={{ width: '100%' }}
            value={routeOptions.fuelCostPerGallon}
            onChange={(value) =>
              handleOptionChange({ fuelCostPerGallon: value || 3.5 })
            }
            min={1}
            max={10}
            step={0.1}
            precision={2}
          />
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: '11px' }}>MPG</Text>
          <InputNumber
            size="small"
            style={{ width: '100%' }}
            value={routeOptions.mpg}
            onChange={(value) => handleOptionChange({ mpg: value || 6.5 })}
            min={3}
            max={15}
            step={0.1}
            precision={1}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '8px 0' }} />

      {/* Truck Specifications */}
      <Title level={5} style={{ margin: 0, marginBottom: 8, fontSize: '12px' }}>
        Truck Specifications
      </Title>

      <Row gutter={[8, 4]}>
        <Col span={12}>
          <Text style={{ fontSize: '10px' }}>Weight (lbs)</Text>
          <InputNumber
            size="small"
            style={{ width: '100%' }}
            value={routeOptions.truckSpecs.grossWeight}
            onChange={(value) =>
              handleTruckSpecChange('grossWeight', value || 80000)
            }
            min={1000}
            max={120000}
            step={1000}
          />
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: '10px' }}>Length (ft)</Text>
          <InputNumber
            size="small"
            style={{ width: '100%' }}
            value={routeOptions.truckSpecs.length}
            onChange={(value) => handleTruckSpecChange('length', value || 53)}
            min={10}
            max={80}
            step={1}
          />
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: '10px' }}>Width (ft)</Text>
          <InputNumber
            size="small"
            style={{ width: '100%' }}
            value={routeOptions.truckSpecs.width}
            onChange={(value) => handleTruckSpecChange('width', value || 8.5)}
            min={6}
            max={12}
            step={0.1}
            precision={1}
          />
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: '10px' }}>Height (ft)</Text>
          <InputNumber
            size="small"
            style={{ width: '100%' }}
            value={routeOptions.truckSpecs.height}
            onChange={(value) => handleTruckSpecChange('height', value || 13.6)}
            min={8}
            max={16}
            step={0.1}
            precision={1}
          />
        </Col>
      </Row>
    </div>
  );
};

export default TrimbleRouteOptions;
