import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Button,
  Space,
  Typography,
  Select,
  Row,
  Col,
  Divider,
  Switch,
  Badge,
  Table,
  Tag,
  Tooltip,
  Alert,
  Spin,
  Card,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  DownOutlined,
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useChromeMessaging } from '../hooks/useChromeMessaging';
import { useSylectusLanes } from '../hooks/useSylectusLanes';
import { SylectusLaneCard } from './sylectus/SylectusLaneCard';
import { SylectusLoad } from '../types/sylectus';
import ExtensionConnectionStatus from './ExtensionConnectionStatus';
import EmailComposeForm from './email/EmailComposeForm';
import {
  GeocodingService,
  GeocodingProviderType,
} from '../services/geocoding';

const { Title, Text } = Typography;
const { Option } = Select;

// Module-level geocode cache (persists across renders and lane switches)
const geoCache = new Map<string, { lat: number; lng: number } | null>();

function haversineDeadhead(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** Shows computed deadhead miles from lane origin to load pickup on hover. */
const DhOCell: React.FC<{ loadOrigin: string; laneOriginQuery: string }> = ({
  loadOrigin,
  laneOriginQuery,
}) => {
  const [dh, setDh] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const hasTriedRef = useRef(false);

  useEffect(() => {
    hasTriedRef.current = false;
    setDh(null);
    setLoading(false);
  }, [laneOriginQuery]);

  const handleHover = useCallback(async () => {
    if (hasTriedRef.current || !laneOriginQuery || !loadOrigin) return;
    hasTriedRef.current = true;
    setLoading(true);
    try {
      const provider = GeocodingService.getProvider(GeocodingProviderType.TRIMBLE_MAPS);
      const geocode = async (q: string) => {
        if (geoCache.has(q)) return geoCache.get(q)!;
        const r = await provider.geocodeAddress(q);
        const coords = r && r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null;
        geoCache.set(q, coords);
        return coords;
      };
      const [from, to] = await Promise.all([geocode(laneOriginQuery), geocode(loadOrigin)]);
      if (from && to) setDh(haversineDeadhead(from.lat, from.lng, to.lat, to.lng));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [laneOriginQuery, loadOrigin]);

  const color = dh === null ? undefined : dh < 50 ? '#52c41a' : dh < 150 ? '#1677ff' : '#ff4d4f';
  return (
    <div onMouseEnter={handleHover} style={{ minWidth: 46, textAlign: 'center', cursor: 'default' }}>
      {loading ? (
        <Spin size="small" />
      ) : dh !== null ? (
        <Text style={{ fontSize: 11, color }}>{dh}mi</Text>
      ) : (
        <Text type="secondary" style={{ fontSize: 11 }}>—</Text>
      )}
    </div>
  );
};

const REFRESH_OPTIONS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
];

const LOAD_COLUMNS: ColumnsType<SylectusLoad> = [
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 72,
    sorter: (a, b) => (a.age || '').localeCompare(b.age || ''),
    render: (val: string) => (
      <Tag color={val?.includes('min') ? 'red' : val?.includes('hr') ? 'orange' : 'green'} style={{ fontSize: 11 }}>
        {val || '—'}
      </Tag>
    ),
  },
  {
    title: 'Origin',
    dataIndex: 'origin',
    key: 'origin',
    width: 160,
    render: (val: string, row: SylectusLoad) => (
      <div>
        <Text style={{ fontSize: 12 }}>{val || '—'}</Text>
        {row.dhO && <div style={{ fontSize: 10, color: '#888' }}>DH: {row.dhO}</div>}
        {row.notes && (
          <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic', marginTop: 2, maxWidth: 200, whiteSpace: 'normal', lineHeight: '14px' }}>
            {row.notes}
          </div>
        )}
      </div>
    ),
  },
  {
    title: 'Destination',
    dataIndex: 'destination',
    key: 'destination',
    width: 140,
    render: (val: string, row: SylectusLoad) => (
      <div>
        <Text style={{ fontSize: 12 }}>{val || 'Open'}</Text>
        {row.dhD && <div style={{ fontSize: 10, color: '#888' }}>DH: {row.dhD}</div>}
      </div>
    ),
  },
  {
    title: 'Pickup / Delivery',
    key: 'pickupDelivery',
    width: 140,
    render: (_: any, row: SylectusLoad) => (
      <div style={{ fontSize: 11, lineHeight: '18px' }}>
        <div>{row.pickUp || '—'}</div>
        {row.deliveryDateTime && (
          <div style={{ color: '#888' }}>{row.deliveryDateTime}</div>
        )}
      </div>
    ),
  },
  {
    title: 'Miles',
    dataIndex: 'trip',
    key: 'trip',
    width: 65,
    align: 'right' as const,
    sorter: (a, b) => (a.trip || 0) - (b.trip || 0),
    render: (val: number) => <Text strong>{val ? val.toLocaleString() : '—'}</Text>,
  },
  {
    title: 'Rate',
    dataIndex: 'rate',
    key: 'rate',
    width: 90,
    align: 'right' as const,
    render: (val: string) => (
      <Text strong style={{ color: val && val !== 'N/A' ? '#52c41a' : '#999' }}>{val || '—'}</Text>
    ),
  },
  {
    title: 'Eq',
    dataIndex: 'eq',
    key: 'eq',
    width: 75,
    render: (val: string) => val ? <Tag color="blue" style={{ fontSize: 11 }}>{val}</Tag> : '—',
  },
  {
    title: 'Specs',
    key: 'specs',
    width: 120,
    render: (_: any, row: SylectusLoad) => (
      <div style={{ fontSize: 10, color: '#555', lineHeight: '16px' }}>
        {row.length ? <div>Len: {row.length}</div> : null}
        {row.weight ? <div>Wt: {row.weight.toLocaleString()} lbs</div> : null}
        {row.pieces ? <div>Pcs: {row.pieces}</div> : null}
      </div>
    ),
  },
  {
    title: 'Company',
    dataIndex: 'company',
    key: 'company',
    width: 150,
    ellipsis: true,
    render: (val: string, row: SylectusLoad) => (
      <div>
        <Text style={{ fontSize: 12 }}>{val || '—'}</Text>
        {row.postedBy && (
          <div style={{ fontSize: 10, color: '#888' }}>
            <PhoneOutlined style={{ marginRight: 3 }} />{row.postedBy}
          </div>
        )}
      </div>
    ),
  },
];

const SylectusPage: React.FC = () => {
  const { sendMessageToExtension, extensionConnected } = useChromeMessaging();
  const [refreshInterval, setRefreshInterval] = useState(15);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null);
  const [brokerDetails, setBrokerDetails] = useState<Record<string, Record<string, string>>>({});
  const [brokerLoading, setBrokerLoading] = useState<Record<string, boolean>>({});

  // Email drawer state
  const [emailLoad, setEmailLoad] = useState<SylectusLoad | null>(null);
  const [emailTo, setEmailTo] = useState<string>('');
  const [gmailToken, setGmailToken] = useState<string | null>(null);

  const EXTENSION_ID = process.env.REACT_APP_EXTENSION_ID || 'obifncifgmneplklobmfbmhjahjfbkpa';

  const openEmailDrawer = useCallback(async (record: SylectusLoad, brokerEmail?: string) => {
    setEmailLoad(record);
    setEmailTo(brokerEmail || '');
    // Fetch Gmail token if not already cached
    if (!gmailToken && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        const res: any = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(EXTENSION_ID, { type: 'GMAIL_GET_TOKEN' }, (r) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(r);
          });
        });
        if (res?.success && res?.token) setGmailToken(res.token);
      } catch {
        // token fetch failed — compose form will show connect prompt
      }
    }
  }, [gmailToken, EXTENSION_ID]);

  const fetchBrokerDetails = useCallback(async (record: SylectusLoad) => {
    if (!record.pronumuk || !record.mabcode || !record.postedby) return;
    if (brokerDetails[record.id] || brokerLoading[record.id]) return;
    setBrokerLoading((prev) => ({ ...prev, [record.id]: true }));
    try {
      const resp = await sendMessageToExtension({
        type: 'SYLECTUS_GET_BROKER_DETAILS',
        pronumuk: record.pronumuk,
        mabcode: record.mabcode,
        postedby: record.postedby,
      });
      if (resp?.success && resp.details) {
        setBrokerDetails((prev) => ({ ...prev, [record.id]: resp.details }));
      }
    } catch {
      // silently fail — expanded row just won't show broker section
    } finally {
      setBrokerLoading((prev) => ({ ...prev, [record.id]: false }));
    }
  }, [sendMessageToExtension, brokerDetails, brokerLoading]);

  const {
    lanes,
    addLane,
    removeLane,
    updateSearchParams,
    renameLane,
    searchLane,
    clearNewBadge,
    markLoadSeen,
  } = useSylectusLanes(
    extensionConnected ? sendMessageToExtension : null,
    autoRefresh ? refreshInterval : 999999,
  );

  // Auto-select first lane
  const resolvedActiveId = activeLaneId && lanes.find((l) => l.id === activeLaneId)
    ? activeLaneId
    : lanes[0]?.id ?? null;

  const activeLane = lanes.find((l) => l.id === resolvedActiveId) ?? null;

  // Build the DH-O column query from the active lane's origin city
  const laneOriginQuery = activeLane?.searchParams.fromCity
    ? `${activeLane.searchParams.fromCity}, ${activeLane.searchParams.fromState}`
    : '';

  // Add DH-O column after Origin (index 1)
  const tableColumns = useMemo((): ColumnsType<SylectusLoad> => {
    const dhOCol: ColumnsType<SylectusLoad>[0] = {
      title: 'DH-O',
      key: 'dhO',
      width: 58,
      align: 'center' as const,
      render: (_: any, row: SylectusLoad) => (
        <DhOCell loadOrigin={row.origin} laneOriginQuery={laneOriginQuery} />
      ),
    };
    const cols = [...LOAD_COLUMNS];
    cols.splice(2, 0, dhOCol); // insert between Origin and Destination
    return cols;
  }, [laneOriginQuery]);

  const handleActivate = useCallback((id: string) => {
    setActiveLaneId(id);
    clearNewBadge(id);
  }, [clearNewBadge]);

  const totalNewCount = lanes.reduce((sum, l) => sum + l.newCount, 0);

  const handleRefreshAll = () => {
    lanes.forEach((l) => {
      if (l.searchParams.fromState) searchLane(l.id);
    });
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '8px 0 40px' }}>
      {/* Page header */}
      <Row align="middle" justify="space-between" style={{ marginBottom: 8 }}>
        <Col>
          <Space align="center" size={10}>
            <Title level={4} style={{ margin: 0 }}>Sylectus</Title>
            {totalNewCount > 0 && (
              <Badge count={totalNewCount} style={{ backgroundColor: '#52c41a' }} title={`${totalNewCount} new loads`} />
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
            Click a lane to view its loads below.
          </Text>
        </Col>
        <Col>
          <Space size={8} wrap>
            <Space size={4}>
              <ClockCircleOutlined style={{ color: autoRefresh ? '#1677ff' : '#999' }} />
              <Switch
                size="small"
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren="Auto"
                unCheckedChildren="Manual"
              />
              {autoRefresh && (
                <Select size="small" value={refreshInterval} onChange={setRefreshInterval} style={{ width: 68 }} bordered={false}>
                  {REFRESH_OPTIONS.map((o) => (
                    <Option key={o.value} value={o.value}>{o.label}</Option>
                  ))}
                </Select>
              )}
            </Space>
            <Tooltip title="Refresh all lanes now">
              <Button icon={<ReloadOutlined />} size="small" onClick={handleRefreshAll}>Refresh all</Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={addLane} disabled={lanes.length >= 8}>
              Add lane
            </Button>
          </Space>
        </Col>
      </Row>

      {!extensionConnected && (
        <div style={{ marginBottom: 10 }}>
          <ExtensionConnectionStatus />
        </div>
      )}

      <Divider style={{ margin: '8px 0 12px' }} />

      {/* ── LANES ── */}
      <Space direction="vertical" size={6} style={{ width: '100%', display: 'flex' }}>
        {lanes.map((lane) => (
          <SylectusLaneCard
            key={lane.id}
            lane={lane}
            isActive={lane.id === resolvedActiveId}
            onActivate={handleActivate}
            onSearch={searchLane}
            onRemove={removeLane}
            onUpdateParams={updateSearchParams}
            onRename={renameLane}
            onClearBadge={clearNewBadge}
            canRemove={true}
          />
        ))}
      </Space>

      <Divider style={{ margin: '16px 0 12px' }} />

      {/* ── LOADS TABLE ── */}
      <Card
        size="small"
        title={
          <Space size={8}>
            <Text strong style={{ fontSize: 14 }}>
              {activeLane ? activeLane.label : 'Loads'}
            </Text>
            {activeLane && activeLane.lastRefresh && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {activeLane.loads.length} loads · updated {activeLane.lastRefresh}
              </Text>
            )}
            {(activeLane?.newCount ?? 0) > 0 && (
              <Badge count={activeLane!.newCount} style={{ backgroundColor: '#52c41a' }} />
            )}
          </Space>
        }
        extra={
          activeLane && (
            <Button
              size="small"
              icon={<ReloadOutlined spin={activeLane.isLoading} />}
              onClick={() => searchLane(activeLane.id)}
              disabled={!activeLane.searchParams.fromState || activeLane.isLoading}
            >
              Refresh
            </Button>
          )
        }
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 8 }}
      >
        {activeLane?.error && (
          <Alert message={activeLane.error} type="error" showIcon style={{ margin: 8 }} />
        )}

        {activeLane?.isLoading && activeLane.loads.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Spin tip="Searching Sylectus…" />
          </div>
        ) : (
          <Table<SylectusLoad>
            columns={tableColumns}
            dataSource={activeLane?.loads ?? []}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 25, size: 'small', showTotal: (t) => `${t} loads` }}
            scroll={{ x: 1000 }}
            rowClassName={(row) =>
              activeLane?.newLoadIds.has(row.id) ? 'sylectus-new-row' : ''
            }
            expandable={{
              expandedRowRender: (record) => {
                const bd = brokerDetails[record.id];
                const bdLoading = brokerLoading[record.id];
                return (
                  <div style={{ padding: '8px 16px', background: '#fafafa', borderRadius: 4 }}>
                    <Row gutter={[16, 8]}>
                      {record.notes && (
                        <Col xs={24}>
                          <Text strong>Notes: </Text><Text>{record.notes}</Text>
                        </Col>
                      )}
                      {record.pickupLocation?.fullAddress && (
                        <Col xs={24} md={12}>
                          <Text strong>Pickup: </Text><Text>{record.pickupLocation.fullAddress}</Text>
                        </Col>
                      )}
                      {record.deliveryLocation?.fullAddress && (
                        <Col xs={24} md={12}>
                          <Text strong>Delivery: </Text><Text>{record.deliveryLocation.fullAddress}</Text>
                        </Col>
                      )}
                      {record.refNo && (
                        <Col xs={12} md={6}>
                          <Text strong>Ref#: </Text><Text>{record.refNo}</Text>
                        </Col>
                      )}
                      {record.orderNo && (
                        <Col xs={12} md={6}>
                          <Text strong>Order#: </Text><Text>{record.orderNo}</Text>
                        </Col>
                      )}
                      {record.daysToPayCredit && (
                        <Col xs={12} md={6}>
                          <Text strong>Pay: </Text>
                          <Text>{record.daysToPayCredit.days != null ? `${record.daysToPayCredit.days} days` : '—'}
                            {record.daysToPayCredit.score ? ` (${record.daysToPayCredit.score})` : ''}
                          </Text>
                        </Col>
                      )}
                      {record.saferUrl && (
                        <Col xs={24}>
                          <a href={record.saferUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                            SAFER report
                          </a>
                        </Col>
                      )}

                      {/* Broker profile details */}
                      {bdLoading && (
                        <Col xs={24}>
                          <Spin size="small" style={{ marginRight: 8 }} />
                          <Text type="secondary" style={{ fontSize: 11 }}>Loading broker details…</Text>
                        </Col>
                      )}
                      {bd && (
                        <>
                          <Col xs={24}>
                            <Divider style={{ margin: '6px 0' }} />
                          </Col>
                          {bd['COMPANY NAME'] && (
                            <Col xs={24} md={12}>
                              <Text strong>Company: </Text><Text>{bd['COMPANY NAME']}</Text>
                            </Col>
                          )}
                          {bd['POSTED BY PHONE'] && (
                            <Col xs={12} md={6}>
                              <Text strong>Phone: </Text><Text>{bd['POSTED BY PHONE']}</Text>
                            </Col>
                          )}
                          {bd['E-MAIL'] && (
                            <Col xs={12} md={8}>
                              <Text strong>Email: </Text>
                              <a href={`mailto:${bd['E-MAIL']}`} style={{ fontSize: 12 }}>{bd['E-MAIL']}</a>
                            </Col>
                          )}
                          {bd['BROKER MC NUMBER'] && (
                            <Col xs={12} md={6}>
                              <Text strong>MC#: </Text><Text>{bd['BROKER MC NUMBER']}</Text>
                            </Col>
                          )}
                          {bd['TRANSCREDIT DAYS TO PAY'] && (
                            <Col xs={12} md={6}>
                              <Text strong>Days to pay: </Text><Text>{bd['TRANSCREDIT DAYS TO PAY']}</Text>
                            </Col>
                          )}
                          {bd['TRANSCREDIT CREDIT SCORE'] && (
                            <Col xs={12} md={6}>
                              <Text strong>Credit score: </Text><Text>{bd['TRANSCREDIT CREDIT SCORE']}</Text>
                            </Col>
                          )}
                          {bd['NOTES'] && (
                            <Col xs={24}>
                              <Text strong>Order notes: </Text><Text>{bd['NOTES']}</Text>
                            </Col>
                          )}
                          {bd['COMPANY ADDRESS'] && (
                            <Col xs={24} md={12}>
                              <Text strong>Address: </Text><Text>{bd['COMPANY ADDRESS']}</Text>
                            </Col>
                          )}
                          <Col xs={24} style={{ marginTop: 6 }}>
                            <Button
                              size="small"
                              icon={<MailOutlined />}
                              onClick={() => openEmailDrawer(record, bd['E-MAIL'])}
                            >
                              Compose Email
                            </Button>
                          </Col>
                        </>
                      )}
                      {/* Mail button even without broker details */}
                      {!bd && !bdLoading && (
                        <Col xs={24} style={{ marginTop: 4 }}>
                          <Button
                            size="small"
                            icon={<MailOutlined />}
                            onClick={() => openEmailDrawer(record)}
                          >
                            Compose Email
                          </Button>
                        </Col>
                      )}
                    </Row>
                  </div>
                );
              },
              expandIcon: ({ expanded, onExpand, record }) => (
                <Tooltip title={expanded ? 'Hide details' : 'Show details'}>
                  <DownOutlined
                    onClick={(e) => {
                      if (!expanded && resolvedActiveId) markLoadSeen(resolvedActiveId, record.id);
                      if (!expanded) fetchBrokerDetails(record);
                      onExpand(record, e as any);
                    }}
                    style={{
                      cursor: 'pointer',
                      color: expanded ? '#1677ff' : '#bbb',
                      fontSize: 11,
                      transition: 'transform 0.2s',
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </Tooltip>
              ),
            }}
            locale={{
              emptyText: !activeLane
                ? 'Select a lane above'
                : !activeLane.searchParams.fromCity
                ? 'Click a lane and hit Search to load results'
                : activeLane.lastRefresh
                ? 'No loads found'
                : 'Click Search on a lane to load results',
            }}
          />
        )}
      </Card>

      {/* Email compose drawer */}
      <Drawer
        title={`Compose Email${emailLoad ? ` — ${emailLoad.origin} → ${emailLoad.destination}` : ''}`}
        placement="right"
        width={620}
        open={emailLoad !== null}
        onClose={() => setEmailLoad(null)}
        destroyOnClose
      >
        {emailLoad && (
          <EmailComposeForm
            gmailToken={gmailToken}
            load={emailLoad}
            initialTo={emailTo}
            dispatcherName={localStorage.getItem('dispatcher_settings_v1') || ''}
            onDone={() => setEmailLoad(null)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default SylectusPage;
