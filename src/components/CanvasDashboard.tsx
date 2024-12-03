import React, { useState, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Button, Card, Row, Col } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import TruckInformation from './TruckInformation';
import TripWaypoints from './TripWaypoints';
import HereMap from './HereMap';
import { useMap } from '../context/MapContext';

interface ElementState {
  id: string;
  x: number;
  y: number;
  type: string;
  content: string;
  zIndex: number;
  driverName: string;
  points: Array<{ lat: number; lng: number }>;
}

const CanvasDashboard: React.FC = () => {
  const [elements, setElements] = useState<ElementState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState<number>(0);
  const { isMapVisible, activeWaypoints } = useMap();

  useEffect(() => {
    const savedElements = localStorage.getItem('canvas-elements');
    if (savedElements) {
      try {
        const parsedElements = JSON.parse(savedElements);

        // Initialize or preserve points array
        const elementsWithPoints = parsedElements.map((el: ElementState) => ({
          ...el,
          points: Array.isArray(el.points) ? [...el.points] : [],
        }));

        console.log('Loading elements with points:', elementsWithPoints);
        setElements(elementsWithPoints);
      } catch (error) {
        console.error('Error loading elements:', error);
      }
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

  const handlePointsChange = (
    id: string,
    points: { lat: number; lng: number }[],
  ) => {
    console.log('Points update requested:', { id, points });

    const updatedElements = elements.map((el) =>
      el.id === id
        ? {
            ...el,
            points: [...points],
          }
        : el,
    );

    // Force state update
    setElements((prevElements) => {
      console.log('State update:', {
        prev: prevElements,
        next: updatedElements,
      });
      return [...updatedElements];
    });

    // Ensure localStorage update
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
      points: [],
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
    <div id="canvas-dashboard" style={{ display: 'flex' }}>
      <div style={{ flex: 1, position: 'relative' }}>
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
            <div style={{ position: 'absolute', zIndex: el.zIndex }}>
              <Card
                title={
                  <div
                    className="card-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'move',
                      userSelect: 'none',
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
                style={{ width: 400 }}
              >
                <Row>
                  <Col span={24}>
                    <TruckInformation
                      driverName={el.driverName}
                      onDriverNameChange={(value) =>
                        handleDriverNameChange(el.id, value)
                      }
                    />
                    <TripWaypoints
                      key={`waypoints-${el.id}-${el.points.length}`}
                      driverId={el.id}
                      waypoints={el.points}
                      onPointsChange={(points) =>
                        handlePointsChange(el.id, points)
                      }
                    />
                  </Col>
                </Row>
              </Card>
            </div>
          </Draggable>
        ))}
      </div>
      <div style={{ width: '50%', height: '100vh' }}>
        {isMapVisible && (
          <HereMap
            apiKey="TIAGlD6jic7l9Aa8Of8IFxo3EUemmcZlHm_agfAm6Ew"
            points={activeWaypoints}
          />
        )}
      </div>
    </div>
  );
};

export default CanvasDashboard;
