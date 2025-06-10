import React, { useState, useEffect } from 'react';
import { Card, Avatar, Tabs, List, Button, message, Skeleton, Empty, Typography, Descriptions } from 'antd';
import { UserOutlined, BookOutlined, HeartOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user, isAuthenticated, refreshUserInfo } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [favoriteNovels, setFavoriteNovels] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [isAuthenticated, navigate]);

  // 加载用户收藏和阅读历史
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          // 刷新用户信息，获取最新的收藏和阅读历史
          const updatedUser = await refreshUserInfo();
          if (updatedUser) {
            setFavoriteNovels(updatedUser.favoriteNovels || []);
            setReadingHistory(updatedUser.readingHistory || []);
          } else {
            // 如果刷新失败，使用当前用户数据
            setFavoriteNovels(user?.favoriteNovels || []);
            setReadingHistory(user?.readingHistory || []);
          }
        } catch (error) {
          console.error('获取用户数据失败:', error);
          message.error('获取用户数据失败');
          // 使用当前用户数据作为备选
          setFavoriteNovels(user?.favoriteNovels || []);
          setReadingHistory(user?.readingHistory || []);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [isAuthenticated, user, refreshUserInfo]);

  if (!isAuthenticated) {
    return null; // 未登录时不渲染内容
  }

  // 定义标签页项
  const tabItems = [
    {
      key: 'reading-history',
      label: <span><HistoryOutlined /> 阅读历史</span>,
      children: (
        <Skeleton loading={loading} active paragraph={{ rows: 5 }}>
          {readingHistory.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={readingHistory}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button type="link" onClick={() => navigate(`/novel/${item.novelId}/chapter/${item.chapterId}`)}>
                      继续阅读
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} src={item.coverImage} />}
                    title={item.title || '未知小说'}
                    description={`最后阅读: ${item.lastReadTime ? new Date(item.lastReadTime).toLocaleString() : '未知'}`}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无阅读历史" />
          )}
        </Skeleton>
      )
    },
    {
      key: 'favorites',
      label: <span><HeartOutlined /> 我的收藏</span>,
      children: (
        <Skeleton loading={loading} active paragraph={{ rows: 5 }}>
          {favoriteNovels.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={favoriteNovels}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button type="link" onClick={() => navigate(`/novel/${item.novelId}`)}>
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} src={item.coverImage} />}
                    title={item.title || '未知小说'}
                    description={`收藏时间: ${item.favoriteTime ? new Date(item.favoriteTime).toLocaleString() : '未知'}`}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无收藏小说" />
          )}
        </Skeleton>
      )
    }
  ];

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* 用户信息卡片 */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} />
            <div style={{ marginLeft: 24 }}>
              <Title level={3}>{user?.nickname || user?.username}</Title>
              <Text type="secondary">用户ID: {user?.id}</Text>
            </div>
          </div>

          <Descriptions title="个人资料" layout="vertical" style={{ marginTop: 24 }} column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="手机号">{user?.phone || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="性别">
              {user?.gender === 'male' ? '男' : user?.gender === 'female' ? '女' : '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {user?.createTime ? new Date(user.createTime).toLocaleString() : '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {user?.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : '未知'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 阅读内容标签页 */}
        <Card>
          <Tabs defaultActiveKey="reading-history" items={tabItems} />
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage; 