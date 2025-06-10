import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const RegisterPage = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const onFinish = async (values) => {
    const { username, password, email, nickname, phone, gender } = values;
    setLoading(true);
    
    try {
      // 注册
      const userData = {
        username,
        password,
        email,
        nickname: nickname || username, // 如果没有提供昵称，使用用户名
        phone: phone || "",
        gender: gender || "other",
        avatar: ""
      };
      
      await register(userData);
      message.success('注册成功');
      
      // 自动登录
      try {
        await login(username, password);
        navigate('/');
      } catch (loginError) {
        message.info('注册成功，请登录');
        navigate('/login');
      }
    } catch (error) {
      message.error(error.response?.data?.detail || '注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <Card style={{ width: 400, maxWidth: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>注册</Title>
          <Text type="secondary">创建您的小说阅读账户</Text>
        </div>
        
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          scrollToFirstError
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名!' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名 (3-20个字符)" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="nickname"
            rules={[
              { max: 20, message: '昵称最多20个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="昵称 (选填)" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="邮箱" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码!', validateTrigger: 'onBlur' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="手机号 (选填)" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="gender"
          >
            <Select placeholder="性别 (选填)" size="large">
              <Option value="male">男</Option>
              <Option value="female">女</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 6, message: '密码至少6个字符' }
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码 (至少6个字符)" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>
        </Form>
        
        <Divider plain>
          <Text type="secondary">已有账号?</Text>
        </Divider>
        
        <Button 
          block 
          size="large"
          onClick={() => navigate('/login')}
        >
          返回登录
        </Button>
      </Card>
    </div>
  );
};

export default RegisterPage; 