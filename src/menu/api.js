// 模拟 API 请求模块
// Mock API request module

/**
 * 获取顶部用户信息
 * Get top user information
 * @returns {Promise<Object>}
 */
export async function getUserInfo() {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    code: 200,
    data: {
      userId: "u123456",
      username: "Learner001",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Learner001", // 使用 DiceBear 生成头像
      role: "student"
    },
    message: "success"
  };
}

/**
 * 获取学习记录（用于渲染类似 Github 的贡献图）
 * Get learning records (for rendering Github-like contribution graph)
 * @param {Object} params - { year: number }
 * @returns {Promise<Object>}
 */
export async function getLearningRecords(params) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  // 生成一些模拟数据
  // Generate some mock data
  const data = [];
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    if (Math.random() > 0.7) { // 30% 概率有记录
      data.push({
        date: d.toISOString().split('T')[0],
        activityLevel: Math.floor(Math.random() * 5) // 0-4
      });
    }
  }

  // 确保示例数据存在
  // Ensure example data exists
  data.push({ date: "2023-10-01", activityLevel: 3 });
  data.push({ date: "2023-10-02", activityLevel: 1 });

  return {
    code: 200,
    data: data,
    message: "success"
  };
}

/**
 * 系统模块通知状态
 * System module notification status
 * @returns {Promise<Object>}
 */
export async function getSystemNotifications() {
  await new Promise(resolve => setTimeout(resolve, 200));

  return {
    code: 200,
    data: {
      studyGroupUnread: true, // 学习小组是否有新动态
      examPending: false // 是否有待考任务
    },
    message: "success"
  };
}
