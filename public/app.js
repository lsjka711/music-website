document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const mainContent = document.getElementById('mainContent');
    const homeLink = document.getElementById('homeLink');
    const songsLink = document.getElementById('songsLink');
    const playlistsLink = document.getElementById('playlistsLink');
    const addSongModal = new bootstrap.Modal(document.getElementById('addSongModal'));
    const addSongForm = document.getElementById('addSongForm');
    const submitSongBtn = document.getElementById('submitSong');

    // 路由处理
    const routes = {
        home: () => showHome(),
        songs: () => showSongs(),
        playlists: () => showPlaylists()
    };

    // 导航事件监听
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        routes.home();
    });

    songsLink.addEventListener('click', (e) => {
        e.preventDefault();
        routes.songs();
    });

    playlistsLink.addEventListener('click', (e) => {
        e.preventDefault();
        routes.playlists();
    });

    // 显示首页
    function showHome() {
        mainContent.innerHTML = `
            <div class="jumbotron text-center">
                <h1 class="display-4">欢迎来到音乐网站</h1>
                <p class="lead">发现、收听和分享你喜爱的音乐</p>
                <hr class="my-4">
                <p>开始探索数百万首歌曲、播放列表和艺术家。</p>
                <button class="btn btn-primary btn-lg" onclick="routes.songs()">浏览歌曲</button>
            </div>
        `;
    }

    // 显示歌曲列表
    async function showSongs() {
        mainContent.innerHTML = '<div class="loading">加载中...</div>';
        try {
            const response = await fetch('/api/songs');
            const songs = await response.json();
            
            let html = `
                <div class="song-list">
                    <h2 class="mb-4">歌曲列表</h2>
                    <div class="mb-3">
                        <input type="text" class="form-control" id="searchInput" placeholder="搜索歌曲、歌手或专辑...">
                    </div>
                    <button class="btn btn-primary mb-3" onclick="showAddSongModal()">添加新歌曲</button>
                    <div class="list-group" id="songsList">
            `;
            
            songs.forEach(song => {
                html += generateSongHtml(song);
            });
            
            html += `
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = html;

            // 添加搜索功能
            const searchInput = document.getElementById('searchInput');
            searchInput.addEventListener('input', debounce(handleSearch, 500));
        } catch (error) {
            mainContent.innerHTML = '<div class="error-message">账号没有登录，请先登录</div>';
        }
    }

    // 生成歌曲HTML
    function generateSongHtml(song) {
        return `
            <div class="list-group-item song-item">
                <div class="song-info">
                    <h5 class="mb-1">${song.title}</h5>
                    <p class="mb-1">歌手：${song.artist}</p>
                    <small>专辑：${song.album || '未知'} | 时长：${formatDuration(song.duration)}</small>
                </div>
                <div class="song-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="editSong(${song.id}, '${song.title}', '${song.artist}', '${song.album || ''}', ${song.duration})">编辑</button>
                    <button class="btn btn-sm btn-outline-info" onclick="toggleComments(${song.id})">评论</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSong(${song.id})">删除</button>
                </div>
                <div class="comments-section" id="comments-${song.id}" style="display: none;">
                    <div class="mt-3">
                        <h6>评论</h6>
                        <div class="comments-list" id="comments-list-${song.id}"></div>
                        <form class="mt-2" onsubmit="event.preventDefault(); addComment(${song.id});">
                            <div class="input-group">
                                <input type="text" class="form-control form-control-sm" id="username-${song.id}" placeholder="你的名字" required>
                                <input type="text" class="form-control form-control-sm" id="comment-${song.id}" placeholder="添加评论..." required>
                                <button class="btn btn-sm btn-primary" type="submit">发送</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // 搜索处理函数
    async function handleSearch() {
        const query = this.value.trim();
        if (!query) {
            showSongs();
            return;
        }

        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            const songs = await response.json();
            
            const songsListElement = document.getElementById('songsList');
            songsListElement.innerHTML = songs.map(song => generateSongHtml(song)).join('');
        } catch (error) {
            console.error('搜索失败:', error);
        }
    }

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 切换评论显示
    window.toggleComments = async (songId) => {
        const commentsSection = document.getElementById(`comments-${songId}`);
        const isHidden = commentsSection.style.display === 'none';
        
        if (isHidden) {
            commentsSection.style.display = 'block';
            await loadComments(songId);
        } else {
            commentsSection.style.display = 'none';
        }
    };

    // 加载评论
    async function loadComments(songId) {
        try {
            const response = await fetch(`/api/comments/song/${songId}`);
            const comments = await response.json();
            
            const commentsList = document.getElementById(`comments-list-${songId}`);
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <strong>${comment.username}</strong>: ${comment.content}
                    <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                </div>
            `).join('') || '<p class="text-muted">暂无评论</p>';
        } catch (error) {
            console.error('加载评论失败:', error);
        }
    }

    // 添加评论
    window.addComment = async (songId) => {
        const usernameInput = document.getElementById(`username-${songId}`);
        const commentInput = document.getElementById(`comment-${songId}`);
        const username = usernameInput.value.trim();
        const content = commentInput.value.trim();

        if (!username || !content) return;

        try {
            const response = await fetch(`/api/comments/song/${songId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, content })
            });

            if (response.ok) {
                commentInput.value = '';
                await loadComments(songId);
            } else {
                throw new Error('添加评论失败');
            }
        } catch (error) {
            alert('添加评论失败，请重试');
        }
    };

    // 修改显示播放列表函数
    async function showPlaylists() {
        mainContent.innerHTML = '<div class="loading">加载中...</div>';
        try {
            const response = await fetch('/api/playlists');
            const playlists = await response.json();
            
            let html = `
                <div class="playlist-container">
                    <h2 class="mb-4">播放列表</h2>
                    <button class="btn btn-primary mb-3" onclick="showCreatePlaylistModal()">创建新播放列表</button>
                    <div class="row">
            `;
            
            playlists.forEach(playlist => {
                html += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">${playlist.name}</h5>
                                <p class="card-text">${playlist.description || '暂无描述'}</p>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-sm btn-primary" onclick="viewPlaylist(${playlist.id})">查看</button>
                                    <button class="btn btn-sm btn-danger" onclick="deletePlaylist(${playlist.id})">删除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = html;
        } catch (error) {
            mainContent.innerHTML = '<div class="error-message">账号没有登录，请先登录</div>';
        }
    }

    // 查看单个播放列表
    window.viewPlaylist = async (playlistId) => {
        mainContent.innerHTML = '<div class="loading">加载中...</div>';
        try {
            const response = await fetch(`/api/playlists/${playlistId}`);
            const playlist = await response.json();
            
            let html = `
                <div class="playlist-detail">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>${playlist.name}</h2>
                        <button class="btn btn-primary" onclick="showAddToPlaylistModal(${playlistId})">添加歌曲</button>
                    </div>
                    <p class="text-muted">${playlist.description || '暂无描述'}</p>
                    <div class="list-group">
            `;
            
            if (playlist.songs && playlist.songs.length > 0) {
                playlist.songs.forEach(song => {
                    html += `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-1">${song.title}</h5>
                                <p class="mb-1">歌手：${song.artist}</p>
                                <small>专辑：${song.album || '未知'} | 时长：${formatDuration(song.duration)}</small>
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="removeFromPlaylist(${playlistId}, ${song.id})">移除</button>
                        </div>
                    `;
                });
            } else {
                html += '<p class="text-center text-muted">播放列表暂无歌曲</p>';
            }
            
            html += `
                    </div>
                    <button class="btn btn-secondary mt-3" onclick="showPlaylists()">返回列表</button>
                </div>
            `;
            
            mainContent.innerHTML = html;
        } catch (error) {
            mainContent.innerHTML = '<div class="error-message">加载播放列表详情失败</div>';
        }
    };

    // 创建播放列表模态框
    window.showCreatePlaylistModal = () => {
        const modalHtml = `
            <div class="modal fade" id="createPlaylistModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">创建新播放列表</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="createPlaylistForm">
                                <div class="mb-3">
                                    <label class="form-label">播放列表名称</label>
                                    <input type="text" class="form-control" name="name" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">描述</label>
                                    <textarea class="form-control" name="description" rows="3"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="createPlaylist()">创建</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv);

        const modal = new bootstrap.Modal(document.getElementById('createPlaylistModal'));
        modal.show();

        document.getElementById('createPlaylistModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    };

    // 创建播放列表
    window.createPlaylist = async () => {
        const form = document.getElementById('createPlaylistForm');
        const formData = new FormData(form);
        const playlistData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(playlistData)
            });

            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('createPlaylistModal'));
                modal.hide();
                showPlaylists();
            } else {
                throw new Error('创建播放列表失败');
            }
        } catch (error) {
            alert('创建播放列表失败，请重试');
        }
    };

    // 删除播放列表
    window.deletePlaylist = async (playlistId) => {
        if (confirm('确定要删除这个播放列表吗？')) {
            try {
                const response = await fetch(`/api/playlists/${playlistId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showPlaylists();
                } else {
                    throw new Error('删除播放列表失败');
                }
            } catch (error) {
                alert('删除播放列表失败，请重试');
            }
        }
    };

    // 显示添加歌曲到播放列表的模态框
    window.showAddToPlaylistModal = async (playlistId) => {
        try {
            const response = await fetch('/api/songs');
            const songs = await response.json();

            const modalHtml = `
                <div class="modal fade" id="addToPlaylistModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">添加歌曲到播放列表</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="list-group">
                                    ${songs.map(song => `
                                        <button type="button" class="list-group-item list-group-item-action" 
                                                onclick="addToPlaylist(${playlistId}, ${song.id})">
                                            ${song.title} - ${song.artist}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = modalHtml;
            document.body.appendChild(modalDiv);

            const modal = new bootstrap.Modal(document.getElementById('addToPlaylistModal'));
            modal.show();

            document.getElementById('addToPlaylistModal').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });
        } catch (error) {
            alert('加载歌曲列表失败，请重试');
        }
    };

    // 添加歌曲到播放列表
    window.addToPlaylist = async (playlistId, songId) => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}/songs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ songId })
            });

            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addToPlaylistModal'));
                modal.hide();
                viewPlaylist(playlistId);
            } else {
                throw new Error('添加歌曲到播放列表失败');
            }
        } catch (error) {
            alert('添加歌曲到播放列表失败，请重试');
        }
    };

    // 从播放列表移除歌曲
    window.removeFromPlaylist = async (playlistId, songId) => {
        if (confirm('确定要从播放列表中移除这首歌吗？')) {
            try {
                const response = await fetch(`/api/playlists/${playlistId}/songs/${songId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    viewPlaylist(playlistId);
                } else {
                    throw new Error('从播放列表移除歌曲失败');
                }
            } catch (error) {
                alert('从播放列表移除歌曲失败，请重试');
            }
        }
    };

    // 格式化时长
    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 添加歌曲
    submitSongBtn.addEventListener('click', async () => {
        const formData = new FormData(addSongForm);
        const songData = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/api/songs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(songData)
            });
            
            if (response.ok) {
                addSongModal.hide();
                addSongForm.reset();
                showSongs();
            } else {
                throw new Error('添加歌曲失败');
            }
        } catch (error) {
            alert('添加歌曲失败，请重试');
        }
    });

    // 删除歌曲
    window.deleteSong = async (id) => {
        if (confirm('确定要删除这首歌曲吗？')) {
            try {
                const response = await fetch(`/api/songs/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showSongs();
                } else {
                    throw new Error('删除歌曲失败');
                }
            } catch (error) {
                alert('删除歌曲失败，请重试');
            }
        }
    };

    // 编辑歌曲
    window.editSong = (id, title, artist, album, duration) => {
        // 创建编辑模态框
        const editModalHtml = `
            <div class="modal fade" id="editSongModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">编辑歌曲</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editSongForm">
                                <div class="mb-3">
                                    <label class="form-label">歌曲名称</label>
                                    <input type="text" class="form-control" name="title" value="${title}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">歌手</label>
                                    <input type="text" class="form-control" name="artist" value="${artist}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">专辑</label>
                                    <input type="text" class="form-control" name="album" value="${album}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">时长（秒）</label>
                                    <input type="number" class="form-control" name="duration" value="${duration}" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="updateSong(${id})">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加模态框到页面
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = editModalHtml;
        document.body.appendChild(modalDiv);

        // 显示模态框
        const editModal = new bootstrap.Modal(document.getElementById('editSongModal'));
        editModal.show();

        // 模态框关闭时删除元素
        document.getElementById('editSongModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    };

    // 更新歌曲
    window.updateSong = async (id) => {
        const form = document.getElementById('editSongForm');
        const formData = new FormData(form);
        const songData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/api/songs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(songData)
            });

            if (response.ok) {
                const editModal = bootstrap.Modal.getInstance(document.getElementById('editSongModal'));
                editModal.hide();
                showSongs();
            } else {
                throw new Error('更新歌曲失败');
            }
        } catch (error) {
            alert('更新歌曲失败，请重试');
        }
    };

    // 显示添加歌曲模态框
    window.showAddSongModal = () => {
        addSongModal.show();
    };

    // 检查用户登录状态
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const user = await response.json();
                showUserInfo(user);
                return true;
            } else {
                showAuthButtons();
                return false;
            }
        } catch (error) {
            console.error('检查登录状态失败:', error);
            showAuthButtons();
            return false;
        }
    }

    // 显示用户信息
    function showUserInfo(user) {
        document.getElementById('authButtons').classList.add('d-none');
        document.getElementById('userInfo').classList.remove('d-none');
        document.getElementById('username').textContent = user.username;
    }

    // 显示登录/注册按钮
    function showAuthButtons() {
        document.getElementById('authButtons').classList.remove('d-none');
        document.getElementById('userInfo').classList.add('d-none');
        document.getElementById('username').textContent = '';
    }

    // 显示登录模态框
    window.showLoginModal = () => {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    };

    // 显示注册模态框
    window.showRegisterModal = () => {
        const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
        registerModal.show();
    };

    // 显示修改密码模态框
    window.showChangePasswordModal = () => {
        const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        changePasswordModal.show();
    };

    // 登录
    window.login = async () => {
        const form = document.getElementById('loginForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                loginModal.hide();
                form.reset();
                showUserInfo(result.user);
                routes.home();
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            alert('登录失败，请重试');
        }
    };

    // 注册
    window.register = async () => {
        const form = document.getElementById('registerForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        delete data.confirmPassword;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                registerModal.hide();
                form.reset();
                showUserInfo(result.user);
                routes.home();
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            alert('注册失败，请重试');
        }
    };

    // 修改密码
    window.changePassword = async () => {
        const form = document.getElementById('changePasswordForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.newPassword !== data.confirmNewPassword) {
            alert('两次输入的新密码不一致');
            return;
        }

        delete data.confirmNewPassword;

        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (response.ok) {
                const changePasswordModal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                changePasswordModal.hide();
                form.reset();
                alert('密码修改成功');
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            alert('修改密码失败，请重试');
        }
    };

    // 退出登录
    window.logout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                showAuthButtons();
                routes.home();
            } else {
                throw new Error('退出登录失败');
            }
        } catch (error) {
            alert('退出登录失败，请重试');
        }
    };

    // 修改所有API请求，添加credentials选项
    async function fetchWithAuth(url, options = {}) {
        return fetch(url, {
            ...options,
            credentials: 'include'
        });
    }

    // 替换所有fetch调用为fetchWithAuth
    // 在现有的fetch调用中添加credentials: 'include'选项

    // 初始化：检查登录状态并显示首页
    checkAuth().then(() => {
        routes.home();
    });

    // 修复首页浏览歌曲按钮
    window.routes = routes;
}); 