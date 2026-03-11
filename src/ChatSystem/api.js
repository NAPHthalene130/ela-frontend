// 模拟 API 请求模块
// Mock API request module

/**
 * 获取左侧“历史对话列表”（支持分页）
 * Get history list (support pagination)
 * @param {Object} params - { page: number, limit: number }
 * @returns {Promise<Object>}
 */
export async function getHistoryList(params) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    code: 200,
    data: {
      has_more: true,
      history_list: [
        {
          session_id: "sess_888",
          title: "图的遍历与DFS算法",
          updated_at: "2026-03-10T08:23:18Z"
        },
        {
          session_id: "sess_887",
          title: "二叉树的红黑树插入规则",
          updated_at: "2026-03-09T14:00:00Z"
        },
        {
          session_id: "sess_886",
          title: "Vue 3 组合式 API 最佳实践",
          updated_at: "2026-03-08T10:15:00Z"
        },
        {
          session_id: "sess_885",
          title: "CSS Grid 布局详解",
          updated_at: "2026-03-07T16:45:00Z"
        }
      ]
    },
    message: "success"
  };
}

/**
 * 获取某个会话的聊天详情
 * Get chat details for a specific session
 * @param {Object} params - { session_id: string }
 * @returns {Promise<Object>}
 */
export async function getChatDetail(params) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    code: 200,
    data: {
      messages: [
        {
          role: "user",
          type: "text",
          content: "深度优先搜索怎么写？",
          created_at: "2026-03-10T08:20:00Z"
        },
        {
          role: "assistant",
          type: "text",
          content: "DFS的核心在于使用栈或者递归来遍历图的所有节点。以下是一个简单的递归实现示例（JavaScript）：\n\n```javascript\nfunction dfs(node, visited) {\n  if (!node || visited.has(node)) return;\n  visited.add(node);\n  console.log(node.value);\n  node.neighbors.forEach(neighbor => dfs(neighbor, visited));\n}\n```",
          created_at: "2026-03-10T08:20:05Z"
        }
      ]
    },
    message: "success"
  };
}

/**
 * 发送新消息（占位接口）
 * Send new message (placeholder)
 * @param {Object} data - { user_id: string, session_id: string, turn_id: number, content: string }
 * @returns {Promise<Object>}
 */
export async function sendChatMessage(data) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));

  // 简单模拟回复
  return {
    code: 200,
    data: {
      role: "assistant",
      type: "text",
      content: `你刚才问的是：“${data.content}”。\n这是一个模拟的 AI 回复。`,
      created_at: new Date().toISOString()
    },
    message: "success"
  };
}

/**
 * 发送真实流式消息
 * Send real streaming message
 * @param {Object} data - { user_id: string, session_id: string, turn_id: number, content: string }
 * @param {Function} onChunk - Callback for each text chunk
 * @returns {Promise<void>}
 */
export async function sendChatMessageStream(data, onChunk) {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last potentially incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const json = JSON.parse(line);
          if (json.type === 'text_chunk' && json.content) {
            onChunk(json.content);
          }
        } catch (e) {
          console.warn('Failed to parse JSON chunk:', line, e);
        }
      }
    }
    
    // Process any remaining buffer
    if (buffer.trim()) {
       try {
          const json = JSON.parse(buffer);
          if (json.type === 'text_chunk' && json.content) {
            onChunk(json.content);
          }
        } catch (e) {
          console.warn('Failed to parse final JSON chunk:', buffer, e);
        }
    }

  } catch (error) {
    console.error('Stream request failed:', error);
    throw error;
  }
}
