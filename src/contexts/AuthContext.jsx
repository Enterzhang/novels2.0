import React, { createContext, useState, useEffect, useContext } from 'react';
import { userApi } from '../services/api';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化 - 从本地存储加载用户信息
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // 刷新用户信息
  const refreshUserInfo = async () => {
    try {
      if (!localStorage.getItem('token')) {
        return null;
      }
      
      setLoading(true);
      const response = await userApi.getUserInfo();
      
      // 更新本地存储的用户信息
      localStorage.setItem('user', JSON.stringify(response));
      setUser(response);
      
      return response;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.login(username, password);
      console.log('登录响应数据:', data); // 调试日志
      
      // 保存用户信息和token到本地存储
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('登录错误:', error); // 调试日志
      setError(error.response?.data?.detail || '登录失败，请检查用户名和密码');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.register(userData);
      console.log('注册响应数据:', response); // 调试日志
      return response;
    } catch (error) {
      console.error('注册错误:', error); // 调试日志
      setError(error.response?.data?.detail || '注册失败，请稍后再试');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 退出登录
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // 更新用户信息
  const updateUserInfo = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.updateUserInfo(userData);
      
      // 更新本地存储的用户信息
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      return response.user;
    } catch (error) {
      setError(error.response?.data?.detail || '更新用户信息失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 向子组件提供的值
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUserInfo,
    refreshUserInfo,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义hook，方便在组件中使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 