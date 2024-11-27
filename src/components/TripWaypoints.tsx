import React, { useState, useEffect } from 'react';
import { Collapse, Input, Button, List } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Panel } = Collapse;

interface SortableItemProps {
  id: string;
  index: number;
  handleRemoveWaypoint: (index: number) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  index,
  handleRemoveWaypoint,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <List.Item
        actions={[
          <CloseOutlined
            key="delete"
            onClick={() => handleRemoveWaypoint(index)}
          />,
        ]}
      >
        {id}
      </List.Item>
    </div>
  );
};

const TripWaypoints: React.FC<{ driverId: string }> = ({ driverId }) => {
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    const savedWaypoints = localStorage.getItem(`waypoints-${driverId}`);
    if (savedWaypoints) {
      setWaypoints(JSON.parse(savedWaypoints));
    }
  }, [driverId]);

  const saveWaypoints = (newWaypoints: string[]) => {
    setWaypoints(newWaypoints);
    localStorage.setItem(`waypoints-${driverId}`, JSON.stringify(newWaypoints));
  };

  const handleAddWaypoint = () => {
    if (inputValue.trim()) {
      const newWaypoints = [...waypoints, inputValue.trim()];
      saveWaypoints(newWaypoints);
      setInputValue('');
    }
  };

  const handleRemoveWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    saveWaypoints(newWaypoints);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddWaypoint();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: { active: any; over: any }) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const newWaypoints = arrayMove(
        waypoints,
        waypoints.indexOf(active.id),
        waypoints.indexOf(over.id),
      );
      saveWaypoints(newWaypoints);
    }
  };

  return (
    <Collapse defaultActiveKey={['1']}>
      <Panel header="Trip Waypoints" key="1">
        <div style={{ padding: '10px' }}>
          <Input
            size="small"
            placeholder="Enter city name"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            style={{ marginBottom: '10px' }}
            suffix={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleAddWaypoint}
              />
            }
          />
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={waypoints}
              strategy={verticalListSortingStrategy}
            >
              {waypoints.map((item, index) => (
                <SortableItem
                  key={item}
                  id={item}
                  index={index}
                  handleRemoveWaypoint={handleRemoveWaypoint}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </Panel>
    </Collapse>
  );
};

export default TripWaypoints;
