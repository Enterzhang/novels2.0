import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Typography, Input, Row, Col, Card, 
  Spin, Empty, Button, Select, 
  Pagination, Divider, Tag, Space
} from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { novelApi } from '../../services/api';
import NovelCard from '../../components/novel/NovelCard';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [novels, setNovels] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState('');
  const [status, setStatus] = useState('');
  
  // 解析URL参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const keywordParam = searchParams.get('keyword');
    const tagsParam = searchParams.get('tags');
    const statusParam = searchParams.get('status');
    const pageParam = searchParams.get('page');
    
    if (keywordParam) setSearch(keywordParam);
    if (tagsParam) setSelectedTags(tagsParam);
    if (statusParam) setStatus(statusParam);
    if (pageParam) setPage(parseInt(pageParam, 10));
    
    // 获取所有标签
    fetchTags();
    
    // 执行搜索
    fetchNovels(
      pageParam ? parseInt(pageParam, 10) : 1,
      pageSize,
      keywordParam || '',
      tagsParam || '',
      statusParam || ''
    );
  }, [location.search]);
  
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
  const fetchNovels = async (currentPage, limit, keyword, tagsList, pubStatus) => {
    setLoading(true);
    try {
      const response = await novelApi.getNovelList(
        currentPage,
        limit,
        tagsList,
        pubStatus,
        keyword
      );
      setNovels(response.novels);
      setTotal(response.total);
    } catch (error) {
      console.error('搜索小说失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理搜索
  const handleSearch = (value) => {
    // 构建查询参数
    const params = new URLSearchParams();
    if (value) params.set('keyword', value);
    if (selectedTags) params.set('tags', selectedTags);
    if (status) params.set('status', status);
    params.set('page', '1');
    
    // 更新URL并触发搜索
    navigate(`/search?${params.toString()}`);
  };
  
  // 处理筛选条件变化
  const handleFilterChange = (type, value) => {
    // 构建查询参数
    const params = new URLSearchParams(location.search);
    
    if (type === 'tags') {
      if (value) {
        params.set('tags', value);
        setSelectedTags(value);
      } else {
        params.delete('tags');
        setSelectedTags('');
      }
    } else if (type === 'status') {
      if (value) {
        params.set('status', value);
        setStatus(value);
      } else {
        params.delete('status');
        setStatus('');
      }
    }
    
    params.set('page', '1');
    
    // 更新URL并触发搜索
    navigate(`/search?${params.toString()}`);
  };
  
  // 处理分页变化
  const handlePageChange = (newPage, newPageSize) => {
    // 更新页码和每页数量
    setPage(newPage);
    setPageSize(newPageSize);
    
    // 构建查询参数
    const params = new URLSearchParams(location.search);
    params.set('page', newPage.toString());
    
    // 更新URL并触发搜索
    navigate(`/search?${params.toString()}`);
  };
  
  // 清空筛选条件
  const clearFilters = () => {
    // 只保留搜索关键词
    const params = new URLSearchParams();
    if (search) params.set('keyword', search);
    params.set('page', '1');
    
    // 重置状态
    setSelectedTags('');
    setStatus('');
    
    // 更新URL并触发搜索
    navigate(`/search?${params.toString()}`);
  };
  
  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>小说搜索</Title>
        <Search
          placeholder="搜索小说名称或作者"
          enterButton={<><SearchOutlined />搜索</>}
          size="large"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 600 }}
        />
      </div>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text strong style={{ marginRight: 8 }}>
              <FilterOutlined /> 标签:
            </Text>
            <Select
              style={{ width: 200 }}
              placeholder="选择标签"
              value={selectedTags || undefined}
              onChange={(value) => handleFilterChange('tags', value)}
              allowClear
            >
              {tags.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text strong style={{ marginRight: 8 }}>状态:</Text>
            <Select
              style={{ width: 120 }}
              placeholder="选择状态"
              value={status || undefined}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
            >
              <Option value="连载中">连载中</Option>
              <Option value="已完结">已完结</Option>
            </Select>
          </div>
          
          <Button onClick={clearFilters}>
            清空筛选
          </Button>
          
          {(search || selectedTags || status) && (
            <Text type="secondary">
              搜索结果: {total} 本小说
            </Text>
          )}
        </div>
      </Card>
      
      {/* 搜索结果 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" tip="搜索中..." />
        </div>
      ) : novels.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {novels.map(novel => (
              <Col xs={24} sm={12} md={8} lg={6} key={novel._id}>
                <NovelCard novel={novel} />
              </Col>
            ))}
          </Row>
          
          <div style={{ textAlign: 'center', marginTop: 40 }}>
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
      ) : (
        <Empty 
          description={
            <>
              <div>未找到匹配的小说</div>
              <div>
                <Text type="secondary">
                  尝试使用不同的关键词或筛选条件
                </Text>
              </div>
            </>
          }
        />
      )}
    </div>
  );
};

export default SearchPage;