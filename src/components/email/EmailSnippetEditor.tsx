import React, { useState } from "react";
import {
  Button,
  Input,
  Form,
  Popconfirm,
  Space,
  Typography,
  Empty,
  Modal,
  message as antdMessage,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { EmailSnippet } from "../../types/email";
import { useEmailSnippets } from "../../hooks/useEmailSnippets";

const { Text } = Typography;

const EmailSnippetEditor: React.FC = () => {
  const { snippets, createSnippet, updateSnippet, deleteSnippet } = useEmailSnippets();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (s: EmailSnippet) => {
    setEditingId(s.id);
    form.setFieldsValue({ shortcut: s.shortcut, body: s.body });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const shortcut = values.shortcut.replace(/^\//, "").trim();
      if (editingId) {
        updateSnippet(editingId, { shortcut, body: values.body });
        antdMessage.success("Snippet updated.");
      } else {
        createSnippet({ shortcut, body: values.body });
        antdMessage.success("Snippet created.");
      }
      setModalOpen(false);
    } catch {
      // validation error
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text strong>Email Snippets</Text>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
          New Snippet
        </Button>
      </div>

      <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 10 }}>
        Type <code>/shortcut</code> in the email body to instantly insert a snippet.
      </Text>

      {snippets.length === 0 ? (
        <Empty description="No snippets yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          {snippets.map((s) => (
            <div
              key={s.id}
              style={{
                border: "1px solid #e8e8e8",
                borderRadius: 6,
                padding: "8px 10px",
                background: "#fafafa",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <code style={{ fontSize: 12, color: "#1677ff", fontWeight: 600 }}>/{s.shortcut}</code>
                <div style={{ fontSize: 12, color: "#595959", marginTop: 3, whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.body.length > 120 ? s.body.slice(0, 120) + "…" : s.body}
                </div>
              </div>
              <Space size={4}>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(s)} />
                <Popconfirm title="Delete this snippet?" onConfirm={() => deleteSnippet(s.id)} okText="Delete" okButtonProps={{ danger: true }}>
                  <Button size="small" icon={<DeleteOutlined />} danger />
                </Popconfirm>
              </Space>
            </div>
          ))}
        </Space>
      )}

      <Modal
        title={editingId ? "Edit Snippet" : "New Snippet"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Save"
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Shortcut"
            name="shortcut"
            rules={[{ required: true, message: "Enter a shortcut" }]}
            extra='Type this after "/" to insert the snippet. E.g. "mc123" → type /mc123'
          >
            <Input
              addonBefore="/"
              placeholder="mc123"
              style={{ fontFamily: "monospace" }}
            />
          </Form.Item>
          <Form.Item
            label="Snippet Body"
            name="body"
            rules={[{ required: true, message: "Enter the snippet body" }]}
          >
            <Input.TextArea rows={6} placeholder="MC 123456, I have a truck available…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmailSnippetEditor;
