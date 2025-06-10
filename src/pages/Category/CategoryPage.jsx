import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, Row, Col, Card, Spin, Empty, 
  Tag, Space, Pagination, Tabs, Radio, Select
} from 'antd';
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import { novelApi } from '../../services/api';
import NovelCard from '../../components/novel/NovelCard';

const { Title, Text } = Typography;
const { Option } = Select;

const CategoryPage = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [novels, setNovels] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('updateTime');
  
  // 初始化和参数变化时加载数据
  useEffect(() => {
    // 如果URL中有标签参数，则设置为选中标签
    if (tag) {
      setSelectedTag(tag);
    }
    
    // 获取所有标签
    fetchTags();
    
    // 加载小说列表
    fetchNovels(page, pageSize, tag || selectedTag, status, sortBy);
  }, [tag]);
  
  // 当选中的标签、状态、排序或分页变化时重新加载数据
  useEffect(() => {
    fetchNovels(page, pageSize, selectedTag, status, sortBy);
  }, [page, pageSize, selectedTag, status, sortBy]);
  
  // 获取所有标签
  const fetchTags = async () => {
    try {
      const response = await novelApi.getTags();
      setTags(response.tags);
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };
  
  // 获取小说列表
  const fetchNovels = async (currentPage, limit, tagFilter, statusFilter, sort) => {
    setLoading(true);
    try {
      // 这里我们使用标签筛选API
      const response = await novelApi.getNovelList(
        currentPage,
        limit,
        tagFilter,
        statusFilter,
        '' // 搜索关键词为空
      );
      setNovels(response.novels);
      setTotal(response.total);
    } catch (error) {
      console.error('加载分类小说失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理标签变化
  const handleTagChange = (tag) => {
    setSelectedTag(tag);
    setPage(1);
    navigate(`/category/${tag}`);
  };
  
  // 处理状态变化
  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };
  
  // 处理排序变化
  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };
  
  // 处理分页变化
  const handlePageChange = (newPage, newPageSize) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };
  
  // 渲染标签云
  const renderTagCloud = () => {
    return (
      <Card style={{ marginBottom: 24 }}>
        <Space size={[8, 16]} wrap>
          {tags.map(tag => (
            <Tag 
              key={tag}
              color={selectedTag === tag ? 'blue' : 'default'}
              style={{ 
                fontSize: 14, 
                padding: '4px 8px',
                cursor: 'pointer'
              }}
              onClick={() => handleTagChange(tag)}
            >
              {tag}
            </Tag>
          ))}
        </Space>
      </Card>
    );
  };
  
  // 渲染筛选区域
  const renderFilters = () => {
    return (
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div>
              <Text strong style={{ marginRight: 8 }}>状态:</Text>
              <Radio.Group value={status} onChange={(e) => handleStatusChange(e.target.value)}>
                <Radio.Button value="">全部</Radio.Button>
                <Radio.Button value="连载中">连载中</Radio.Button>
                <Radio.Button value="已完结">已完结</Radio.Button>
              </Radio.Group>
            </div>
            
            <div>
              <Text strong style={{ marginRight: 8 }}>排序:</Text>
              <Select 
                value={sortBy} 
                onChange={handleSortChange}
                style={{ width: 120 }}
              >
                <Option value="updateTime">最近更新</Option>
                <Option value="readCount">阅读量</Option>
                <Option value="likeCount">收藏量</Option>
                <Option value="commentCount">评论数</Option>
              </Select>
            </div>
          </div>
          
          {selectedTag && (
            <Text type="secondary">
              分类: <Tag color="blue">{selectedTag}</Tag> | 共找到 {total} 本小说
            </Text>
          )}
        </Space>
      </Card>
    );
  };
  
  // 渲染小说列表
  const renderNovelList = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      );
    }
    
    if (novels.length === 0) {
      return (
        <Empty description="暂无小说" />
      );
    }
    
    return (
      <>
        <Row gutter={[16, 16]}>
          {novels.map(novel => (
            <Col xs={24} sm={12} md={8} lg={6} key={novel._id}>
              <NovelCard novel={novel} />
            </Col>
          ))}
        </Row>
        
        <div style={{ textAlign: 'center', marginTop: 40, marginBottom: 20 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['12', '24', '36', '48']}
          />
        </div>
      </>
    );
  };
  
  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>小说分类</Title>
      </div>
      
      {renderTagCloud()}
      {renderFilters()}
      {renderNovelList()}
    </div>
  );
};

export default CategoryPage; 