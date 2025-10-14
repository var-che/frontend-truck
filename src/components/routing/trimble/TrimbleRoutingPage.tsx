import React, { useRef, useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import * as TrimbleMaps from '@trimblemaps/trimblemaps-js';
import { useTrimbleRouting } from '../../../context/routing/TrimbleRoutingContext';
import TrimbleRoutingElement from './TrimbleRoutingElement';
import TrimbleMapDisplay from './TrimbleMapDisplay';

const { Text } = Typography;

const TRIMBLE_API_KEY = '299354C7A83A67439273691EA750BB7F';

const TrimbleRoutingPage: React.FC = () => {
  const { elements, addElement, updateElement } = useTrimbleRouting();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<TrimbleMaps.Map | null>(null);

  // Map state
  const [mapDimensions, setMapDimensions] = useState({
    width: 800,
    height: 600,
    x: 50,
    y: 50,
  });

  // Drag state for routing elements
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    elementId: string | null;
    startX: number;
    startY: number;
    initialElementX: number;
    initialElementY: number;
  }>({
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    initialElementX: 0,
    initialElementY: 0,
  });

  // Track which element is currently on top
  const [topElementId, setTopElementId] = useState<string | null>(null);

  // Map resize state
  const [mapResizeState, setMapResizeState] = useState<{
    isResizing: boolean;
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    initialX: number;
    initialY: number;
  }>({
    isResizing: false,
    corner: null,
    startX: 0,
    startY: 0,
    initialWidth: 0,
    initialHeight: 0,
    initialX: 0,
    initialY: 0,
  });

  // Map drag state
  const [mapDragState, setMapDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Map resize handlers
  const handleMapResizeStart = (
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setMapResizeState({
      isResizing: true,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: mapDimensions.width,
      initialHeight: mapDimensions.height,
      initialX: mapDimensions.x,
      initialY: mapDimensions.y,
    });
  };

  const handleMapResize = (e: React.MouseEvent) => {
    if (!mapResizeState.isResizing || !mapResizeState.corner) return;

    const deltaX = e.clientX - mapResizeState.startX;
    const deltaY = e.clientY - mapResizeState.startY;

    let newWidth = mapResizeState.initialWidth;
    let newHeight = mapResizeState.initialHeight;
    let newX = mapResizeState.initialX;
    let newY = mapResizeState.initialY;

    switch (mapResizeState.corner) {
      case 'bottom-right':
        newWidth = Math.max(400, mapResizeState.initialWidth + deltaX);
        newHeight = Math.max(300, mapResizeState.initialHeight + deltaY);
        break;
      case 'bottom-left':
        newWidth = Math.max(400, mapResizeState.initialWidth - deltaX);
        newHeight = Math.max(300, mapResizeState.initialHeight + deltaY);
        newX =
          mapResizeState.initialX + (mapResizeState.initialWidth - newWidth);
        break;
      case 'top-right':
        newWidth = Math.max(400, mapResizeState.initialWidth + deltaX);
        newHeight = Math.max(300, mapResizeState.initialHeight - deltaY);
        newY =
          mapResizeState.initialY + (mapResizeState.initialHeight - newHeight);
        break;
      case 'top-left':
        newWidth = Math.max(400, mapResizeState.initialWidth - deltaX);
        newHeight = Math.max(300, mapResizeState.initialHeight - deltaY);
        newX =
          mapResizeState.initialX + (mapResizeState.initialWidth - newWidth);
        newY =
          mapResizeState.initialY + (mapResizeState.initialHeight - newHeight);
        break;
    }

    setMapDimensions({
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY,
    });
  };

  const handleMapResizeEnd = () => {
    setMapResizeState({
      isResizing: false,
      corner: null,
      startX: 0,
      startY: 0,
      initialWidth: 0,
      initialHeight: 0,
      initialX: 0,
      initialY: 0,
    });
  };

  // Map drag handlers
  const handleMapDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMapDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: mapDimensions.x,
      initialY: mapDimensions.y,
    });
  };

  const handleMapDrag = (e: React.MouseEvent) => {
    if (!mapDragState.isDragging) return;

    const deltaX = e.clientX - mapDragState.startX;
    const deltaY = e.clientY - mapDragState.startY;

    let newX = mapDragState.initialX + deltaX;
    let newY = mapDragState.initialY + deltaY;

    // Constrain to canvas area (with padding)
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight - 60; // Account for toolbar

    newX = Math.max(10, Math.min(newX, canvasWidth - mapDimensions.width - 10));
    newY = Math.max(
      10,
      Math.min(newY, canvasHeight - mapDimensions.height - 10),
    );

    setMapDimensions((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  const handleMapDragEnd = () => {
    setMapDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
    });
  };

  // Drag handlers for routing elements
  const handleMouseDown = (elementId: string, e: React.MouseEvent) => {
    // Bring the clicked element to the front
    setTopElementId(elementId);

    // Only start dragging if the target is the drag handle or card header area
    const target = e.target as HTMLElement;
    const isDragHandle =
      target.closest('.ant-card-head') || target.closest('[data-drag-handle]');

    if (!isDragHandle) return;

    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    e.preventDefault(); // Prevent text selection during drag

    setDragState({
      isDragging: true,
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      initialElementX: element.x,
      initialElementY: element.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.elementId) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    let newX = dragState.initialElementX + deltaX;
    let newY = dragState.initialElementY + deltaY;

    // Allow more flexible dragging - elements can be partially off-screen
    const cardWidth = 400; // Card width from TrimbleRoutingElement
    const cardHeight = 300; // Approximate card height
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight - 60; // Account for toolbar height
    
    // Allow elements to be dragged mostly off-screen (keep at least 50px visible)
    const minVisibleArea = 50;
    newX = Math.max(-cardWidth + minVisibleArea, Math.min(newX, canvasWidth - minVisibleArea));
    newY = Math.max(-cardHeight + minVisibleArea, Math.min(newY, canvasHeight - minVisibleArea));

    updateElement(dragState.elementId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      elementId: null,
      startX: 0,
      startY: 0,
      initialElementX: 0,
      initialElementY: 0,
    });
  };

  // Initialize Trimble Maps
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      try {
        // Set API key for the SDK
        TrimbleMaps.setAPIKey(TRIMBLE_API_KEY);
        TrimbleMaps.setUnit(TrimbleMaps.Common.Unit.ENGLISH);

        // Create map instance
        mapInstance.current = new TrimbleMaps.Map({
          container: mapRef.current,
          center: new TrimbleMaps.LngLat(-95.7129, 37.0902), // Center of US
          zoom: 4,
          style: TrimbleMaps.Common.Style.TRANSPORTATION,
        });

        console.log('Trimble Maps initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Trimble Maps:', error);
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Handle map resize when dimensions change
  useEffect(() => {
    if (mapInstance.current) {
      // Trigger map resize to fit new container dimensions
      setTimeout(() => {
        mapInstance.current?.resize();
      }, 100);
    }
  }, [mapDimensions.width, mapDimensions.height]);

  const handleAddElement = () => {
    addElement();
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Toolbar */}
      <div
        style={{
          height: '60px',
          background: '#fafafa',
          borderBottom: '1px solid #d9d9d9',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '16px',
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddElement}
          size="large"
        >
          Add New Route
        </Button>

        <div style={{ flex: 1 }} />

        <Text type="secondary">Active Routes: {elements.length}</Text>
      </div>

      {/* Canvas Area */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: '#f0f2f5',
          overflow: 'hidden',
          cursor: mapResizeState.isResizing
            ? mapResizeState.corner === 'top-left' ||
              mapResizeState.corner === 'bottom-right'
              ? 'nw-resize'
              : 'ne-resize'
            : mapDragState.isDragging
            ? 'grabbing'
            : 'default',
        }}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleMapResize(e);
          handleMapDrag(e);
        }}
        onMouseUp={() => {
          handleMouseUp();
          handleMapResizeEnd();
          handleMapDragEnd();
        }}
        onMouseLeave={() => {
          handleMouseUp();
          handleMapResizeEnd();
          handleMapDragEnd();
        }}
      >
        {/* Resizable Map Widget */}
        <div
          style={{
            position: 'absolute',
            left: mapDimensions.x,
            top: mapDimensions.y,
            width: mapDimensions.width,
            height: mapDimensions.height,
            border: '2px solid #1890ff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: mapDragState.isDragging
              ? '0 8px 24px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.15)',
            background: '#fff',
            opacity: mapDragState.isDragging ? 0.9 : 1,
            transition: mapDragState.isDragging
              ? 'none'
              : 'box-shadow 0.2s, opacity 0.2s',
          }}
        >
          {/* Map Header */}
          <div
            style={{
              height: '32px',
              background: '#1890ff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: mapDragState.isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
            onMouseDown={handleMapDragStart}
            title="Click and hold to move map"
          >
            <span>Map View</span>
            <Text style={{ color: 'white', fontSize: '12px' }}>
              {mapDimensions.width} × {mapDimensions.height}
            </Text>
          </div>

          {/* Map Container */}
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: 'calc(100% - 32px)',
              background: '#f0f0f0',
            }}
          />

          {/* Resize Handles - All 4 corners */}
          {/* Top-left corner */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: '12px',
              height: '12px',
              background: '#1890ff',
              cursor: 'nw-resize',
              borderRadius: '2px',
              border: '1px solid white',
            }}
            onMouseDown={(e) => handleMapResizeStart('top-left', e)}
          />

          {/* Top-right corner */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              background: '#1890ff',
              cursor: 'ne-resize',
              borderRadius: '2px',
              border: '1px solid white',
            }}
            onMouseDown={(e) => handleMapResizeStart('top-right', e)}
          />

          {/* Bottom-left corner */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '-4px',
              width: '12px',
              height: '12px',
              background: '#1890ff',
              cursor: 'sw-resize',
              borderRadius: '2px',
              border: '1px solid white',
            }}
            onMouseDown={(e) => handleMapResizeStart('bottom-left', e)}
          />

          {/* Bottom-right corner */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              background: '#1890ff',
              cursor: 'nw-resize',
              borderRadius: '2px',
              border: '1px solid white',
            }}
            onMouseDown={(e) => handleMapResizeStart('bottom-right', e)}
          />
        </div>

        {/* Draggable Routing Element Cards */}
        {elements.map((element) => {
          // Calculate z-index based on drag state and top element
          let zIndex = 1000; // Base z-index
          if (element.id === topElementId) {
            zIndex = 1002; // Top element gets highest z-index
          }
          if (dragState.isDragging && dragState.elementId === element.id) {
            zIndex = 1003; // Dragged element gets even higher z-index
          }

          return (
            <div
              key={element.id}
              style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                opacity:
                  dragState.isDragging && dragState.elementId === element.id
                    ? 0.8
                    : 1,
                transition:
                  dragState.isDragging && dragState.elementId === element.id
                    ? 'none'
                    : 'opacity 0.2s',
                zIndex,
              }}
              onMouseDown={(e) => handleMouseDown(element.id, e)}
            >
              <TrimbleRoutingElement element={element} />
            </div>
          );
        })}

        {/* Route Display Overlay */}
        {mapInstance.current && (
          <TrimbleMapDisplay mapInstance={mapInstance.current} />
        )}
      </div>
    </div>
  );
};

export default TrimbleRoutingPage;
