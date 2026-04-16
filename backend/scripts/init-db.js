/**
 * 数据库初始化脚本
 * 创建默认管理员账号
 */
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

const initDatabase = async () => {
  try {
    console.log('🔄 正在初始化数据库...');

    // 检查是否已有管理员账号
    const adminUsers = await query(
      'SELECT id FROM users WHERE role = ?',
      ['admin']
    );

    if (adminUsers.length > 0) {
      console.log('✅ 管理员账号已存在，跳过初始化');
      return;
    }

    // 创建默认管理员账号
    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      'INSERT INTO users (username, password, nickname, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, '系统管理员', 'admin', 1]
    );

    console.log('✅ 数据库初始化完成');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  默认管理员账号:');
    console.log(`    用户名: ${username}`);
    console.log(`    密码: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  require('dotenv').config();
  initDatabase().then(() => process.exit(0));
}

module.exports = { initDatabase };
