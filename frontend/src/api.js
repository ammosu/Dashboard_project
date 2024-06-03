// src/api.js
import axios from 'axios';

// 創建一個 axios 實例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL
});

export default api;
