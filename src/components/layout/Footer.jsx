import React from 'react';
import { Layout, Divider } from 'antd';
import { Link } from 'react-router-dom';

const { Footer } = Layout;

const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Footer style={{ background: '#f7f7f7', padding: '40px 0 24px' }}>
      <div className="container">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ marginBottom: 20, minWidth: 200 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>小说阅读系统</h3>
            <p style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              为广大读者提供优质的小说阅读体验
            </p>
          </div>
          
          <div style={{ marginBottom: 20, minWidth: 200 }}>
            <h4 style={{ fontSize: 16, marginBottom: 16 }}>常用链接</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>首页</Link>
              <Link to="/category" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>分类浏览</Link>
              <Link to="/search" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>搜索小说</Link>
            </div>
          </div>
          
          <div style={{ marginBottom: 20, minWidth: 200 }}>
            <h4 style={{ fontSize: 16, marginBottom: 16 }}>用户中心</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/login" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>登录</Link>
              <Link to="/register" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>注册</Link>
              <Link to="/profile" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>个人中心</Link>
            </div>
          </div>
          
          <div style={{ marginBottom: 20, minWidth: 200 }}>
            <h4 style={{ fontSize: 16, marginBottom: 16 }}>关于我们</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/about" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>关于我们</Link>
              <Link to="/terms" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>使用条款</Link>
              <Link to="/privacy" style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>隐私政策</Link>
            </div>
          </div>
        </div>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <div style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.45)' }}>
          <p>© {currentYear} 小说阅读系统 版权所有</p>
          <p style={{ fontSize: 12 }}>本站所有内容均来源于网络，仅供学习交流使用，不代表本站立场</p>
        </div>
      </div>
      
      {/* 响应式样式 */}
      <style jsx="true">{`
        @media (max-width: 768px) {
          .container > div {
            justify-content: flex-start;
          }
        }
      `}</style>
    </Footer>
  );
};

export default AppFooter; 