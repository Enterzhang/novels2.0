import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 从localStorage获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 统一处理错误
    if (error.response) {
      // 处理401未授权错误
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 小说相关API
export const novelApi = {
  // 获取小说列表
  getNovelList: (page = 1, limit = 10, tags = '', publication_status = '', search = '') => {
    let url = `/novels?page=${page}&limit=${limit}`;
    if (tags) url += `&tags=${tags}`;
    if (publication_status) url += `&publication_status=${publication_status}`;
    if (search) url += `&search=${search}`;
    return api.get(url);
  },
  
  // 获取小说详情
  getNovelDetail: (novelId) => {
    return api.get(`/novels/${novelId}`);
  },
  
  // 获取章节内容
  getChapterDetail: (novelId, chapterId) => {
    return api.get(`/novels/${novelId}/chapters/${chapterId}`);
  },
  
  // 获取热门小说
  getPopularNovels: (limit = 10) => {
    return api.get(`/novels/popular?limit=${limit}`);
  },
  
  // 获取小说推荐
  getRecommendations: (novelId, limit = 5) => {
    return api.get(`/novels/${novelId}/recommendations?limit=${limit}`);
  },
  
  // 获取所有标签
  getTags: () => {
    return api.get('/tags');
  },
  
  // 增加阅读计数
  incrementReadCount: (novelId) => {
    return api.post(`/novels/${novelId}/read`);
  },
  
  // 点赞小说
  likeNovel: (novelId, userId) => {
    return api.post(`/novels/${novelId}/like?user_id=${userId}`);
  },
  
  // 添加评论
  addComment: (novelId, userId, content) => {
    return api.post(`/novels/${novelId}/comments`, {
      userId,
      content
    });
  },
  
  // 获取评论列表
  getComments: (novelId, page = 1, limit = 20) => {
    return api.get(`/novels/${novelId}/comments?page=${page}&limit=${limit}`);
  },
  
  // 保存阅读历史
  saveReadingHistory: (novelInfo) => {
    return api.post('/users/reading-history', novelInfo);
  },
  
  // 收藏或取消收藏小说
  toggleFavorite: (novelId, novelInfo) => {
    return api.post(`/users/favorite/${novelId}`, novelInfo);
  },
  
  // 检查小说是否已收藏
  checkFavoriteStatus: (novelId) => {
    return api.get(`/users/favorite/status/${novelId}`);
  }
};

// 用户相关API
export const userApi = {
  // 用户登录
  login: (username, password) => {
    // 创建表单数据，符合OAuth2PasswordRequestForm的要求
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    // 确保password字段有值且正确传递
    console.log('Login credentials:', { username, password: '***' });
    
    return axios.post(`${API_URL}/users/login`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => response.data);  // 确保返回data部分
  },
  
  // 用户注册
  register: (userData) => {
    return api.post('/users/register', userData);
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return api.get('/users/profile');
  },
  
  // 更新用户信息
  updateUserInfo: (userData) => {
    return api.put('/users/profile', userData);
  }
};

export default api; 