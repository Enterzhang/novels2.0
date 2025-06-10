import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Carousel, Spin, Empty, Tabs, Tag, Space, Divider } from 'antd';
import { FireOutlined, ClockCircleOutlined, BookOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { novelApi } from '../../services/api';
import NovelCard from '../../components/novel/NovelCard';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [popularNovels, setPopularNovels] = useState([]);
  const [recentNovels, setRecentNovels] = useState([]);
  const [tags, setTags] = useState([]);
  const [carouselNovels, setCarouselNovels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取热门小说
        const popularData = await novelApi.getPopularNovels(8);
        setPopularNovels(popularData.recommendations);
        
        // 使用前4本热门小说作为轮播图
        setCarouselNovels(popularData.recommendations.slice(0, 4));
        
        // 获取最新小说
        const recentData = await novelApi.getNovelList(1, 12);
        setRecentNovels(recentData.novels);
        
        // 获取所有标签
        const tagsData = await novelApi.getTags();
        setTags(tagsData.tags);
      } catch (error) {
        console.error('加载首页数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 渲染热门小说轮播图
  const renderCarousel = () => {
    return (
      <Carousel autoplay effect="fade">
        {carouselNovels.map((novel) => (
          <div key={novel._id}>
            <Link to={`/novel/${novel._id}`}>
              <div style={{ 
                height: 400, 
                background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${novel.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  padding: 20,
                  color: 'white'
                }}>
                  <Title level={2} style={{ color: 'white', margin: 0 }}>{novel.title}</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 10 }}>
                    作者: {novel.author}
                  </Text>
                  <div style={{ marginBottom: 10 }}>
                    <Space size={[0, 8]} wrap>
                      {novel.tags.slice(0, 4).map((tag) => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))}
                    </Space>
                  </div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
                    {novel.description.slice(0, 200)}...
                  </Text>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </Carousel>
    );
  };

  // 渲染内容区域
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      );
    }

    return (
      <>
        {/* 轮播图区域 */}
        <div style={{ marginBottom: 40 }}>
          {carouselNovels.length > 0 ? renderCarousel() : (
            <Empty description="暂无推荐小说" />
          )}
        </div>

        {/* 热门小说区域 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <FireOutlined style={{ color: '#ff4d4f', fontSize: 24, marginRight: 8 }} />
            <Title level={3} style={{ margin: 0 }}>热门小说</Title>
            <Link to="/category" style={{ marginLeft: 'auto' }}>
              查看更多 &gt;
            </Link>
          </div>
          <Row gutter={[16, 16]}>
            {popularNovels.length > 0 ? (
              popularNovels.map((novel) => (
                <Col xs={24} sm={12} md={8} lg={6} key={novel._id}>
                  <NovelCard novel={novel} />
                </Col>
              ))
            ) : (
              <Col span={24}>
                <Empty description="暂无热门小说" />
              </Col>
            )}
          </Row>
        </div>

        {/* 最新小说区域 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 24, marginRight: 8 }} />
            <Title level={3} style={{ margin: 0 }}>最新更新</Title>
            <Link to="/category" style={{ marginLeft: 'auto' }}>
              查看更多 &gt;
            </Link>
          </div>
          <Row gutter={[16, 16]}>
            {recentNovels.length > 0 ? (
              recentNovels.map((novel) => (
                <Col xs={24} sm={12} md={8} lg={6} key={novel._id}>
                  <NovelCard novel={novel} />
                </Col>
              ))
            ) : (
              <Col span={24}>
                <Empty description="暂无最新小说" />
              </Col>
            )}
          </Row>
        </div>

        {/* 小说分类区域 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <AppstoreOutlined style={{ color: '#52c41a', fontSize: 24, marginRight: 8 }} />
            <Title level={3} style={{ margin: 0 }}>小说分类</Title>
          </div>
          <Card>
            <Space size={[8, 16]} wrap>
              {tags.map((tag) => (
                <Link key={tag} to={`/category/${encodeURIComponent(tag)}`}>
                  <Tag color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>
                    {tag}
                  </Tag>
                </Link>
              ))}
            </Space>
          </Card>
        </div>
      </>
    );
  };

  return (
    <div className="container">
      {renderContent()}
    </div>
  );
};

export default HomePage; 