
// 基础URL配置
const BASE_URL = 'http://localhost:5000/api';

/**
 * 通用请求处理函数
 * @param {string} url - 请求路径
 * @param {object} options - Fetch配置项
 * @returns {Promise<any>} - 返回Promise对象
 */
async function request(url, options = {}) {
  // 默认请求头
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // 处理完整的请求配置
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    }
  };

  // 处理请求URL
  const finalUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  try {
    const response = await fetch(finalUrl, config);
    
    // 检查响应状态
    if (!response.ok) {
      // 尝试解析错误信息
      let errorMessage = `请求失败: ${response.status}`;
      try {
        const errorData = await response.json();
        // 优先尝试读取 msg 字段，其次是 message，最后是默认错误信息
        errorMessage = errorData.msg || errorData.message || errorMessage;
      } catch (e) {
        // 忽略JSON解析错误
      }
      throw new Error(errorMessage);
    }

    // 解析响应数据
    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error; // 继续抛出错误以便调用方处理
  }
}

/**
 * 封装 GET 请求
 * @param {string} url - 请求路径
 * @param {object} params - 查询参数对象
 */
export function get(url, params = {}) {
  let queryString = '';
  if (Object.keys(params).length > 0) {
    queryString = '?' + new URLSearchParams(params).toString();
  }
  return request(`${url}${queryString}`, {
    method: 'GET'
  });
}

/**
 * 封装 POST 请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求体数据
 */
export function post(url, data = {}) {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
