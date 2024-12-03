const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取所有播放列表
router.get('/', async (req, res) => {
    try {
        const [playlists] = await db.query('SELECT * FROM playlists ORDER BY created_at DESC');
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ message: '获取播放列表失败' });
    }
});

// 获取单个播放列表及其歌曲
router.get('/:id', async (req, res) => {
    try {
        // 获取播放列表信息
        const [playlists] = await db.query('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
        if (playlists.length === 0) {
            return res.status(404).json({ message: '播放列表不存在' });
        }
        const playlist = playlists[0];

        // 获取播放列表中的歌曲
        const [songs] = await db.query(`
            SELECT s.*, ps.position 
            FROM songs s 
            JOIN playlist_songs ps ON s.id = ps.song_id 
            WHERE ps.playlist_id = ? 
            ORDER BY ps.position
        `, [req.params.id]);

        playlist.songs = songs;
        res.json(playlist);
    } catch (error) {
        res.status(500).json({ message: '获取播放列表详情失败' });
    }
});

// 创建新播放列表
router.post('/', async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO playlists (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({ id: result.insertId, message: '播放列表创建成功' });
    } catch (error) {
        res.status(500).json({ message: '创建播放列表失败' });
    }
});

// 更新播放列表信息
router.put('/:id', async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE playlists SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '播放列表不存在' });
        }
        res.json({ message: '播放列表更新成功' });
    } catch (error) {
        res.status(500).json({ message: '更新播放列表失败' });
    }
});

// 删除播放列表
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM playlists WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '播放列表不存在' });
        }
        res.json({ message: '播放列表删除成功' });
    } catch (error) {
        res.status(500).json({ message: '删除播放列表失败' });
    }
});

// 添加歌曲到播放列表
router.post('/:id/songs', async (req, res) => {
    const { songId } = req.body;
    try {
        // 获取当前最大位置
        const [positions] = await db.query(
            'SELECT MAX(position) as maxPos FROM playlist_songs WHERE playlist_id = ?',
            [req.params.id]
        );
        const nextPosition = (positions[0].maxPos || 0) + 1;

        // 添加歌曲
        await db.query(
            'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
            [req.params.id, songId, nextPosition]
        );
        res.status(201).json({ message: '歌曲添加到播放列表成功' });
    } catch (error) {
        res.status(500).json({ message: '添加歌曲到播放列表失败' });
    }
});

// 从播放列表移除歌曲
router.delete('/:id/songs/:songId', async (req, res) => {
    try {
        await db.query(
            'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
            [req.params.id, req.params.songId]
        );
        res.json({ message: '歌曲从播放列表移除成���' });
    } catch (error) {
        res.status(500).json({ message: '从播放列表移除歌曲失败' });
    }
});

// 更新播放列表中歌曲顺序
router.put('/:id/songs/reorder', async (req, res) => {
    const { songOrders } = req.body; // 格式: [{songId: 1, position: 1}, {songId: 2, position: 2}]
    try {
        // 使用事务确保所有更新都成功
        await db.query('START TRANSACTION');
        
        for (const order of songOrders) {
            await db.query(
                'UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?',
                [order.position, req.params.id, order.songId]
            );
        }
        
        await db.query('COMMIT');
        res.json({ message: '播放列表顺序更新成功' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: '更新播放列表顺序失败' });
    }
});
module.exports = router; 