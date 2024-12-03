const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取歌曲的所有评论
router.get('/song/:songId', async (req, res) => {
    try {
        const [comments] = await db.query(
            'SELECT * FROM comments WHERE song_id = ? ORDER BY created_at DESC',
            [req.params.songId]
        );
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: '获取评论失败' });
    }
});

// 添加评论
router.post('/song/:songId', async (req, res) => {
    const { username, content } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO comments (song_id, username, content) VALUES (?, ?, ?)',
            [req.params.songId, username, content]
        );
        res.status(201).json({ id: result.insertId, message: '评论添加成功' });
    } catch (error) {
        res.status(500).json({ message: '添加评论失败' });
    }
});

// 删除评论
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '评论不存在' });
        }
        res.json({ message: '评论删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除评论失败' });
    }
});

module.exports = router; 