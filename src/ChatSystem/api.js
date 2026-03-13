import { get, post } from '../utils/request.js';

/**
 * 获取左侧“历史对话列表”（支持分页）
 * Get history list (support pagination)
 * @param {Object} params - { page: number, limit: number }
 * @returns {Promise<Object>}
 */
export async function getHistoryList(params) {
  try {
    const res = await get('/chat/windows', params);
    if (res.status === 'success') {
      return {
        code: 200,
        data: {
          has_more: false, // 暂不支持分页
          history_list: res.data.map(item => ({
            session_id: item.windowsId,
            title: item.title,
            updated_at: item.createTime
          }))
        },
        message: "success"
      };
    }
    throw new Error(res.msg);
  } catch (e) {
    console.error('Fetch windows failed', e);
    return { code: 500, message: e.message, data: { history_list: [] } };
  }
}

/**
 * 获取某个会话的聊天详情
 * Get chat details for a specific session
 * @param {Object} params - { session_id: string }
 * @returns {Promise<Object>}
 */
export async function getChatDetail(params) {
  try {
    const res = await get('/chat/history', { windowID: params.session_id });
    if (res.status === 'success') {
      return {
        code: 200,
        data: {
          messages: res.data.map(msg => ({
            role: msg.isUserSend ? 'user' : 'assistant',
            type: 'text',
            content: msg.content,
            created_at: msg.sendTime
          }))
        },
        message: "success"
      };
    }
    throw new Error(res.msg);
  } catch (e) {
    console.error('Fetch history failed', e);
    return { code: 500, message: e.message, data: { messages: [] } };
  }
}

/**
 * 创建新对话
 */
export async function createChatWindow() {
  return post('/chat/create', {});
}

export async function getCourseList() {
  try {
    const res = await get('/chat/courses');
    if (res.status === 'success') {
      return {
        code: 200,
        data: Array.isArray(res.data) ? res.data : [],
        message: 'success'
      };
    }
    throw new Error(res.msg || 'Failed to fetch course list');
  } catch (e) {
    console.error('Fetch course list failed', e);
    return { code: 500, message: e.message, data: [] };
  }
}

export async function deleteChatWindow(data) {
  return post('/chat/delete-window', {
    userID: data.user_id,
    windowID: data.session_id
  });
}

/**
 * 发送新消息（占位接口）
 * Send new message (placeholder)
 * @param {Object} data - { user_id: string, session_id: string, turn_id: number, content: string }
 * @returns {Promise<Object>}
 */
export async function sendChatMessage(data) {
  // 发送用户消息
  await post('/chat/send', {
    windowID: data.session_id,
    content: data.content,
    isUserSend: true,
    course: data.course
  });

  
  const aiContent = `你刚才问的是：“${data.content}”。\n这是一个模拟回复。`;
  
  // 保存 AI 回复
  await post('/chat/send', {
    windowID: data.session_id,
    content: aiContent,
    isUserSend: false,
    course: data.course
  });

  return {
    code: 200,
    data: {
      role: "assistant",
      type: "text",
      content: aiContent,
      created_at: new Date().toISOString()
    },
    message: "success"
  };
}

/**
 * 发送真实流式消息
 * Send real streaming message
 * @param {Object} data - { user_id: string, session_id: string, content: string }
 * @param {Function} onChunk - Callback for each text chunk
 * @returns {Promise<void>}
 */
export async function sendChatMessageStream(data, onChunk) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Use hardcoded base URL or import from config if possible. 
    // Assuming relative path /api/chat/stream proxy is handled or full URL
    // The previous code used http://127.0.0.1:5000/api/chat/stream
    // Let's use the same host as request.js implies: http://localhost:5000/api
    const response = await fetch('http://localhost:5000/api/chat/stream', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        windowID: data.session_id,
        content: data.content,
        course: data.course
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        onChunk(chunk);
      }
    }
    
  } catch (error) {
    console.error('Stream request failed:', error);
    throw error;
  }
}
