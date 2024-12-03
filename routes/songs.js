const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取所有歌曲
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM songs');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: '获取歌曲列表失败' });
    }
});

// 获取单个歌曲
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM songs WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: '歌曲不存在' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: '获取歌曲详情失败' });
    }
});

// 添加新歌曲
router.post('/', async (req, res) => {
    const { title, artist, album, duration } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO songs (title, artist, album, duration) VALUES (?, ?, ?, ?)',
            [title, artist, album, duration]
        );
        res.status(201).json({ id: result.insertId, message: '歌曲添加成功' });
    } catch (error) {
        res.status(500).json({ message: '添加歌曲失败' });
    }
});

// 更新歌曲信息
router.put('/:id', async (req, res) => {
    const { title, artist, album, duration } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE songs SET title = ?, artist = ?, album = ?, duration = ? WHERE id = ?',
            [title, artist, album, duration, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '歌曲不存在' });
        }
        res.json({ message: '歌曲更新成功' });
    } catch (error) {
        res.status(500).json({ message: '更新歌曲失败' });
    }
});

// 删除歌曲
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM songs WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '歌曲不存在' });
        }
        res.json({ message: '歌曲删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除歌曲失败' });
    }
});

module.exports = router; 