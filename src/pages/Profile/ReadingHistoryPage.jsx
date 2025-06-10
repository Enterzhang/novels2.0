import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Button, message, Skeleton, Empty, Typography } from 'antd';
import { BookOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const ReadingHistoryPage = () => {
  const { user, isAuthenticated, refreshUserInfo } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [readingHistory, setReadingHistory] = useState([]);

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login', { state: { from: '/reading-history' } });
    }
  }, [isAuthenticated, navigate]);

  // 加载阅读历史
  useEffect(() => {
    const loadReadingHistory = async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          // 刷新用户信息，获取最新的阅读历史
          const updatedUser = await refreshUserInfo();
          if (updatedUser) {
            setReadingHistory(updatedUser.readingHistory || []);
          } else {
            // 如果刷新失败，使用当前用户数据
            setReadingHistory(user?.readingHistory || []);
          }
        } catch (error) {
          console.error('获取阅读历史失败:', error);
          message.error('获取阅读历史失败');
          // 使用当前用户数据作为备选
          setReadingHistory(user?.readingHistory || []);
        } finally {
          setLoading(false);
        }
      }
    };

    loadReadingHistory();
  }, [isAuthenticated, user, refreshUserInfo]);

  if (!isAuthenticated) {
    return null; // 未登录时不渲染内容
  }

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Card>
          <Title level={4} style={{ marginBottom: 24 }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            阅读历史
          </Title>
          
          <Skeleton loading={loading} active paragraph={{ rows: 10 }}>
            {readingHistory.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={readingHistory}
                pagination={{
                  pageSize: 10,
                  hideOnSinglePage: true
                }}
                renderItem={item => (
                  <List.Item
                    key={item.novelId}
                    actions={[
                      <Button type="primary" onClick={() => navigate(`/novel/${item.novelId}/chapter/${item.chapterId}`)}>
                        继续阅读
                      </Button>,
                      <Button onClick={() => navigate(`/novel/${item.novelId}`)}>
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar size={48} icon={<BookOutlined />} src={item.coverImage} />}
                      title={<a onClick={() => navigate(`/novel/${item.novelId}`)}>{item.title || '未知小说'}</a>}
                      description={
                        <div>
                          <div>作者: {item.author || '未知'}</div>
                          <div>最后阅读章节: {item.chapterTitle || '未知章节'}</div>
                          <div>阅读时间: {item.lastReadTime ? new Date(item.lastReadTime).toLocaleString() : '未知'}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无阅读历史" />
            )}
          </Skeleton>
        </Card>
      </div>
    </div>
  );
};

export default ReadingHistoryPage; 