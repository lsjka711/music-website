const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件配置
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'music-website-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 数据库连接配置
const db = require('./config/database');

// 路由配置
const { router: authRoutes, requireAuth } = require('./routes/auth');
const songRoutes = require('./routes/songs');
const playlistRoutes = require('./routes/playlists');
const commentRoutes = require('./routes/comments');

app.use('/api/auth', authRoutes);
app.use('/api/songs', requireAuth, songRoutes);
app.use('/api/playlists', requireAuth, playlistRoutes);
app.use('/api/comments', requireAuth, commentRoutes);

// 搜索歌曲
app.get('/api/search', requireAuth, async (req, res) => {
    const { query } = req.query;
    try {
        const [songs] = await db.query(
            'SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?',
            [`%${query}%`, `%${query}%`, `%${query}%`]
        );
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: '搜索失败' });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('服务器出错了！');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 