import React from 'react';
import { Card, Tag, Space, Typography, Tooltip } from 'antd';
import { EyeOutlined, LikeOutlined, CommentOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Meta } = Card;
const { Text } = Typography;

const NovelCard = ({ novel, style = {} }) => {
  // 默认封面图
  const defaultCover = 'https://img.freepik.com/free-vector/abstract-elegant-winter-book-cover_23-2148798745.jpg';
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  // 获取封面图
  const coverUrl = novel.cover || defaultCover;
  
  return (
    <Link to={`/novel/${novel._id}`}>
      <Card
        hoverable
        className="card-hover"
        cover={
          <div style={{ height: 200, overflow: 'hidden' }}>
            <img 
              alt={novel.title} 
              src={coverUrl}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultCover;
              }}
            />
          </div>
        }
        style={{ marginBottom: 16, ...style }}
      >
        <Meta
          title={
            <Tooltip title={novel.title}>
              <div className="text-overflow" style={{ fontWeight: 600 }}>
                {novel.title}
              </div>
            </Tooltip>
          }
          description={
            <>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" className="text-overflow">
                  作者: {novel.author}
                </Text>
              </div>
              
              <div style={{ marginBottom: 8 }}>
                <Space size={[0, 4]} wrap>
                  {novel.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                  {novel.tags.length > 3 && <Tag>...</Tag>}
                </Space>
              </div>
              
              <div className="text-overflow-2" style={{ marginBottom: 8, height: 38 }}>
                <Text type="secondary">
                  {novel.description}
                </Text>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <Space size="small">
                  <Text type="secondary">
                    <EyeOutlined /> {novel.meta.readCount}
                  </Text>
                  <Text type="secondary">
                    <LikeOutlined /> {novel.meta.likeCount}
                  </Text>
                  <Text type="secondary">
                    <CommentOutlined /> {novel.meta.commentCount}
                  </Text>
                </Space>
                <Text type="secondary">
                  {formatDate(novel.updateTime)}
                </Text>
              </div>
            </>
          }
        />
      </Card>
    </Link>
  );
};

export default NovelCard; 