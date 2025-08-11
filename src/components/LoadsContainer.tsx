import React, { useState, useMemo } from 'react';
import { Table, Tabs, Button, Tag } from 'antd';
import { PlusOutlined, DollarOutlined } from '@ant-design/icons';
import { mockLoads } from '../mocks/loadData';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AddNewSearch from './AddNewSearch';
import { useSearchResults } from '../context/SearchResultsContext';

dayjs.extend(isBetween);

const { TabPane } = Tabs;

interface LoadsContainerProps {
  driverId?: string; // Made optional since we're now focusing on search results
  originStates?: string[];
  destinationStates?: string[];
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  // New props for individual search result display
  searchModuleId?: string;
  searchResult?: any; // The specific search result to display
  title?: string; // Title for this container
}

const LoadsContainer: React.FC<LoadsContainerProps> = ({
  driverId = 'general',
  originStates,
  destinationStates,
  dateRange,
  searchModuleId,
  searchResult,
  title,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { datResults, sylectusResults } = useSearchResults();

  // Convert search results to load format (both DAT and Sylectus)
  const convertSearchResultsToLoads = useMemo(() => {
    const allLoads: any[] = [];

    // If a specific searchResult is provided, use only that one
    const datResultsToProcess = searchResult ? [searchResult] : datResults;
    const sylectusResultsToProcess = searchResult
      ? [searchResult]
      : sylectusResults;

    // If a specific searchModuleId is provided, filter by it
    const filteredDatResults =
      searchModuleId && searchModuleId !== 'mock'
        ? datResultsToProcess.filter(
            (result) => result.data?.searchModuleId === searchModuleId,
          )
        : datResultsToProcess;

    const filteredSylectusResults =
      searchModuleId && searchModuleId !== 'mock'
        ? sylectusResultsToProcess.filter(
            (result) => result.data?.searchModuleId === searchModuleId,
          )
        : sylectusResultsToProcess;

    // Process DAT results
    filteredDatResults.forEach((result) => {
      if (
        result.success &&
        result.data?.rawResponse?.data?.createAssetAndGetMatches
          ?.assetMatchesBody?.matches
      ) {
        const matches =
          result.data.rawResponse.data.createAssetAndGetMatches.assetMatchesBody
            .matches;

        matches.forEach((match: any) => {
          const load = {
            id: match.matchId,
            postedAt: match.availability.earliestWhen,
            origin: {
              city: match.matchingAssetInfo.origin.place.city,
              state: match.matchingAssetInfo.origin.place.stateProv,
              zipCode: match.matchingAssetInfo.origin.place.postalCode || '',
            },
            destination: {
              city: match.matchingAssetInfo.destination.place.city,
              state: match.matchingAssetInfo.destination.place.stateProv,
              zipCode:
                match.matchingAssetInfo.destination.place.postalCode || '',
            },
            contact: {
              company: match.posterInfo.companyName,
              name: match.posterInfo.companyName, // Use company name as contact name
              phone: match.posterInfo.contact.phone,
              email: match.posterInfo.contact.email,
            },
            rate: match.loadBoardRateInfo?.nonBookable?.rateUsd || 0,
            comment: match.comments || '',
            // Additional fields for filtering and identification
            equipmentType: match.matchingAssetInfo.equipmentType,
            miles: match.tripLength.miles,
            weight:
              match.matchingAssetInfo.capacity.shipment.maximumWeightPounds,
            fullPartial: match.matchingAssetInfo.capacity.shipment.fullPartial,
            deadheadMiles: match.originDeadheadMiles.miles,
            creditScore: match.posterInfo.credit?.creditScore,
            searchModuleId: result.data.searchModuleId,
            source: 'DAT',
          };
          allLoads.push(load);
        });
      }
    });

    // Process Sylectus results
    filteredSylectusResults.forEach((result) => {
      if (result.success && result.data?.loads) {
        result.data.loads.forEach((sylectusLoad: any) => {
          const load = {
            id: sylectusLoad.id,
            postedAt:
              sylectusLoad.postDateTime ||
              sylectusLoad.pickupDateTime ||
              new Date().toISOString(),
            origin: {
              city: sylectusLoad.pickupLocation?.city || '',
              state: sylectusLoad.pickupLocation?.state || '',
              zipCode: sylectusLoad.pickupLocation?.zipCode || '',
            },
            destination: {
              city: sylectusLoad.deliveryLocation?.city || '',
              state: sylectusLoad.deliveryLocation?.state || '',
              zipCode: sylectusLoad.deliveryLocation?.zipCode || '',
            },
            contact: {
              company: sylectusLoad.postedBy || 'Unknown',
              name: sylectusLoad.postedBy || 'Unknown',
              phone: '', // Not available in Sylectus data
              email: '', // Not available in Sylectus data
            },
            rate: 0, // Sylectus amount field may need parsing
            comment: sylectusLoad.otherInfo || '',
            // Additional fields for filtering and identification
            equipmentType: sylectusLoad.vehicleSize || '',
            miles: sylectusLoad.miles || 0,
            weight: sylectusLoad.weight || 0,
            fullPartial: sylectusLoad.loadType || '',
            deadheadMiles: 0, // Not available in Sylectus data
            creditScore: sylectusLoad.daysToPayCredit?.score || '',
            searchModuleId: result.data.searchModuleId,
            source: 'SYLECTUS',
            // Sylectus-specific fields
            refNo: sylectusLoad.refNo,
            orderNo: sylectusLoad.orderNo,
            pieces: sylectusLoad.pieces,
            pickupDateTime: sylectusLoad.pickupDateTime,
            deliveryDateTime: sylectusLoad.deliveryDateTime,
            expiresOn: sylectusLoad.expiresOn,
            bidUrl: sylectusLoad.bidUrl,
            saferUrl: sylectusLoad.saferUrl,
          };
          allLoads.push(load);
        });
      }
    });

    return allLoads;
  }, [datResults, sylectusResults, searchResult, searchModuleId]);

  // Combine real search results with mock data (or use only search results)
  const allLoads = useMemo(() => {
    // Use search results if available, otherwise fall back to mock data
    return convertSearchResultsToLoads.length > 0
      ? convertSearchResultsToLoads
      : mockLoads;
  }, [convertSearchResultsToLoads]);

  // Table columns definition
  const columns = [
    {
      title: 'Posted',
      dataIndex: 'postedAt',
      key: 'postedAt',
      render: (text: string) => dayjs(text).format('MM/DD HH:mm'),
      width: '10%',
    },
    {
      title: 'Origin',
      dataIndex: 'origin',
      key: 'origin',
      render: (origin: any) =>
        `${origin.city}, ${origin.state} ${origin.zipCode}`,
      width: '20%',
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
      render: (dest: any) => `${dest.city}, ${dest.state} ${dest.zipCode}`,
      width: '20%',
    },
    {
      title: 'Company',
      dataIndex: ['contact', 'company'],
      key: 'company',
      width: '20%',
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
      render: (contact: any) => {
        const contactInfo = contact.phone || contact.email;
        return `${contact.name} (${contactInfo})`;
      },
      width: '20%',
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) =>
        rate ? (
          <Tag color="green">
            <DollarOutlined /> ${rate.toLocaleString()}
          </Tag>
        ) : (
          <Tag>Call</Tag>
        ),
      width: '10%',
    },
  ];

  const filterLoadsByDriver = (loads: any[]) => {
    return loads.filter((load: any) => {
      const matchesOrigin =
        !originStates?.length || originStates.includes(load.origin.state);
      const matchesDestination =
        !destinationStates?.length ||
        destinationStates.includes(load.destination.state);
      const withinDateRange =
        !dateRange?.[0] ||
        !dateRange?.[1] ||
        dayjs(load.postedAt).isBetween(dateRange[0], dateRange[1], 'day', '[]');

      return matchesOrigin && matchesDestination && withinDateRange;
    });
  };

  // Filter functions for different time periods
  const filterTodayLoads = () => {
    const today = dayjs().startOf('day');
    return filterLoadsByDriver(
      allLoads.filter((load: any) => dayjs(load.postedAt).isSame(today, 'day')),
    );
  };

  const filterTomorrowLoads = () => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    return filterLoadsByDriver(
      allLoads.filter((load: any) =>
        dayjs(load.postedAt).isSame(tomorrow, 'day'),
      ),
    );
  };

  const filterHighRateLoads = () => {
    return filterLoadsByDriver(
      allLoads.filter((load: any) => load.rate && load.rate >= 1000),
    );
  };

  const LoadsTable: React.FC<{ data: any[] }> = ({ data }) => (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      expandable={{
        expandedRowRender: (record: any) => (
          <div style={{ padding: '8px 0' }}>
            <div>
              <strong>Comment:</strong> {record.comment || 'No comments'}
            </div>
            {record.equipmentType && (
              <div>
                <strong>Equipment:</strong> {record.equipmentType}
              </div>
            )}
            {record.miles && (
              <div>
                <strong>Miles:</strong> {record.miles}
              </div>
            )}
            {record.weight && (
              <div>
                <strong>Weight:</strong> {record.weight.toLocaleString()} lbs
              </div>
            )}
            {record.fullPartial && (
              <div>
                <strong>Load Type:</strong> {record.fullPartial}
              </div>
            )}
            {record.deadheadMiles > 0 && (
              <div>
                <strong>Deadhead:</strong> {record.deadheadMiles} miles
              </div>
            )}
            {record.creditScore && (
              <div>
                <strong>Credit Score:</strong> {record.creditScore}
              </div>
            )}
            {record.source && (
              <div>
                <strong>Source:</strong>{' '}
                <Tag color={record.source === 'DAT' ? 'blue' : 'green'}>
                  {record.source}
                </Tag>
              </div>
            )}
            {record.refNo && (
              <div>
                <strong>Ref No:</strong> {record.refNo}
              </div>
            )}
            {record.orderNo && (
              <div>
                <strong>Order No:</strong> {record.orderNo}
              </div>
            )}
            {record.pieces && (
              <div>
                <strong>Pieces:</strong> {record.pieces}
              </div>
            )}
            {record.pickupDateTime && (
              <div>
                <strong>Pickup Date/Time:</strong> {record.pickupDateTime}
              </div>
            )}
            {record.deliveryDateTime && (
              <div>
                <strong>Delivery Date/Time:</strong> {record.deliveryDateTime}
              </div>
            )}
            {record.bidUrl && (
              <div>
                <strong>Bid URL:</strong>{' '}
                <a
                  href={record.bidUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Place Bid
                </a>
              </div>
            )}
            {record.saferUrl && (
              <div>
                <strong>SAFER Info:</strong>{' '}
                <a
                  href={record.saferUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View SAFER
                </a>
              </div>
            )}
          </div>
        ),
        expandRowByClick: true,
      }}
      size="small"
      pagination={{ pageSize: 20, showSizeChanger: true }}
    />
  );

  const dataSourceLabel = useMemo(() => {
    if (title) {
      return title; // Use provided title
    }

    if (convertSearchResultsToLoads.length > 0) {
      if (searchModuleId && searchModuleId !== 'mock') {
        const totalLoads = convertSearchResultsToLoads.length;
        return `Search Results (ID: ${searchModuleId.slice(
          -8,
        )}, ${totalLoads} loads)`;
      } else {
        const searchCount = datResults.length + sylectusResults.length;
        const totalLoads = convertSearchResultsToLoads.length;
        return `All Search Results (${searchCount} search${
          searchCount !== 1 ? 'es' : ''
        }, ${totalLoads} loads)`;
      }
    }
    return 'Mock Data';
  }, [
    convertSearchResultsToLoads.length,
    datResults.length,
    sylectusResults.length,
    searchModuleId,
    title,
  ]);

  const addButton = (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => setIsModalOpen(true)}
    >
      Add
    </Button>
  );

  return (
    <>
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>{dataSourceLabel}</strong>
            {driverId && driverId !== 'general' && (
              <span style={{ marginLeft: '16px', color: '#666' }}>
                Driver: {driverId}
              </span>
            )}
          </div>
          {searchModuleId && searchModuleId !== 'mock' && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Search ID: {searchModuleId}
            </div>
          )}
        </div>
      </div>
      <Tabs defaultActiveKey="all" tabBarExtraContent={{ right: addButton }}>
        <TabPane tab={`All Loads (${allLoads.length})`} key="all">
          <LoadsTable data={allLoads} />
        </TabPane>
        <TabPane tab={`Today (${filterTodayLoads().length})`} key="today">
          <LoadsTable data={filterTodayLoads()} />
        </TabPane>
        <TabPane
          tab={`Tomorrow (${filterTomorrowLoads().length})`}
          key="tomorrow"
        >
          <LoadsTable data={filterTomorrowLoads()} />
        </TabPane>
        <TabPane
          tab={`High Rate (${filterHighRateLoads().length})`}
          key="highRate"
        >
          <LoadsTable data={filterHighRateLoads()} />
        </TabPane>
      </Tabs>

      <AddNewSearch
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default LoadsContainer;
