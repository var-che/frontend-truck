import React, { useState, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Button, Card, Row, Col } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import TruckInformation from './TruckInformation';
import TripWaypoints from './TripWaypoints';

interface ElementState {
  id: string;
  x: number;
  y: number;
  type: string;
  content: string;
  zIndex: number;
  driverName: string;
}

const CanvasDashboard: React.FC = () => {
  const [elements, setElements] = useState<ElementState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState<number>(0);

  useEffect(() => {
    const savedElements = localStorage.getItem('canvas-elements');
    if (savedElements) {
      const parsedElements = JSON.parse(savedElements);
      setElements(parsedElements);
      const maxZ = Math.max(
        ...parsedElements.map((el: ElementState) => el.zIndex),
        0,
      );
      setMaxZIndex(maxZ);
    }
  }, []);

  const handleStop = (e: DraggableEvent, data: DraggableData, id: string) => {
    const updatedElements = elements.map((el) =>
      el.id === id ? { ...el, x: data.x, y: data.y } : el,
    );
    setElements(updatedElements);
    localStorage.setItem('canvas-elements', JSON.stringify(updatedElements));
  };

  const handleClick = (id: string) => {
    const newMaxZIndex = maxZIndex + 1;
    const updatedElements = elements.map((el) =>
      el.id === id ? { ...el, zIndex: newMaxZIndex } : el,
    );
    setElements(updatedElements);
    setMaxZIndex(newMaxZIndex);
    localStorage.setItem('canvas-elements', JSON.stringify(updatedElements));
  };

  const handleDriverNameChange = (id: string, value: string) => {
    const updatedElements = elements.map((el) =>
      el.id === id ? { ...el, driverName: value } : el,
    );
    setElements(updatedElements);
    localStorage.setItem('canvas-elements', JSON.stringify(updatedElements));
  };

  const addElement = () => {
    const newElement: ElementState = {
      id: `element-${Date.now()}`,
      x: 0,
      y: 0,
      type: 'card',
      content: 'Drag me',
      zIndex: maxZIndex + 1,
      driverName: '',
    };
    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    setMaxZIndex(maxZIndex + 1);
    localStorage.setItem('canvas-elements', JSON.stringify(updatedElements));
  };

  const deleteElement = (id: string) => {
    const updatedElements = elements.filter((el) => el.id !== id);
    setElements(updatedElements);
    localStorage.setItem('canvas-elements', JSON.stringify(updatedElements));
  };

  return (
    <div
      id="canvas-dashboard"
      style={{
        width: '100%',
        height: '100vh',
        border: '1px solid #ccc',
        position: 'relative',
      }}
    >
      <Button
        type="primary"
        onClick={addElement}
        style={{ position: 'absolute', top: 10, left: 10 }}
      >
        Add Element
      </Button>
      {elements.map((el) => (
        <Draggable
          key={el.id}
          defaultPosition={{ x: el.x, y: el.y }}
          onStop={(e, data) => handleStop(e, data, el.id)}
          handle=".card-header"
        >
          <div
            style={{ position: 'absolute', zIndex: el.zIndex }}
            onClick={() => handleClick(el.id)}
          >
            <Card
              style={{ width: 800 }}
              title={
                <div
                  className="card-header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>Draggable Card</span>
                  <CloseOutlined
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(el.id);
                    }}
                  />
                </div>
              }
              bordered={true}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <TruckInformation
                    driverName={el.driverName}
                    onDriverNameChange={(value) =>
                      handleDriverNameChange(el.id, value)
                    }
                  />
                  <TripWaypoints driverId={el.id} />
                </Col>
                <Col span={12}>
                  <div style={{ padding: '10px' }}>Right-Card-Panel</div>
                </Col>
              </Row>
            </Card>
          </div>
        </Draggable>
      ))}
    </div>
  );
};

export default CanvasDashboard;
