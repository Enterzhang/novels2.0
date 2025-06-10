import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, Button, Drawer, Menu, 
  Spin, message, Tooltip, Space, 
  Divider, Dropdown, Slider, Switch
} from 'antd';
import { 
  MenuOutlined, ArrowLeftOutlined, 
  ArrowRightOutlined, SettingOutlined,
  BgColorsOutlined, FontSizeOutlined,
  LeftOutlined, HomeOutlined
} from '@ant-design/icons';
import { novelApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Paragraph } = Typography;

// 阅读设置的默认值
const defaultSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  theme: 'light',
  letterSpacing: 0.05
};

const ReaderPage = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState(null);
  const [novel, setNovel] = useState(null);
  const [chapterList, setChapterList] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [readerSettings, setReaderSettings] = useState(() => {
    // 从localStorage加载阅读设置，如果没有则使用默认值
    const savedSettings = localStorage.getItem('readerSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  
  // 保存阅读设置到localStorage
  useEffect(() => {
    localStorage.setItem('readerSettings', JSON.stringify(readerSettings));
    
    // 应用主题
    if (readerSettings.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [readerSettings]);
  
  // 加载小说和章节内容
  useEffect(() => {
    const fetchNovelAndChapter = async () => {
      setLoading(true);
      try {
        // 加载小说详情
        const novelData = await novelApi.getNovelDetail(id);
        setNovel(novelData);
        setChapterList(novelData.chapters);
        
        // 加载章节内容
        const chapterData = await novelApi.getChapterDetail(id, chapterId);
        setChapter(chapterData);
        
        // 更新阅读计数
        await novelApi.incrementReadCount(id);
        
        // 滚动到顶部
        window.scrollTo(0, 0);
        
        // 保存阅读历史（如果已登录）
        if (isAuthenticated && user) {
          try {
            const historyData = {
              novelId: id,
              chapterId: chapterId,
              title: novelData.title,
              author: novelData.author,
              chapterTitle: chapterData.title,
              coverImage: novelData.cover
            };
            
            await novelApi.saveReadingHistory(historyData);
          } catch (error) {
            console.error('保存阅读历史失败:', error);
          }
        }
      } catch (error) {
        console.error('加载章节内容失败:', error);
        message.error('加载章节内容失败');
      } finally {
        setLoading(false);
      }
    };

    if (id && chapterId) {
      fetchNovelAndChapter();
    }
  }, [id, chapterId, isAuthenticated, user]);
  
  // 切换到上一章
  const goToPrevChapter = () => {
    if (chapter?.prevChapter) {
      navigate(`/novel/${id}/chapter/${chapter.prevChapter}`);
    } else {
      message.info('已经是第一章了');
    }
  };
  
  // 切换到下一章
  const goToNextChapter = () => {
    if (chapter?.nextChapter) {
      navigate(`/novel/${id}/chapter/${chapter.nextChapter}`);
    } else {
      message.info('已经是最后一章了');
    }
  };
  
  // 返回小说详情页
  const backToNovel = () => {
    navigate(`/novel/${id}`);
  };
  
  // 返回首页
  const backToHome = () => {
    navigate('/');
  };
  
  // 更新阅读设置
  const updateSettings = (key, value) => {
    setReaderSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 重置阅读设置
  const resetSettings = () => {
    setReaderSettings(defaultSettings);
    message.success('阅读设置已重置');
  };
  
  // 构建阅读设置菜单
  const settingsMenuContent = (
    <div style={{ padding: 16, width: 300 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span>字体大小</span>
          <span>{readerSettings.fontSize}px</span>
        </div>
        <Slider
          min={12}
          max={28}
          step={1}
          value={readerSettings.fontSize}
          onChange={(value) => updateSettings('fontSize', value)}
        />
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span>行间距</span>
          <span>{readerSettings.lineHeight}</span>
        </div>
        <Slider
          min={1.2}
          max={2.4}
          step={0.1}
          value={readerSettings.lineHeight}
          onChange={(value) => updateSettings('lineHeight', value)}
        />
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span>字间距</span>
          <span>{readerSettings.letterSpacing}em</span>
        </div>
        <Slider
          min={0}
          max={0.2}
          step={0.01}
          value={readerSettings.letterSpacing}
          onChange={(value) => updateSettings('letterSpacing', value)}
        />
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>夜间模式</span>
        <Switch
          checked={readerSettings.theme === 'dark'}
          onChange={(checked) => updateSettings('theme', checked ? 'dark' : 'light')}
        />
      </div>
      
      <Divider style={{ margin: '16px 0' }} />
      
      <Button block onClick={resetSettings}>
        恢复默认设置
      </Button>
    </div>
  );
  
  // 构建内容样式
  const contentStyle = {
    fontSize: `${readerSettings.fontSize}px`,
    lineHeight: readerSettings.lineHeight,
    letterSpacing: `${readerSettings.letterSpacing}em`,
    color: readerSettings.theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
    textAlign: 'justify',
    padding: '0 16px'
  };
  
  // 构建背景样式
  const backgroundStyle = {
    backgroundColor: readerSettings.theme === 'dark' ? '#1f1f1f' : '#fff',
    minHeight: '100vh',
    padding: '24px 0'
  };
  
  // 渲染加载状态
  if (loading) {
    return (
      <div style={{ ...backgroundStyle, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="正在加载章节内容..." />
      </div>
    );
  }
  
  // 渲染阅读器
  return (
    <div style={backgroundStyle}>
      {/* 顶部工具栏 */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        backgroundColor: readerSettings.theme === 'dark' ? '#1f1f1f' : '#fff',
        borderBottom: '1px solid',
        borderBottomColor: readerSettings.theme === 'dark' ? '#333' : '#f0f0f0',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <Button 
            icon={<LeftOutlined />} 
            onClick={backToNovel}
            type="text"
          >
            返回书籍
          </Button>
          <Divider type="vertical" />
          <Button 
            icon={<HomeOutlined />} 
            onClick={backToHome}
            type="text"
          >
            首页
          </Button>
        </Space>
        
        <Title level={4} style={{ margin: 0, color: readerSettings.theme === 'dark' ? 'white' : 'inherit' }}>
          {novel?.title}
        </Title>
        
        <Space>
          <Tooltip title="目录">
            <Button 
              type="text"
              icon={<MenuOutlined />} 
              onClick={() => setDrawerVisible(true)}
            />
          </Tooltip>
          
          <Tooltip title="阅读设置">
            <Dropdown 
              dropdownRender={() => settingsMenuContent}
              trigger={['click']}
              open={settingsVisible}
              onOpenChange={setSettingsVisible}
            >
              <Button type="text" icon={<SettingOutlined />} />
            </Dropdown>
          </Tooltip>
        </Space>
      </div>
      
      {/* 阅读内容 */}
      <div className="reader-container" style={{ 
        backgroundColor: readerSettings.theme === 'dark' ? '#1f1f1f' : '#fff',
        boxShadow: readerSettings.theme === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <Title 
          level={3} 
          className="chapter-title"
          style={{ color: readerSettings.theme === 'dark' ? 'white' : 'inherit' }}
        >
          {chapter?.title}
        </Title>
        
        <Paragraph className="chapter-content" style={contentStyle}>
          {chapter?.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </Paragraph>
      </div>
      
      {/* 底部导航 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '20px',
        maxWidth: 800,
        margin: '0 auto'
      }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={goToPrevChapter}
          disabled={!chapter?.prevChapter}
          size="large"
        >
          上一章
        </Button>
        
        <Button 
          icon={<MenuOutlined />} 
          onClick={() => setDrawerVisible(true)}
          size="large"
        >
          目录
        </Button>
        
        <Button 
          onClick={goToNextChapter}
          disabled={!chapter?.nextChapter}
          size="large"
          type="primary"
        >
          下一章 <ArrowRightOutlined />
        </Button>
      </div>
      
      {/* 章节目录抽屉 */}
      <Drawer
        title={novel?.title}
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={300}
      >
        <Menu
          mode="vertical"
          selectedKeys={[chapterId]}
          style={{ borderRight: 'none' }}
          items={chapterList.map((item, index) => ({
            key: item.chapterId,
            label: (
              <div 
                onClick={() => {
                  navigate(`/novel/${id}/chapter/${item.chapterId}`);
                  setDrawerVisible(false);
                }}
                style={{ width: '100%' }}
              >
                <span style={{ marginRight: 8 }}>第{index + 1}章</span>
                <span>{item.title}</span>
              </div>
            )
          }))}
        />
      </Drawer>
      
      {/* 注入暗黑模式全局样式 */}
      <style jsx="true">{`
        body.dark-theme {
          background-color: #1f1f1f;
          color: rgba(255, 255, 255, 0.85);
        }
      `}</style>
    </div>
  );
};

export default ReaderPage; 