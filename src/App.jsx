import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// 懒加载页面组件
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const NovelDetailPage = lazy(() => import('./pages/NovelDetail/NovelDetailPage'));
const ReaderPage = lazy(() => import('./pages/Reader/ReaderPage'));
const SearchPage = lazy(() => import('./pages/Search/SearchPage'));
const CategoryPage = lazy(() => import('./pages/Category/CategoryPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const ReadingHistoryPage = lazy(() => import('./pages/Profile/ReadingHistoryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// 全局加载组件
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin tip="页面加载中..." size="large" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Header />
      <main className="page-content">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/novel/:id" element={<NovelDetailPage />} />
            <Route path="/novel/:id/chapter/:chapterId" element={<ReaderPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/category/:tag" element={<CategoryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/reading-history" element={<ReadingHistoryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </AuthProvider>
  );
}

export default App; 