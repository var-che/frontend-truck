import React, { useState } from 'react';
import {
  Button,
  Badge,
  Tooltip,
  Input,
  Row,
  Col,
  Form,
  DatePicker,
  InputNumber,
  Typography,
  Space,
  Popconfirm,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { SylectusSearchParams } from '../../types/sylectus';
import { SylectusLane } from '../../hooks/useSylectusLanes';
import LocationAutocomplete, { LocationResult } from './LocationAutocomplete';

const { Text } = Typography;

interface Props {
  lane: SylectusLane;
  isActive: boolean;
  onActivate: (id: string) => void;
  onSearch: (id: string, params?: SylectusSearchParams) => void;
  onRemove: (id: string) => void;
  onUpdateParams: (id: string, params: SylectusSearchParams, originDisplay: string, destDisplay: string) => void;
  onRename: (id: string, label: string) => void;
  onClearBadge: (id: string) => void;
  canRemove: boolean;
}

export const SylectusLaneCard: React.FC<Props> = ({
  lane,
  isActive,
  onActivate,
  onSearch,
  onRemove,
  onUpdateParams,
  onRename,
  onClearBadge,
  canRemove,
}) => {
  const [form] = Form.useForm();
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(lane.label);
  const [formOpen, setFormOpen] = useState(!lane.lastRefresh);

  const [originLoc, setOriginLoc] = useState<LocationResult | null>(
    lane.searchParams.fromCity
      ? { displayName: lane.originDisplay, city: lane.searchParams.fromCity, state: lane.searchParams.fromState, postalCode: '' }
      : null
  );
  const [destLoc, setDestLoc] = useState<LocationResult | null>(
    lane.searchParams.toCity
      ? { displayName: lane.destDisplay, city: lane.searchParams.toCity, state: lane.searchParams.toState || '', postalCode: '' }
      : null
  );

  const handleSubmit = () => {
    if (!originLoc) return;
    const values = form.getFieldsValue();
    const [fromDayjs, toDayjs] = values.dateRange || [dayjs(), dayjs()];
    const params: SylectusSearchParams = {
      fromCity: originLoc.city,
      fromState: originLoc.state,
      toCity: destLoc?.city || '',
      toState: destLoc?.state || '',
      miles: values.miles ?? 150,
      fromDate: fromDayjs ? dayjs(fromDayjs).format('MM/DD/YYYY') : dayjs().format('MM/DD/YYYY'),
      toDate: toDayjs ? dayjs(toDayjs).format('MM/DD/YYYY') : dayjs().format('MM/DD/YYYY'),
      loadTypes: [],
      freight: 'Both',
      maxWeight: values.maxWeight ? String(values.maxWeight) : '',
    };
    const originDisplay = originLoc.displayName || `${originLoc.city}, ${originLoc.state}`;
    const destDisplay = destLoc ? (destLoc.displayName || `${destLoc.city}, ${destLoc.state}`) : '';
    onUpdateParams(lane.id, params, originDisplay, destDisplay);
    onSearch(lane.id, params);
    setFormOpen(false);
  };

  const handleLabelSave = () => {
    if (labelDraft.trim()) onRename(lane.id, labelDraft.trim());
    setEditingLabel(false);
  };

  const hasSearch = !!(lane.searchParams.fromCity && lane.searchParams.fromState);
  const routeSummary = hasSearch
    ? `${lane.originDisplay || `${lane.searchParams.fromCity}, ${lane.searchParams.fromState}`} → ${
        lane.destDisplay || lane.searchParams.toCity
          ? lane.destDisplay || `${lane.searchParams.toCity}, ${lane.searchParams.toState}`
          : 'Open'
      }`
    : 'No search set';

  return (
    <div
      style={{
        border: `1.5px solid ${isActive ? '#1677ff' : lane.newCount > 0 ? '#52c41a' : '#e8e8e8'}`,
        borderRadius: 8,
        background: isActive ? '#f0f7ff' : '#fff',
        boxShadow: isActive ? '0 2px 8px rgba(22,119,255,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all 0.2s',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => onActivate(lane.id)}
      onDoubleClick={() => setFormOpen((v) => !v)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <div style={{ flex: '0 0 auto' }} onClick={(e) => e.stopPropagation()}>
          {editingLabel ? (
            <Space size={4}>
              <Input
                size="small"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onPressEnter={handleLabelSave}
                style={{ width: 120 }}
                autoFocus
              />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleLabelSave} />
              <Button size="small" icon={<CloseOutlined />} onClick={() => { setLabelDraft(lane.label); setEditingLabel(false); }} />
            </Space>
          ) : (
            <Space size={4}>
              <Text strong style={{ fontSize: 13, color: isActive ? '#1677ff' : '#222' }}>{lane.label}</Text>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => { e.stopPropagation(); setEditingLabel(true); }}
                style={{ color: '#bbb', padding: '0 2px' }}
              />
            </Space>
          )}
        </div>

        <Text type="secondary" style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {routeSummary}
        </Text>

        {lane.isLoading && <Tag color="processing" style={{ fontSize: 11 }}>Searching…</Tag>}
        {lane.lastRefresh && !lane.isLoading && (
          <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
            {lane.loads.length} loads · {lane.lastRefresh}
          </Text>
        )}

        {lane.newCount > 0 && (
          <Badge
            count={lane.newCount}
            style={{ backgroundColor: '#52c41a', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onClearBadge(lane.id); }}
            title="New loads — click to dismiss"
          />
        )}

        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
          <Tooltip title={formOpen ? 'Hide search' : 'Edit search'}>
            <Button
              size="small"
              type={formOpen ? 'primary' : 'text'}
              icon={formOpen ? <CaretDownOutlined /> : <CaretRightOutlined />}
              onClick={() => setFormOpen((v) => !v)}
            />
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined spin={lane.isLoading} />}
              onClick={() => onSearch(lane.id)}
              disabled={!hasSearch || lane.isLoading}
            />
          </Tooltip>
          {canRemove && (
            <Popconfirm
              title="Remove this lane?"
              onConfirm={() => onRemove(lane.id)}
              okText="Remove"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </div>
      </div>

      {formOpen && (
        <div
          style={{ padding: '0 12px 12px', borderTop: '1px solid #f0f0f0' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Form
            form={form}
            layout="inline"
            onFinish={handleSubmit}
            initialValues={{
              miles: lane.searchParams.miles ?? 150,
              dateRange: [
                lane.searchParams.fromDate
                  ? dayjs(lane.searchParams.fromDate, 'MM/DD/YYYY')
                  : dayjs(),
                lane.searchParams.toDate
                  ? dayjs(lane.searchParams.toDate, 'MM/DD/YYYY')
                  : dayjs(),
              ],
              maxWeight: lane.searchParams.maxWeight ? Number(lane.searchParams.maxWeight) : undefined,
            }}
          >
            <Row gutter={[6, 6]} style={{ width: '100%', marginTop: 10 }}>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 2 }}>Origin *</Text>
                  <LocationAutocomplete
                    placeholder="e.g. Chicago, IL"
                    initialValue={lane.originDisplay || (lane.searchParams.fromCity ? `${lane.searchParams.fromCity}, ${lane.searchParams.fromState}` : '')}
                    onSelect={(loc) => setOriginLoc(loc)}
                    size="small"
                  />
                </div>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 2 }}>Destination (optional)</Text>
                  <LocationAutocomplete
                    placeholder="e.g. Detroit, MI"
                    initialValue={lane.destDisplay || (lane.searchParams.toCity ? `${lane.searchParams.toCity}, ${lane.searchParams.toState}` : '')}
                    onSelect={(loc) => setDestLoc(loc)}
                    size="small"
                  />
                </div>
              </Col>

              <Col xs={12} sm={6} md={2}>
                <div>
                  <Text style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 2 }}>DH Mi</Text>
                  <Form.Item name="miles" style={{ margin: 0 }}>
                    <InputNumber size="small" min={0} max={500} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 2 }}>Date range</Text>
                  <Form.Item name="dateRange" style={{ margin: 0 }}>
                    <DatePicker.RangePicker
                      size="small"
                      style={{ width: '100%' }}
                      format="MM/DD/YYYY"
                    />
                  </Form.Item>
                </div>
              </Col>

              <Col xs={12} sm={6} md={3}>
                <div>
                  <Text style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 2 }}>Max wt (lbs)</Text>
                  <Form.Item name="maxWeight" style={{ margin: 0 }}>
                    <InputNumber size="small" min={0} placeholder="Any" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </Col>

              <Col xs={24} sm={6} md={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  type="primary"
                  size="small"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={lane.isLoading}
                  disabled={!originLoc}
                  style={{ width: '100%' }}
                >
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
          {!originLoc && (
            <Text type="danger" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
              Select an origin city to search
            </Text>
          )}
        </div>
      )}
    </div>
  );
};
