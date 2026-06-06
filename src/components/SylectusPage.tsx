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
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useChromeMessaging } from '../hooks/useChromeMessaging';
import { useSylectusLanes } from '../hooks/useSylectusLanes';
import { SylectusLaneCard } from './sylectus/SylectusLaneCard';
import { SylectusLoad } from '../types/sylectus';
import ExtensionConnectionStatus from './ExtensionConnectionStatus';
import EmailComposeForm from './email/EmailComposeForm';
import EmailThreadDrawer from './email/EmailThreadDrawer';
import { useEmailThreads } from '../hooks/useEmailThreads';
import { EmailThread } from '../types/email';
import LoadRouteMap from './sylectus/LoadRouteMap';
import { useAuth } from '../context/AuthContext';
import {
  GeocodingService,
  GeocodingProviderType,
} from '../services/geocoding';

const { Title, Text } = Typography;
const { Option } = Select;

// Module-level geocode cache (persists across renders and lane switches)
const geoCache = new Map<string, { lat: number; lng: number } | null>();

// Module-level deadhead result cache: key = "<laneOrigin>|<loadOrigin>" → miles
const dhResultCache = new Map<string, number>();

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
  const cacheKey = `${laneOriginQuery}|${loadOrigin}`;
  const [dh, setDh] = useState<number | null>(() => dhResultCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(false);
  const hasTriedRef = useRef(dh !== null); // skip hover if already cached

  useEffect(() => {
    const cached = dhResultCache.get(`${laneOriginQuery}|${loadOrigin}`);
    if (cached != null) {
      setDh(cached);
      hasTriedRef.current = true;
    } else {
      hasTriedRef.current = false;
      setDh(null);
      setLoading(false);
    }
  }, [laneOriginQuery, loadOrigin]);

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
      if (from && to) {
        const miles = haversineDeadhead(from.lat, from.lng, to.lat, to.lng);
        dhResultCache.set(`${laneOriginQuery}|${loadOrigin}`, miles);
        setDh(miles);
      }
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
      </div>
    ),
  },
  {
    title: 'Destination',
    dataIndex: 'destination',
    key: 'destination',
    width: 180,
    render: (val: string, row: SylectusLoad) => {
      const zip = row.deliveryLocation?.zipCode;
      const cityState = val || 'Open';
      // Build a single line: "CITY, ST 12345" if zip not already in the string
      const display = zip && !cityState.includes(zip) ? `${cityState} ${zip}` : cityState;
      return (
        <div>
          <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{display}</Text>
          {row.dhD && <div style={{ fontSize: 10, color: '#888' }}>DH: {row.dhD}</div>}
        </div>
      );
    },
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
    width: 130,
    render: (val: string) => val ? <Tag color="blue" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{val}</Tag> : '—',
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null);
  const [brokerDetails, setBrokerDetails] = useState<Record<string, Record<string, string>>>({});
  const [brokerLoading, setBrokerLoading] = useState<Record<string, boolean>>({});

  // Tracks which row IDs the user has expanded (viewed) — persists across page navigation via sessionStorage
  const [seenRowIds, setSeenRowIds] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('sylectus_seen_rows');
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  // Auto-off after 15 minutes
  const handleAutoRefreshChange = useCallback((checked: boolean) => {
    setAutoRefresh(checked);
    if (autoRefreshTimerRef.current) clearTimeout(autoRefreshTimerRef.current);
    if (checked) {
      autoRefreshTimerRef.current = setTimeout(() => {
        setAutoRefresh(false);
      }, 15 * 60 * 1000); // 15 minutes
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshTimerRef.current) clearTimeout(autoRefreshTimerRef.current);
    };
  }, []);

  // Email compose drawer state
  const [emailLoad, setEmailLoad] = useState<SylectusLoad | null>(null);
  const [emailTo, setEmailTo] = useState<string>('');
  const { gmailToken, userEmail: gmailUserEmail } = useAuth();
  const [dhMilesCache, setDhMilesCache] = useState<Record<string, number>>({});

  // Email thread drawer state
  const [threadDrawerThread, setThreadDrawerThread] = useState<EmailThread | null>(null);

  const { threads, getThread, saveInitialThread, refreshThread, addReplyToThread } = useEmailThreads();

  const openEmailDrawer = useCallback(async (record: SylectusLoad, brokerEmail?: string) => {
    setEmailLoad(record);
    setEmailTo(brokerEmail || '');
  }, []);

  const openThreadDrawer = useCallback(async (load: SylectusLoad) => {
    const thread = getThread(load.id);
    if (!thread) return;
    setThreadDrawerThread(thread);
  }, [getThread]);

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

  // Compute deadhead miles when email drawer opens (for {{dh_miles}} template var)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!emailLoad || !laneOriginQuery || dhMilesCache[emailLoad.id] != null) return;
    let cancelled = false;
    (async () => {
      try {
        const provider = GeocodingService.getProvider(GeocodingProviderType.TRIMBLE_MAPS);
        const geocode = async (q: string) => {
          if (geoCache.has(q)) return geoCache.get(q)!;
          const r = await provider.geocodeAddress(q);
          const coords = r?.lat != null ? { lat: r.lat, lng: r.lng } : null;
          geoCache.set(q, coords);
          return coords;
        };
        const [from, to] = await Promise.all([geocode(laneOriginQuery), geocode(emailLoad.origin)]);
        if (!cancelled && from && to) {
          setDhMilesCache((prev) => ({ ...prev, [emailLoad.id]: haversineDeadhead(from.lat, from.lng, to.lat, to.lng) }));
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [emailLoad, laneOriginQuery]);

  // Add DH-O column after Origin (index 1), and Contacted column at the end
  const tableColumns = useMemo((): ColumnsType<SylectusLoad> => {
    const dhOCol: ColumnsType<SylectusLoad>[0] = {
      title: 'DH-O',
      key: 'dhO',
      width: 58,
      align: 'center' as const,
      render: (_: any, row: SylectusLoad) => (
        <DhOCell
          loadOrigin={row.pickupLocation?.fullAddress || row.origin}
          laneOriginQuery={laneOriginQuery}
        />
      ),
    };
    const contactedCol: ColumnsType<SylectusLoad>[0] = {
      title: 'Contacted',
      key: 'contacted',
      width: 100,
      align: 'center' as const,
      render: (_: any, row: SylectusLoad) => {
        const thread = threads[row.id];
        if (!thread) return null;
        const count = thread.messages.length;
        const hasReply = thread.messages.some((m) => m.direction === 'received');
        return (
          <Tooltip title={`${count} message${count !== 1 ? 's' : ''}${hasReply ? ' · Reply received!' : ''} — click to view`}>
            <Tag
              color={hasReply ? 'success' : 'blue'}
              style={{ cursor: 'pointer', fontSize: 11 }}
              onClick={(e) => { e.stopPropagation(); openThreadDrawer(row); }}
            >
              <MailOutlined style={{ marginRight: 3 }} />
              Email {count}
            </Tag>
          </Tooltip>
        );
      },
    };
    const cols = [...LOAD_COLUMNS];
    cols.splice(2, 0, dhOCol); // insert between Origin and Destination
    cols.push(contactedCol);
    return cols;
  }, [laneOriginQuery, threads, openThreadDrawer]);

  // Filtered loads for the active lane — shared by table dataSource, Card title, and notes row renderer
  const filteredLoads = useMemo(() => {
    const loads = activeLane?.loads ?? [];
    const sp = activeLane?.searchParams;
    if (!sp) return loads;
    return loads.filter((load) => {
      if (sp.equipmentTypes && sp.equipmentTypes.length > 0) {
        const eq = (load.eq || '').toUpperCase();
        if (sp.equipmentTypes.some((t: string) => { const tu = t.toUpperCase(); return eq === tu || eq.includes(tu); })) return false;
      }
      if (sp.minMiles != null && (load.trip ?? 0) < sp.minMiles) return false;
      if (sp.maxMiles != null && (load.trip ?? 0) > sp.maxMiles) return false;
      return true;
    });
  }, [activeLane?.loads, activeLane?.searchParams]);

  // Custom row renderer: injects a full-width notes strip below rows that have notes
  const tableComponents = useMemo(() => ({
    body: {
      row: (props: React.HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: string }) => {
        const rowKey = props['data-row-key'];
        const record = filteredLoads.find((r) => r.id === rowKey);
        if (record?.notes) {
          return (
            <>
              <tr {...props} />
              <tr>
                <td
                  colSpan={100}
                  style={{
                    padding: '1px 12px 4px 44px',
                    background: '#fffbe6',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: 11,
                    color: '#595959',
                    fontStyle: 'italic',
                    lineHeight: '17px',
                    fontWeight: 400,
                  }}
                >
                  {record.notes}
                </td>
              </tr>
            </>
          );
        }
        return <tr {...props} />;
      },
    },
  }), [filteredLoads]);

  const handleExpand = useCallback((expanded: boolean, record: SylectusLoad) => {
    if (expanded) {
      if (resolvedActiveId) markLoadSeen(resolvedActiveId, record.id);
      fetchBrokerDetails(record);
      setSeenRowIds((prev) => {
        const next = new Set(prev);
        next.add(record.id);
        try { sessionStorage.setItem('sylectus_seen_rows', JSON.stringify(Array.from(next))); } catch { /* ignore */ }
        return next;
      });
    }
    setExpandedRowKeys((prev) =>
      expanded ? [...prev, record.id] : prev.filter((k) => k !== record.id)
    );
  }, [resolvedActiveId, markLoadSeen, fetchBrokerDetails]);

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
                onChange={handleAutoRefreshChange}
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
              {autoRefresh && (
                <Tooltip title="Auto-refresh will turn off automatically after 15 minutes">
                  <Text type="secondary" style={{ fontSize: 11 }}>⏱ 15 min limit</Text>
                </Tooltip>
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
                {filteredLoads.length < activeLane.loads.length
                  ? `${filteredLoads.length} of ${activeLane.loads.length} loads (filtered) · updated ${activeLane.lastRefresh}`
                  : `${activeLane.loads.length} loads · updated ${activeLane.lastRefresh}`}
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
            dataSource={filteredLoads}
            rowKey="id"
            size="small"
            className="sylectus-loads-table"
            components={tableComponents}
            pagination={{ pageSize: 25, size: 'small', showTotal: (t) => `${t} loads` }}
            onRow={(record) => ({
              onClick: () => handleExpand(!expandedRowKeys.includes(record.id), record),
              style: { cursor: 'pointer' },
            })}
            rowClassName={(row, index) => {
              const classes: string[] = [];
              if (index % 2 === 1) classes.push('sylectus-stripe-row');
              if (activeLane?.newLoadIds.has(row.id)) classes.push('sylectus-new-row');
              if (seenRowIds.has(row.id)) classes.push('sylectus-viewed-row');
              return classes.join(' ');
            }}
            expandable={{
              showExpandColumn: false,
              expandedRowKeys,
              onExpand: handleExpand,
              expandedRowRender: (record) => {
                const bd = brokerDetails[record.id];
                const bdLoading = brokerLoading[record.id];
                const brokerEmail = bd?.['E-MAIL'];
                const hazmatText = [record.otherInfo, record.notes].filter(Boolean).join(' ');
                const isHazmat = /\bhaz/i.test(hazmatText);

                return (
                  <div style={{ padding: '10px 16px 14px', background: '#fafafa', borderRadius: 4 }}>

                    {/* TWO-PANEL LAYOUT — Left: info, Right: routing map */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>

                      {/* ── LEFT PANEL: Broker + Load Details ── */}
                      <div style={{
                        width: 220,
                        minWidth: 220,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        fontSize: 12,
                        lineHeight: '22px',
                        background: '#fff',
                        border: '1px solid #e8e8e8',
                        borderRadius: 6,
                        overflow: 'hidden',
                      }}>

                        {/* Broker section */}
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ fontWeight: 600, fontSize: 11, color: '#1677ff', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                            Broker
                          </div>
                          {bdLoading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8c8c8c', fontSize: 11 }}>
                              <Spin size="small" /> Loading…
                            </div>
                          )}
                          {(bd?.['COMPANY NAME'] || record.company) && (
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>{bd?.['COMPANY NAME'] || record.company}</div>
                          )}
                          {bd?.['POSTED BY PHONE'] && (
                            <div>
                              <PhoneOutlined style={{ marginRight: 4, color: '#8c8c8c', fontSize: 11 }} />
                              {bd['POSTED BY PHONE']}
                            </div>
                          )}
                          {brokerEmail && (
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <MailOutlined style={{ marginRight: 4, color: '#8c8c8c', fontSize: 11 }} />
                              <a href={`mailto:${brokerEmail}`} style={{ fontSize: 11 }}>{brokerEmail}</a>
                            </div>
                          )}
                          {bd?.['BROKER MC NUMBER'] && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 11 }}>MC# </Text>
                              {bd['BROKER MC NUMBER']}
                            </div>
                          )}
                          {bd?.['TRANSCREDIT DAYS TO PAY'] && (
                            <div style={{ fontSize: 11 }}>
                              <Text type="secondary">Pay: </Text>
                              {bd['TRANSCREDIT DAYS TO PAY']}d
                              {bd['TRANSCREDIT CREDIT SCORE'] && (
                                <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>{bd['TRANSCREDIT CREDIT SCORE']}</Tag>
                              )}
                            </div>
                          )}
                          {record.saferUrl && (
                            <a href={record.saferUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>
                              SAFER ↗
                            </a>
                          )}
                          {!bd && !bdLoading && (
                            <div style={{ fontSize: 11, color: '#bfbfbf' }}>Broker details loading…</div>
                          )}
                        </div>

                        {/* Load details section */}
                        <div style={{ padding: '8px 12px', flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 11, color: '#1677ff', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                            Load Details
                          </div>
                          <div style={{ fontSize: 11, lineHeight: '21px' }}>
                            <div><Text type="secondary">Pieces: </Text><strong>{record.pieces || '—'}</strong></div>
                            <div><Text type="secondary">Weight: </Text><strong>{record.weight ? `${record.weight.toLocaleString()} lbs` : '—'}</strong></div>
                            <div><Text type="secondary">Length: </Text>{record.length && record.length !== 'N/A' ? record.length : '—'}</div>
                            <div>
                              <Text type="secondary">Hazmat: </Text>
                              {isHazmat ? <Tag color="error" style={{ fontSize: 10 }}>YES</Tag> : '—'}
                            </div>
                            {record.daysToPayCredit?.days != null && (
                              <div>
                                <Text type="secondary">Pay: </Text>
                                {record.daysToPayCredit.days} days
                                {record.daysToPayCredit.score ? ` (${record.daysToPayCredit.score})` : ''}
                              </div>
                            )}
                            {(record.refNo || record.orderNo) && (
                              <div style={{ marginTop: 4, color: '#8c8c8c' }}>
                                {record.refNo && <span>Ref {record.refNo} </span>}
                                {record.orderNo && <span>Ord {record.orderNo}</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Compose email */}
                        <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                          <Button
                            size="small"
                            icon={<MailOutlined />}
                            style={{ width: '100%', fontSize: 11 }}
                            onClick={() => openEmailDrawer(record, brokerEmail)}
                          >
                            Compose Email
                          </Button>
                        </div>
                      </div>

                      {/* ── RIGHT PANEL: Full routing map ── */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <LoadRouteMap
                          key={record.id}
                          origin={record.pickupLocation?.fullAddress || record.origin}
                          destination={record.deliveryLocation?.fullAddress || record.destination}
                          loadId={record.id}
                          userOrigin={laneOriginQuery || undefined}
                        />
                      </div>

                    </div>
                  </div>
                );
              },

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
            dhMiles={emailLoad ? dhMilesCache[emailLoad.id] : undefined}
            dispatcherName={localStorage.getItem('dispatcher_settings_v1') || ''}
            onDone={() => setEmailLoad(null)}
            onSent={({ messageId, threadId, subject, body, to, from, sentAt }) => {
              if (emailLoad) {
                saveInitialThread(emailLoad, threadId, messageId, subject, body, to, from, sentAt);
              }
            }}
          />
        )}
      </Drawer>

      {/* Email thread drawer */}
      {threadDrawerThread && gmailToken && (
        <EmailThreadDrawer
          thread={threadDrawerThread}
          gmailToken={gmailToken}
          userEmail={gmailUserEmail ?? ''}
          open={threadDrawerThread !== null}
          onClose={() => setThreadDrawerThread(null)}
          onRefresh={async () => {
            if (!threadDrawerThread || !gmailToken) return;
            await refreshThread(threadDrawerThread.loadId, gmailToken, gmailUserEmail ?? '');
            // Update the drawer with the refreshed thread from state
            setThreadDrawerThread((prev) =>
              prev ? (threads[prev.loadId] ?? prev) : null
            );
          }}
          onReplySent={(messageId, gmailThreadId, body, to, from, sentAt) => {
            if (threadDrawerThread) {
              addReplyToThread(threadDrawerThread.loadId, messageId, gmailThreadId, body, to, from, sentAt);
              setThreadDrawerThread((prev) =>
                prev ? { ...prev, messages: [...prev.messages, { messageId, gmailThreadId, direction: 'sent', subject: `Re: ${prev.messages[0]?.subject || ''}`, snippet: body.slice(0, 120), body, from, to, sentAt }] } : null
              );
            }
          }}
        />
      )}
    </div>
  );
};

export default SylectusPage;
