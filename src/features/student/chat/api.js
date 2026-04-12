import { API_BASE_URL, get, post } from '../../../shared/api/httpClient.js';
import {
  expireAuthSession,
  getStoredToken,
  getStoredUserId,
  isAuthFailureStatus,
} from '../../../shared/auth/session.js';

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
      const orderedHistory = (Array.isArray(res.data) ? res.data : [])
        .map(item => ({
          session_id: item.windowsId,
          title: item.title,
          updated_at: item.createTime
        }))
        .sort((a, b) => {
          const left = new Date(b.updated_at || 0).getTime();
          const right = new Date(a.updated_at || 0).getTime();
          return left - right;
        });
      return {
        code: 200,
        data: {
          has_more: false, // 暂不支持分页
          history_list: orderedHistory
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
      const payload = res.data || {};
      const messageRows = Array.isArray(payload.messages) ? payload.messages : [];
      const featureCards = Array.isArray(payload.featureCards) ? payload.featureCards : [];
      return {
        code: 200,
        data: {
          messages: messageRows.map(msg => ({
            role: msg.isUserSend ? 'user' : 'assistant',
            type: 'text',
            content: msg.content,
            component_type: null,
            payload: null,
            created_at: msg.sendTime
          })),
          featureCards: featureCards.map(card => ({
            id: card.id,
            title: card.title || (card.type === 'graph' ? '知识图谱' : (card.type === 'analysis' ? '学情回顾' : '习题推荐')),
            summary: card.summary || (card.type === 'graph' ? '点击查看图谱关系' : (card.type === 'analysis' ? '点击查看学习分析' : '点击开始作答')),
            type: card.type || 'questions',
            payload: card.type === 'graph'
              ? {
                  title: card.title || '知识图谱',
                  graph: Array.isArray(card.content) ? card.content : [],
                  focusNode: card.focus_node || '',
                  queryText: card.query_text || '',
                  summary: card.summary || '',
                }
              : card.type === 'analysis'
                ? {
                    title: card.title || '学情回顾',
                    summary: card.summary || '',
                    analysis: card.content && typeof card.content === 'object' ? card.content : {},
                  }
                : {
                    title: card.title || '习题推荐',
                    questions: Array.isArray(card.content) ? card.content : [],
                  }
          })),
        },
        message: "success"
      };
    }
    throw new Error(res.msg);
  } catch (e) {
    console.error('Fetch history failed', e);
    return { code: 500, message: e.message, data: { messages: [], featureCards: [] } };
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
      component_type: null,
      payload: null,
      created_at: new Date().toISOString()
    },
    message: "success"
  };
}

/**
 * 发送真实流式消息
 * Send real streaming message
 * @param {Object} data - { user_id: string, session_id: string, content: string }
 * @param {Function} onEvent - Callback for each stream event
 * @returns {Promise<void>}
 */
export async function sendChatMessageStream(data, onEvent) {
  try {
    const token = getStoredToken();
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
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        windowID: data.session_id,
        // 与后端 Agent 入口约定：用户输入通过 msg 字段传递
        msg: data.content,
        content: data.content,
        course: data.course
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.msg || errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          if (errorText.trim()) {
            errorMessage = errorText.trim();
          }
        }
      } catch (e) {
        // Ignore body parsing failures and keep the fallback message.
      }

      const isAuthFailure = Boolean(token) && isAuthFailureStatus(response.status);
      if (isAuthFailure) {
        errorMessage = expireAuthSession(errorMessage);
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.isAuthFailure = isAuthFailure;
      throw error;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming is not supported by the current response.');
    }
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const emitEvent = (event) => {
      if (!event || typeof onEvent !== 'function') return;
      onEvent(event);
    };

    const parseSseEvent = (block) => {
      const lines = block.split('\n');
      let eventType = '';
      const dataLines = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (!dataLines.length) return;
      const rawData = dataLines.join('\n');
      if (rawData === '[DONE]') {
        emitEvent({ type: 'done' });
        return;
      }

      try {
        const parsed = JSON.parse(rawData);
        emitEvent(parsed);
      } catch (_) {
        emitEvent({
          type: 'content',
          content: rawData,
        });
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      if (!chunk) {
        continue;
      }
      buffer += chunk;

      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      events.forEach(parseSseEvent);
    }

    if (buffer.trim()) {
      parseSseEvent(buffer);
    }
    
  } catch (error) {
    console.error('Stream request failed:', error);
    throw error;
  }
}


export async function submitAnswerHistory(data) {
  const userID = getStoredUserId();
  if (!userID) {
    return { code: 401, message: '用户未登录' };
  }
  return post('/chat/answer-history', {
    userID,
    questionID: data.questionID,
    isCorrect: Boolean(data.isCorrect),
  });
}
