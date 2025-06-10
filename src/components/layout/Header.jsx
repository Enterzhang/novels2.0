import React, { useState, useEffect } from 'react';
import { Layout, Menu, Input, Button, Dropdown, Avatar, Space } from 'antd';
import { 
  SearchOutlined, 
  UserOutlined, 
  BookOutlined, 
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { novelApi } from '../../services/api';

const { Header } = Layout;
const { Search } = Input;

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [tags, setTags] = useState([]);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  // 获取标签列表
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await novelApi.getTags();
        setTags(response.tags);
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };

    fetchTags();
  }, []);

  // 搜索处理
  const handleSearch = (value) => {
    if (value.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(value.trim())}`);
    }
  };

  // 退出登录
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 用户菜单
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: <Link to="/profile">个人中心</Link>
      },
      {
        key: 'reading-history',
        icon: <BookOutlined />,
        label: <Link to="/reading-history">阅读历史</Link>
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  };

  // 移动端菜单项
  const getMobileMenuItems = () => {
    const items = [
      {
        key: 'home',
        label: <Link to="/">首页</Link>
      },
      {
        key: 'categories',
        label: '小说分类',
        children: [
          ...tags.slice(0, 10).map(tag => ({
            key: tag,
            label: <Link to={`/category/${encodeURIComponent(tag)}`}>{tag}</Link>
          })),
          {
            key: 'all-categories',
            label: <Link to="/category">全部分类</Link>
          }
        ]
      },
      {
        type: 'divider'
      }
    ];

    if (isAuthenticated) {
      items.push(
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: <Link to="/profile">个人中心</Link>
        },
        {
          key: 'reading-history',
          icon: <BookOutlined />,
          label: <Link to="/reading-history">阅读历史</Link>
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: '退出登录',
          onClick: handleLogout
        }
      );
    } else {
      items.push(
        {
          key: 'login',
          icon: <LoginOutlined />,
          label: <Link to="/login">登录</Link>
        },
        {
          key: 'register',
          icon: <UserAddOutlined />,
          label: <Link to="/register">注册</Link>
        }
      );
    }

    return items;
  };

  // 移动端菜单
  const mobileMenu = {
    items: getMobileMenuItems()
  };

  return (
    <Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '0 16px' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* Logo */}
        <div className="logo" style={{ marginRight: 24 }}>
          <Link to="/" style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
            小说阅读系统
          </Link>
        </div>

        {/* PC端导航 */}
        <div className="pc-nav" style={{ display: 'flex', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <Menu mode="horizontal" defaultSelectedKeys={['home']} style={{ border: 'none' }}
              items={[
                {
                  key: 'home',
                  label: <Link to="/">首页</Link>
                },
                {
                  key: 'categories',
                  label: '小说分类',
                  children: [
                    ...tags.slice(0, 10).map(tag => ({
                      key: tag,
                      label: <Link to={`/category/${encodeURIComponent(tag)}`}>{tag}</Link>
                    })),
                    {
                      key: 'all-categories',
                      label: <Link to="/category">全部分类</Link>
                    }
                  ]
                }
              ]}
            />
          </div>

          {/* 搜索框 */}
          <div style={{ marginRight: 16, display: 'flex', alignItems: 'center' }}>
            <Search
              placeholder="搜索小说名称或作者"
              onSearch={handleSearch}
              style={{ width: 250 }}
            />
          </div>

          {/* 用户区域 */}
          <div>
            {isAuthenticated ? (
              <Dropdown menu={userMenu} trigger={['click']}>
                <div style={{ cursor: 'pointer' }}>
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span>{user?.username}</span>
                  </Space>
                </div>
              </Dropdown>
            ) : (
              <Space>
                <Button type="text" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
                  登录
                </Button>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/register')}>
                  注册
                </Button>
              </Space>
            )}
          </div>
        </div>

        {/* 移动端导航 */}
        <div className="mobile-nav" style={{ display: 'none' }}>
          <Space>
            <Search
              placeholder="搜索"
              onSearch={handleSearch}
              style={{ width: 150 }}
            />
            <Dropdown 
              menu={mobileMenu}
              trigger={['click']}
              open={mobileMenuVisible}
              onOpenChange={setMobileMenuVisible}
            >
              <Button type="text" icon={<MenuOutlined />} />
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* 响应式样式 */}
      <style jsx="true">{`
        @media (max-width: 768px) {
          .pc-nav {
            display: none !important;
          }
          .mobile-nav {
            display: flex !important;
            flex: 1;
            justify-content: flex-end;
          }
          .logo {
            flex: 1;
          }
        }
      `}</style>
    </Header>
  );
};

export default AppHeader; 