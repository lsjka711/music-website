const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// 中间件：检查用户是否已登录
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: '请先登录' });
    }
    next();
};

// 注册
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // 检查用户名是否已存在
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: '用户名或邮箱已存在' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const [result] = await db.query(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );

        // 自动登录
        req.session.userId = result.insertId;
        req.session.username = username;

        res.status(201).json({
            message: '注册成功',
            user: { id: result.insertId, username, email }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ message: '注册失败' });
    }
});

// 登录
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 查找用户
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        const user = users[0];

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 设置session
        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({
            message: '登录成功',
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '登录失败' });
    }
});

// 获取当前用户信息
router.get('/me', requireAuth, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ message: '获取用户信息失败' });
    }
});

// 退出登录
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('退出登录错误:', err);
            return res.status(500).json({ message: '退出登录失败' });
        }
        res.json({ message: '退出登录成功' });
    });
});

// 修改密码
router.put('/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // 获取用户信息
        const [users] = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const user = users[0];

        // 验证当前密码
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '当前密码错误' });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.session.userId]
        );

        res.json({ message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({ message: '修改密码失败' });
    }
});

module.exports = {
    router,
    requireAuth
}; 