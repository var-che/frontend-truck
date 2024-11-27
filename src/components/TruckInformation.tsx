import React from 'react';
import { Input, Row, Col, Collapse } from 'antd';

const { Panel } = Collapse;

interface TruckInformationProps {
  driverName: string;
  onDriverNameChange: (value: string) => void;
}

const TruckInformation: React.FC<TruckInformationProps> = ({
  driverName,
  onDriverNameChange,
}) => {
  return (
    <Collapse defaultActiveKey={['1']}>
      <Panel header="Truck Info" key="1">
        <div style={{ padding: '0px' }}>
          <Input
            size="small"
            placeholder="Driver name"
            value={driverName}
            onChange={(e) => onDriverNameChange(e.target.value)}
          />
          <div style={{ marginTop: '10px' }}>
            <Row gutter={8}>
              <Col span={8}>
                <Input size="small" placeholder="Column 1" />
              </Col>
              <Col span={8}>
                <Input size="small" placeholder="Column 2" />
              </Col>
              <Col span={8}>
                <Input size="small" placeholder="Column 3" />
              </Col>
            </Row>
          </div>
        </div>
      </Panel>
    </Collapse>
  );
};

export default TruckInformation;
