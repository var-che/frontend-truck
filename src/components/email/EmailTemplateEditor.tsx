import React, { useState } from "react";
import {
  Button,
  Input,
  List,
  Modal,
  Form,
  Popconfirm,
  Space,
  Typography,
  Empty,
  Tag,
  message as antdMessage,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { EmailTemplate } from "../../types/email";
import { useEmailTemplates } from "../../hooks/useEmailTemplates";
import SlashCommandTextarea from "./SlashCommandTextarea";

const { Text } = Typography;

const EmailTemplateEditor: React.FC = () => {
  const { templates, createTemplate, updateTemplate, deleteTemplate } =
    useEmailTemplates();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [bodyValue, setBodyValue] = useState("");

  const openCreate = () => {
    setEditingId(null);
    setBodyValue("");
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (tpl: EmailTemplate) => {
    setEditingId(tpl.id);
    setBodyValue(tpl.body);
    form.setFieldsValue({ name: tpl.name, subject: tpl.subject });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = { ...values, body: bodyValue };
      if (editingId) {
        updateTemplate(editingId, data);
        antdMessage.success("Template updated.");
      } else {
        createTemplate(data);
        antdMessage.success("Template created.");
      }
      setModalOpen(false);
    } catch {
      // validation error — do nothing
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text strong>Email Templates</Text>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={openCreate}
        >
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Empty description="No templates yet" />
      ) : (
        <List
          dataSource={templates}
          renderItem={(tpl) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(tpl)}
                />,
                <Popconfirm
                  key="del"
                  title="Delete this template?"
                  onConfirm={() => {
                    deleteTemplate(tpl.id);
                    antdMessage.info("Template deleted.");
                  }}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={tpl.name}
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {tpl.subject}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editingId ? "Edit Template" : "New Template"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Save"
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. Load Interest" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input placeholder="Use {{variable}} placeholders" />
          </Form.Item>
          <Form.Item label="Body" required>
            <SlashCommandTextarea
              value={bodyValue}
              onChange={setBodyValue}
              rows={10}
              placeholder="Type '/' to insert a variable…"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmailTemplateEditor;
