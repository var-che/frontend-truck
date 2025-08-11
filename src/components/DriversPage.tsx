import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Typography,
  Row,
  Col,
  message,
  Popconfirm,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  TruckOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  Driver,
  DriverFormData,
  TruckType,
  DriverStatus,
} from '../types/driver';
import DriverService from '../services/DriverService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const driversData = await DriverService.getAllDrivers();
      setDrivers(driversData);
    } catch (error) {
      message.error('Failed to load drivers');
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const truckTypes: { value: TruckType; label: string }[] = [
    { value: 'box-truck', label: 'Box Truck' },
    { value: 'semi-trailer', label: 'Semi-Trailer' },
    { value: 'straight-truck', label: 'Straight Truck' },
    { value: 'van', label: 'Van' },
    { value: 'flatbed', label: 'Flatbed' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions: { value: DriverStatus; label: string; color: string }[] =
    [
      { value: 'available', label: 'Available', color: 'green' },
      { value: 'in-transit', label: 'In Transit', color: 'blue' },
      { value: 'loading', label: 'Loading', color: 'orange' },
      { value: 'unloading', label: 'Unloading', color: 'purple' },
      { value: 'maintenance', label: 'Maintenance', color: 'red' },
      { value: 'off-duty', label: 'Off Duty', color: 'gray' },
    ];

  const getStatusColor = (status: DriverStatus): string => {
    return (
      statusOptions.find((option) => option.value === status)?.color ||
      'default'
    );
  };

  const columns: ColumnsType<Driver> = [
    {
      title: 'Driver',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Driver) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <TruckOutlined /> {record.truckNumber}
          </div>
        </div>
      ),
    },
    {
      title: 'Current Location',
      key: 'location',
      render: (_, record: Driver) => (
        <div>
          <div>
            <EnvironmentOutlined /> {record.currentLocation?.city || 'Unknown'},{' '}
            {record.currentLocation?.state || 'Unknown'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.currentLocation?.address || 'No address provided'}
          </div>
        </div>
      ),
    },
    {
      title: 'Truck Equipment',
      key: 'equipment',
      render: (_, record: Driver) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.truckEquipment?.type
              ? `${record.truckEquipment.type.replace('-', ' ').toUpperCase()}${
                  record.truckEquipment.length
                    ? ` - ${record.truckEquipment.length}`
                    : ''
                }`
              : 'Not specified'}
          </div>
          {record.truckEquipment?.capacity && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Capacity: {record.truckEquipment.capacity}
            </div>
          )}
          {record.truckEquipment?.features &&
            record.truckEquipment.features.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                {record.truckEquipment.features.map((feature) => (
                  <Tag
                    key={feature}
                    style={{ margin: '1px', fontSize: '11px' }}
                  >
                    {feature}
                  </Tag>
                ))}
              </div>
            )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: DriverStatus) => (
        <Badge
          status={getStatusColor(status) as any}
          text={
            statusOptions.find((option) => option.value === status)?.label ||
            status
          }
        />
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record: Driver) => (
        <div>
          <div>
            <PhoneOutlined /> {record.contactInfo?.phone || 'No phone'}
          </div>
          {record.contactInfo?.email && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.contactInfo.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Driver) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this driver?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingDriver(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    form.setFieldsValue({
      name: driver.name,
      truckNumber: driver.truckNumber,
      currentLocation: {
        address: driver.currentLocation?.address,
        city: driver.currentLocation?.city,
        state: driver.currentLocation?.state,
        zipCode: driver.currentLocation?.zipCode,
      },
      truckEquipment: {
        type: driver.truckEquipment?.type,
        length: driver.truckEquipment?.length,
        capacity: driver.truckEquipment?.capacity,
        features: driver.truckEquipment?.features,
      },
      status: driver.status,
      contactInfo: {
        phone: driver.contactInfo?.phone,
        email: driver.contactInfo?.email,
      },
      notes: driver.notes,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (driverId: string) => {
    try {
      await DriverService.deleteDriver(driverId);
      setDrivers(drivers.filter((driver) => driver.id !== driverId));
      message.success('Driver deleted successfully');
    } catch (error) {
      message.error('Failed to delete driver');
      console.error('Error deleting driver:', error);
    }
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          setModalLoading(true);
          const driverData: DriverFormData = {
            name: values.name,
            truckNumber: values.truckNumber,
            currentLocation: {
              address: values.currentLocation?.address,
              city: values.currentLocation?.city,
              state: values.currentLocation?.state,
              zipCode: values.currentLocation?.zipCode,
            },
            truckEquipment: {
              type: values.truckEquipment?.type,
              length: values.truckEquipment?.length,
              capacity: values.truckEquipment?.capacity,
              features: values.truckEquipment?.features || [],
            },
            status: values.status,
            contactInfo: {
              phone: values.contactInfo?.phone,
              email: values.contactInfo?.email,
            },
            notes: values.notes,
          };

          if (editingDriver) {
            // Update existing driver
            const updatedDriver = await DriverService.updateDriver(
              editingDriver.id,
              driverData,
            );
            if (updatedDriver) {
              setDrivers(
                drivers.map((driver) =>
                  driver.id === editingDriver.id ? updatedDriver : driver,
                ),
              );
              message.success('Driver updated successfully');
            }
          } else {
            // Add new driver
            const newDriver = await DriverService.createDriver(driverData);
            setDrivers([...drivers, newDriver]);
            message.success('Driver added successfully');
          }

          setIsModalVisible(false);
          form.resetFields();
          setEditingDriver(null);
        } catch (error) {
          message.error('Failed to save driver');
          console.error('Error saving driver:', error);
        } finally {
          setModalLoading(false);
        }
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDriver(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: '24px' }}
      >
        <Col>
          <Title level={2}>Driver Management</Title>
          <Text type="secondary">
            Manage your fleet drivers and truck information
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadDrivers}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size="large"
            >
              Add New Driver
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={drivers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: drivers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} drivers`,
          }}
        />
      </Card>

      <Modal
        title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText={editingDriver ? 'Update' : 'Add'}
        confirmLoading={modalLoading}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Driver Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter driver name' },
                ]}
              >
                <Input placeholder="Enter driver name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Truck Number"
                name="truckNumber"
                rules={[
                  { required: true, message: 'Please enter truck number' },
                ]}
              >
                <Input placeholder="e.g., TRK-001" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Current Location</Title>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Address"
                name={['currentLocation', 'address']}
                rules={[{ required: true, message: 'Please enter address' }]}
              >
                <Input placeholder="Street address" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="City"
                name={['currentLocation', 'city']}
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="State"
                name={['currentLocation', 'state']}
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input placeholder="State" maxLength={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="ZIP Code" name={['currentLocation', 'zipCode']}>
                <Input placeholder="ZIP Code" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Truck Equipment</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Truck Type"
                name={['truckEquipment', 'type']}
                rules={[
                  { required: true, message: 'Please select truck type' },
                ]}
              >
                <Select placeholder="Select truck type">
                  {truckTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Length"
                name={['truckEquipment', 'length']}
                rules={[
                  { required: true, message: 'Please enter truck length' },
                ]}
              >
                <Input placeholder="e.g., 26ft, 53ft" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Capacity" name={['truckEquipment', 'capacity']}>
                <Input placeholder="e.g., 26,000 lbs" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Features" name={['truckEquipment', 'features']}>
                <Select
                  mode="tags"
                  placeholder="Add features (e.g., lift-gate, air-ride)"
                  style={{ width: '100%' }}
                >
                  <Option value="lift-gate">Lift Gate</Option>
                  <Option value="air-ride">Air Ride</Option>
                  <Option value="team-driver">Team Driver</Option>
                  <Option value="refrigerated">Refrigerated</Option>
                  <Option value="hazmat">HazMat Certified</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Status & Contact</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  {statusOptions.map((status) => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Phone"
                name={['contactInfo', 'phone']}
                rules={[
                  { required: true, message: 'Please enter phone number' },
                ]}
              >
                <Input placeholder="Phone number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Email"
                name={['contactInfo', 'email']}
                rules={[{ type: 'email', message: 'Please enter valid email' }]}
              >
                <Input placeholder="Email address" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea
              rows={3}
              placeholder="Additional notes about the driver..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DriversPage;
