import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, Row, Col, Spin, Empty, 
  Tag, Button, Divider, List, Avatar, 
  Form, Input, message, Tabs, Space
} from 'antd';
import { 
  BookOutlined, ReadOutlined, ClockCircleOutlined, 
  UserOutlined, EyeOutlined, LikeOutlined, 
  CommentOutlined, SendOutlined, StarOutlined, StarFilled
} from '@ant-design/icons';
import { novelApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import NovelCard from '../../components/novel/NovelCard';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const NovelDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [novel, setNovel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [commentForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('chapters');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 加载小说详情
  useEffect(() => {
    const fetchNovelDetail = async () => {
      setLoading(true);
      try {
        const data = await novelApi.getNovelDetail(id);
        setNovel(data);
        
        // 加载推荐小说
        const recommendationsData = await novelApi.getRecommendations(id);
        setRecommendations(recommendationsData.recommendations);
        
        // 加载评论
        fetchComments();
        
        // 检查收藏状态
        if (isAuthenticated) {
          checkFavoriteStatus();
        }
      } catch (error) {
        console.error('加载小说详情失败:', error);
        message.error('加载小说详情失败');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNovelDetail();
    }
  }, [id, isAuthenticated]);
  
  // 检查收藏状态
  const checkFavoriteStatus = async () => {
    try {
      const response = await novelApi.checkFavoriteStatus(id);
      setIsFavorite(response.isFavorite);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  };
  
  // 加载评论
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const commentsData = await novelApi.getComments(id);
      setComments(commentsData.comments);
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setCommentsLoading(false);
    }
  };
  
  // 提交评论
  const handleCommentSubmit = async (values) => {
    if (!isAuthenticated) {
      message.warning('请先登录后再评论');
      navigate('/login', { state: { from: { pathname: `/novel/${id}` } } });
      return;
    }
    
    try {
      await novelApi.addComment(id, user.id, values.content);
      message.success('评论发表成功');
      commentForm.resetFields();
      fetchComments();
    } catch (error) {
      console.error('发表评论失败:', error);
      message.error('发表评论失败');
    }
  };
  
  // 点赞小说
  const handleLike = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录后再点赞');
      navigate('/login', { state: { from: { pathname: `/novel/${id}` } } });
      return;
    }
    
    try {
      const response = await novelApi.likeNovel(id, user.id);
      message.success('点赞成功');
      setNovel(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          likeCount: response.likeCount
        }
      }));
    } catch (error) {
      console.error('点赞失败:', error);
      message.error('点赞失败');
    }
  };
  
  // 收藏/取消收藏小说
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录后再收藏');
      navigate('/login', { state: { from: { pathname: `/novel/${id}` } } });
      return;
    }
    
    setFavoriteLoading(true);
    try {
      const novelInfo = {
        novelId: id,
        title: novel.title,
        author: novel.author,
        coverImage: novel.cover
      };
      
      const response = await novelApi.toggleFavorite(id, novelInfo);
      setIsFavorite(response.isFavorite);
      
      if (response.isFavorite) {
        message.success('收藏成功');
      } else {
        message.success('已取消收藏');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('收藏操作失败');
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  // 渲染小说信息
  const renderNovelInfo = () => {
    if (!novel) return null;
    
    const defaultCover = 'https://img.freepik.com/free-vector/abstract-elegant-winter-book-cover_23-2148798745.jpg';
    
    return (
      <Row gutter={[24, 24]}>
        {/* 左侧封面和信息 */}
        <Col xs={24} md={8}>
          <Card cover={
            <img 
              alt={novel.title}
              src={novel.cover || defaultCover}
              style={{ height: 300, objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultCover;
              }}
            />
          }>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Space size={[0, 8]} wrap>
                  {novel.tags.map(tag => (
                    <Link key={tag} to={`/category/${encodeURIComponent(tag)}`}>
                      <Tag color="blue">{tag}</Tag>
                    </Link>
                  ))}
                </Space>
              </div>
              
              <div>
                <Text type="secondary">出版状态: </Text>
                <Tag color={novel.publication_status === '连载中' ? 'green' : 'orange'}>
                  {novel.publication_status}
                </Tag>
              </div>
              
              <div>
                <Space size="large">
                  <span>
                    <EyeOutlined /> {novel.meta.readCount}
                  </span>
                  <span>
                    <LikeOutlined /> {novel.meta.likeCount}
                  </span>
                  <span>
                    <CommentOutlined /> {novel.meta.commentCount}
                  </span>
                </Space>
              </div>
              
              <div>
                <Text type="secondary">总字数: </Text>
                <Text strong>{novel.meta.totalWords}</Text>
              </div>
              
              <div>
                <Text type="secondary">章节数: </Text>
                <Text strong>{novel.meta.totalChapters}</Text>
              </div>
              
              <div>
                <Text type="secondary">创建时间: </Text>
                <Text>{formatDate(novel.createTime)}</Text>
              </div>
              
              <div>
                <Text type="secondary">最近更新: </Text>
                <Text>{formatDate(novel.updateTime)}</Text>
              </div>
              
              <Button 
                type="primary" 
                block 
                size="large"
                icon={<ReadOutlined />}
                onClick={() => {
                  if (novel.chapters.length > 0) {
                    navigate(`/novel/${novel._id}/chapter/${novel.chapters[0].chapterId}`);
                  } else {
                    message.info('暂无章节可阅读');
                  }
                }}
              >
                开始阅读
              </Button>
              
              <Button 
                block 
                icon={<LikeOutlined />}
                onClick={handleLike}
              >
                点赞支持
              </Button>
              
              <Button 
                block 
                icon={isFavorite ? <StarFilled /> : <StarOutlined />}
                onClick={handleToggleFavorite}
                loading={favoriteLoading}
                type={isFavorite ? "default" : "dashed"}
              >
                {isFavorite ? '已收藏' : '收藏小说'}
              </Button>
            </Space>
          </Card>
        </Col>
        
        {/* 右侧标题和详情 */}
        <Col xs={24} md={16}>
          <Card>
            <Title level={2}>{novel.title}</Title>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Text>作者: </Text>
                <Text strong>{novel.author}</Text>
              </Space>
            </div>
            
            <Divider />
            
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>简介</Title>
              <Paragraph style={{ fontSize: 16 }}>
                {novel.description}
              </Paragraph>
            </div>
            
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              size="large"
              items={[
                {
                  key: 'chapters',
                  label: <span><BookOutlined />章节列表</span>,
                  children: (
                    <List
                      dataSource={novel.chapters}
                      renderItem={(chapter, index) => (
                        <List.Item>
                          <Link to={`/novel/${novel._id}/chapter/${chapter.chapterId}`} style={{ display: 'block', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <div>
                                <Text style={{ marginRight: 8 }}>第{index + 1}章</Text>
                                <Text strong>{chapter.title}</Text>
                              </div>
                            </div>
                          </Link>
                        </List.Item>
                      )}
                      bordered
                      style={{ marginTop: 16 }}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: false
                      }}
                    />
                  )
                },
                {
                  key: 'comments',
                  label: <span><CommentOutlined />读者评论</span>,
                  children: (
                    <>
                      <Card style={{ marginBottom: 24 }}>
                        <Form form={commentForm} onFinish={handleCommentSubmit}>
                          <Form.Item
                            name="content"
                            rules={[{ required: true, message: '请输入评论内容' }]}
                          >
                            <TextArea 
                              rows={4} 
                              placeholder="发表您的评论..." 
                            />
                          </Form.Item>
                          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Button 
                              type="primary" 
                              htmlType="submit" 
                              icon={<SendOutlined />}
                            >
                              发表评论
                            </Button>
                          </Form.Item>
                        </Form>
                      </Card>
                      
                      {commentsLoading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                          <Spin tip="加载评论中..." />
                        </div>
                      ) : (
                        <List
                          className="comment-list"
                          header={`${comments.length} 条评论`}
                          itemLayout="horizontal"
                          dataSource={comments}
                          renderItem={item => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Avatar icon={<UserOutlined />} />}
                                title={item.userId}
                                description={
                                  <div>
                                    <div>{item.content}</div>
                                    <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '4px' }}>
                                      {formatDate(item.createTime)}
                                    </div>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                          locale={{ emptyText: <Empty description="暂无评论" /> }}
                        />
                      )}
                    </>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    );
  };
  
  // 渲染推荐小说
  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;
    
    return (
      <div style={{ marginTop: 40 }}>
        <Title level={3} style={{ marginBottom: 16 }}>
          <BookOutlined style={{ marginRight: 8 }} />
          猜你喜欢
        </Title>
        <Row gutter={[16, 16]}>
          {recommendations.map(novel => (
            <Col xs={24} sm={12} md={8} lg={6} key={novel._id}>
              <NovelCard novel={novel} />
            </Col>
          ))}
        </Row>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }
  
  if (!novel) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 100 }}>
        <Empty description="小说不存在或已被删除" />
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          返回首页
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container">
      {renderNovelInfo()}
      {renderRecommendations()}
    </div>
  );
};

export default NovelDetailPage; 