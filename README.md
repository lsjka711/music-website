# 音乐网站项目

这是一个基于Node.js和MySQL的音乐网站项目，提供用户认证、音乐管理、播放列表、评论等功能。

## 功能特点

### 用户系统
- 用户注册和登录
- 密码加密存储
- Session会话管理
- 修改密码功能

### 音乐管理
- 音乐列表展示
- 添加新歌曲
- 编辑歌曲信息
- 删除歌曲
- 音乐搜索功能

### 播放列表
- 创建个人播放列表
- 向播放列表添加/删除歌曲
- 查看播放列表详情
- 删除播放列表

### 评论系统
- 对歌曲发表评论
- 查看歌曲评论
- 删除评论

### 其他特性
- 响应式界面设计
- RESTful API
- 用户权限控制
- 实时搜索功能

## 技术栈

### 后端
- Node.js
- Express.js
- MySQL
- express-session（会话管理）
- bcryptjs（密码加密）
- cors（跨域支持）

### 前端
- Bootstrap 5（UI框架）
- 原生JavaScript
- Fetch API（数据请求）

### 数据库
- MySQL（数据存储）

## 安装步骤

1. 克隆项目到本地：
```bash
git clone [项目地址]
cd music-website
```

2. 安装依赖：
```bash
npm install express mysql2 cors dotenv bcryptjs express-session
```

3. 配置数据库：
- 确保MySQL服务已启动
- 创建 `.env` 文件并配置以下环境变量：
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=music_website
```

4. 初始化数据库：
```bash
# 登录到MySQL
mysql -u root -p

# 在MySQL中执行
source init.sql
```

5. 启动服务器：
```bash
# 开发模式（使用nodemon）
npm install -g nodemon
nodemon app.js

# 生产模式
node app.js
```

6. 访问网站：
打开浏览器访问 `http://localhost:3000`

## 项目结构

```
music-website/
├── config/             # 配置文件
│   └── database.js     # 数据库配置
├── routes/             # 路由文件
│   ├── auth.js         # 用户认证路由
│   ├── songs.js        # 歌曲相关路由
│   ├── playlists.js    # 播放列表路由
│   └── comments.js     # 评论相关路由
├── public/             # 静态文件
│   ├── index.html      # 主页面
│   ├── styles.css      # 样式文件
│   └── app.js          # 前端逻辑
├── app.js              # 应用入口文件
├── init.sql            # 数据库初始化脚本
├── .env                # 环境变量配置
└── README.md           # 项目说明文档
```

## API文档

### 用户认证接口
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 退出登录
- GET /api/auth/me - 获取当前用户信息
- PUT /api/auth/password - 修改密码

### 歌曲相关接口
- GET /api/songs - 获取所有歌曲
- GET /api/songs/:id - 获取单个歌曲
- POST /api/songs - 添加新歌曲
- PUT /api/songs/:id - 更新歌曲信息
- DELETE /api/songs/:id - 删除歌曲
- GET /api/search?query=关键词 - 搜索歌曲

### 播放列表接口
- GET /api/playlists - 获取所有播放列表
- GET /api/playlists/:id - 获取播放列表详情
- POST /api/playlists - 创建新播放列表
- PUT /api/playlists/:id - 更新播放列表
- DELETE /api/playlists/:id - 删除播放列表
- POST /api/playlists/:id/songs - 添加歌曲到播放列表
- DELETE /api/playlists/:id/songs/:songId - 从播放列表移除歌曲

### 评论接口
- GET /api/comments/song/:songId - 获取歌曲评论
- POST /api/comments/song/:songId - 添加评论
- DELETE /api/comments/:id - 删除评论

## 开发说明

### 开发模式
使用 nodemon 实现热重载：
```bash
npm install -g nodemon
nodemon app.js
```

### 调试
- 检查 MySQL 服务状态
- 查看控制台错误信息
- 确保环境变量配置正确
- 检查网络请求状态

## 注意事项

- 确保 MySQL 服务正常运行
- 正确配置数据库连接信息
- 所有 API 请求需要在请求头中设置 `Content-Type: application/json`
- 大部分 API 需要用户登录后才能访问
- 密码在存储时会自动加密
- Session 会在 24 小时后过期

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交改动
4. 发起 Pull Request

## 许可证

MIT License 