import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { USAMap, StateAbbreviations } from '@mirawision/usa-map-react';

const { Title } = Typography;

interface MapSettings {
  [stateCode: string]: {
    fill?: string;
    stroke?: string;
    onClick?: () => void;
  };
}

interface StateMapSelectorProps {
  title: string;
  selectedStates: string[];
  onStateToggle: (state: string) => void;
  onStateRemove: (state: string) => void;
  fillColor: string;
  strokeColor: string;
  selectedBadgeColor: string;
}

const StateMapSelector: React.FC<StateMapSelectorProps> = ({
  title,
  selectedStates,
  onStateToggle,
  onStateRemove,
  fillColor,
  strokeColor,
  selectedBadgeColor,
}) => {
  const mapSettings = useMemo<MapSettings>(() => {
    const settings: MapSettings = {};
    StateAbbreviations.forEach((state) => {
      settings[state] = {
        fill: selectedStates.includes(state) ? fillColor : undefined,
        stroke: selectedStates.includes(state) ? strokeColor : undefined,
        onClick: () => onStateToggle(state),
      };
    });
    return settings;
  }, [selectedStates, fillColor, strokeColor, onStateToggle]);

  return (
    <div>
      <Title level={5}>{title}</Title>
      <div style={{ height: '300px' }}>
        <USAMap customStates={mapSettings} />
      </div>
      {selectedStates.length > 0 && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            background: '#f5f5f5',
            borderRadius: '4px',
          }}
        >
          <strong>Selected {title.toLowerCase()}:</strong>{' '}
          {selectedStates.map((state) => (
            <span
              key={state}
              style={{
                display: 'inline-block',
                margin: '0 4px',
                padding: '2px 8px',
                background: selectedBadgeColor,
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => onStateRemove(state)}
            >
              {state} ×
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default StateMapSelector;
