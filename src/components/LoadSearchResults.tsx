import React, { useState, useEffect } from 'react';
import { Table, Tabs, Button, Space, Tag, Tooltip } from 'antd';
import {
  ReloadOutlined,
  DollarOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

interface DATMatch {
  matchId: string;
  availability: {
    earliestWhen: string;
    latestWhen: string;
  };
  comments?: string;
  loadBoardRateInfo: {
    nonBookable?: {
      basis: string;
      rateUsd: number;
    };
  };
  matchingAssetInfo: {
    origin: {
      place: {
        city: string;
        stateProv: string;
        postalCode?: string;
      };
    };
    destination: {
      place: {
        city: string;
        stateProv: string;
        postalCode?: string;
      };
    };
    capacity: {
      shipment: {
        fullPartial: string;
        maximumLengthFeet: number;
        maximumWeightPounds: number;
      };
    };
    equipmentType: string;
  };
  originDeadheadMiles: {
    miles: number;
  };
  tripLength: {
    miles: number;
  };
  posterInfo: {
    companyName: string;
    contact: {
      phone?: string;
      email?: string;
    };
    credit?: {
      creditScore: number;
      daysToPay: number;
    };
  };
  postersReferenceId?: string;
}

interface LoadSearchResultsProps {
  lane: {
    id: string;
    searchModuleId?: string;
    datQueryId?: string;
    resultsCount?: number;
    source?: string;
    lastRefreshed?: string;
  };
  searchResults?: any; // The full search result data
}

const LoadSearchResults: React.FC<LoadSearchResultsProps> = ({
  lane,
  searchResults,
}) => {
  const [loads, setLoads] = useState<DATMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract loads from search results
    if (
      searchResults?.rawResponse?.data?.createAssetAndGetMatches
        ?.assetMatchesBody?.matches
    ) {
      const matches =
        searchResults.rawResponse.data.createAssetAndGetMatches.assetMatchesBody
          .matches;
      setLoads(matches);
    }
  }, [searchResults]);

  const refreshResults = async () => {
    setLoading(true);
    // TODO: Implement refresh logic by calling the extension again
    setTimeout(() => setLoading(false), 1000);
  };

  // Table columns for DAT loads
  const columns = [
    {
      title: 'Posted',
      dataIndex: ['availability', 'earliestWhen'],
      key: 'posted',
      render: (text: string) => dayjs(text).format('MM/DD HH:mm'),
      width: '10%',
    },
    {
      title: 'Origin',
      dataIndex: ['matchingAssetInfo', 'origin', 'place'],
      key: 'origin',
      render: (place: any) => (
        <span>
          {place.city}, {place.stateProv}
          {place.postalCode && <br />}
          {place.postalCode && <small>{place.postalCode}</small>}
        </span>
      ),
      width: '15%',
    },
    {
      title: 'Destination',
      dataIndex: ['matchingAssetInfo', 'destination', 'place'],
      key: 'destination',
      render: (place: any) => (
        <span>
          {place.city}, {place.stateProv}
          {place.postalCode && <br />}
          {place.postalCode && <small>{place.postalCode}</small>}
        </span>
      ),
      width: '15%',
    },
    {
      title: 'Company',
      dataIndex: ['posterInfo', 'companyName'],
      key: 'company',
      width: '15%',
    },
    {
      title: 'Contact',
      dataIndex: ['posterInfo', 'contact'],
      key: 'contact',
      render: (contact: any) => (
        <span>
          {contact.phone && <div>📞 {contact.phone}</div>}
          {contact.email && <div>✉️ {contact.email}</div>}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Rate',
      dataIndex: ['loadBoardRateInfo', 'nonBookable'],
      key: 'rate',
      render: (rate: any) => (
        <span>
          {rate?.rateUsd ? (
            <Tag color="green">
              <DollarOutlined /> ${rate.rateUsd.toLocaleString()}
            </Tag>
          ) : (
            <Tag>Call</Tag>
          )}
        </span>
      ),
      width: '10%',
    },
    {
      title: 'Details',
      key: 'details',
      render: (record: DATMatch) => (
        <Space direction="vertical" size="small">
          <div>
            <TruckOutlined /> {record.matchingAssetInfo.equipmentType}
          </div>
          <div>📏 {record.tripLength.miles} mi</div>
          {record.originDeadheadMiles.miles > 0 && (
            <div>🚛 {record.originDeadheadMiles.miles} mi DH</div>
          )}
          <div>
            ⚖️{' '}
            {record.matchingAssetInfo.capacity.shipment.maximumWeightPounds.toLocaleString()}{' '}
            lbs
          </div>
          <div>
            📐 {record.matchingAssetInfo.capacity.shipment.maximumLengthFeet}' (
            {record.matchingAssetInfo.capacity.shipment.fullPartial})
          </div>
        </Space>
      ),
      width: '15%',
    },
    {
      title: 'Credit',
      dataIndex: ['posterInfo', 'credit'],
      key: 'credit',
      render: (credit: any) =>
        credit ? (
          <Space direction="vertical" size="small">
            <Tag
              color={
                credit.creditScore >= 90
                  ? 'green'
                  : credit.creditScore >= 70
                  ? 'orange'
                  : 'red'
              }
            >
              Score: {credit.creditScore}
            </Tag>
            <small>{credit.daysToPay} days to pay</small>
          </Space>
        ) : (
          <Tag color="default">N/A</Tag>
        ),
      width: '8%',
    },
  ];

  const LoadsTable: React.FC<{ data: DATMatch[] }> = ({ data }) => (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="matchId"
      expandable={{
        expandedRowRender: (record) => (
          <div style={{ padding: '8px 0' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {record.comments && (
                <div>
                  <strong>Comments:</strong> {record.comments}
                </div>
              )}
              {record.postersReferenceId && (
                <div>
                  <strong>Reference ID:</strong> {record.postersReferenceId}
                </div>
              )}
              <div>
                <strong>Match ID:</strong> {record.matchId}
              </div>
              <div>
                <strong>Pickup Window:</strong>{' '}
                {dayjs(record.availability.earliestWhen).format(
                  'MM/DD/YYYY HH:mm',
                )}{' '}
                -{' '}
                {dayjs(record.availability.latestWhen).format(
                  'MM/DD/YYYY HH:mm',
                )}
              </div>
            </Space>
          </div>
        ),
        expandRowByClick: true,
      }}
      size="small"
      pagination={{ pageSize: 10, showSizeChanger: true }}
      loading={loading}
      scroll={{ x: 'max-content' }}
    />
  );

  // Filter functions for different categories
  const filterHighRateLoads = () => {
    return loads.filter(
      (load) =>
        load.loadBoardRateInfo?.nonBookable?.rateUsd &&
        load.loadBoardRateInfo.nonBookable.rateUsd >= 1000,
    );
  };

  const filterFullLoads = () => {
    return loads.filter(
      (load) => load.matchingAssetInfo.capacity.shipment.fullPartial === 'FULL',
    );
  };

  const filterPartialLoads = () => {
    return loads.filter(
      (load) =>
        load.matchingAssetInfo.capacity.shipment.fullPartial === 'PARTIAL',
    );
  };

  const headerExtra = (
    <Space>
      <Tooltip title="Last refreshed">
        <small>
          {lane.lastRefreshed
            ? `Updated: ${dayjs(lane.lastRefreshed).format('MM/DD HH:mm')}`
            : 'Not refreshed'}
        </small>
      </Tooltip>
      <Button
        icon={<ReloadOutlined />}
        onClick={refreshResults}
        loading={loading}
        size="small"
      >
        Refresh
      </Button>
    </Space>
  );

  if (!loads.length) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No loads found for this search.</p>
        {lane.resultsCount !== undefined && (
          <p>
            Expected {lane.resultsCount} results from {lane.source}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Tabs
        defaultActiveKey="all"
        tabBarExtraContent={{ right: headerExtra }}
        size="small"
      >
        <TabPane tab={`All Loads (${loads.length})`} key="all">
          <LoadsTable data={loads} />
        </TabPane>
        <TabPane tab={`Full (${filterFullLoads().length})`} key="full">
          <LoadsTable data={filterFullLoads()} />
        </TabPane>
        <TabPane tab={`Partial (${filterPartialLoads().length})`} key="partial">
          <LoadsTable data={filterPartialLoads()} />
        </TabPane>
        <TabPane
          tab={`High Rate (${filterHighRateLoads().length})`}
          key="highRate"
        >
          <LoadsTable data={filterHighRateLoads()} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default LoadSearchResults;
