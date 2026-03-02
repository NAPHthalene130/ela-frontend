import { post, get } from '../utils/request.js';

/**
 * 用户登录接口
 * @param {object} data - 登录信息 { id, password }
 * @returns {Promise<any>}
 */
export function login(data) {
  return post('/auth/login', data);
}

/**
 * 用户注册接口
 * @param {object} data - 注册信息 { id, password, email, emailCode }
 * @returns {Promise<any>}
 */
export function register(data) {
  return post('/auth/register', data);
}

/**
 * 发送邮箱验证码接口
 * 对应后端方法: requireEmailCode
 * @param {string} email - 邮箱地址
 * @returns {Promise<any>}
 */
export function sendVerifyCode(email) {
  return post('/auth/send-code', { email });
}

/**
 * 检查用户ID是否存在（示例GET请求）
 * @param {string} id - 用户ID
 * @returns {Promise<any>}
 */
export function checkUserId(id) {
  return get('/auth/check-id', { id });
}
