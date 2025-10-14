# 🚀 USE分支快速开始指南

## ✅ 已完成配置

- ✅ 项目已克隆到 `/Users/Uta/live-story-use`
- ✅ API Keys 已配置（Gemini, OpenRouter, Seedream）
- ✅ Firebase密钥已复制
- ✅ 前端服务器运行中（端口 9000）
- ✅ 后端服务器运行中（端口 5176）

---

## 🌐 测试链接

### 📱 主要页面

| 页面 | 链接 | 功能 |
|------|------|------|
| **首页** | http://localhost:9000/ | 项目入口 |
| **剧本选择** | http://localhost:9000/script.html | 浏览和选择剧本 |
| **直播页面** | http://localhost:9000/live.html | 互动直播剧情 |
| **模块化剧本页** | http://localhost:9000/pages/script/ | 新版剧本页 |
| **模块化直播页** | http://localhost:9000/pages/live/ | 新版直播页 |
| **大厅页面** | http://localhost:9000/pages/lobby/ | 等待大厅 |
| **注册流程** | http://localhost:9000/pages/register/ | 用户注册 |
| **用户资料** | http://localhost:9000/pages/profile/ | 个人资料 |

---

## 🎯 推荐测试流程

### 1. 访问首页
```
http://localhost:9000/
```

### 2. 登录（可选）
- 点击登录按钮
- 使用Google账号登录
- 完成角色设定

### 3. 选择剧本
```
http://localhost:9000/script.html
```
或
```
http://localhost:9000/pages/script/
```

### 4. 进入直播
```
http://localhost:9000/live.html
```
或
```
http://localhost:9000/pages/live/
```

---

## 🔑 核心功能测试

### AI剧情生成
后端服务器已配置Gemini API，可以：
- ✨ 自动生成剧情内容
- ✨ 根据玩家决策调整走向
- ✨ 生成对话和场景描述

### AI背景图生成
使用Seedream API：
- ✨ 自动生成场景背景图
- ✨ 匹配剧情氛围

### 实时互动
- 🎮 玩家决策系统
- 📊 观众投票功能
- 💬 实时字幕播放

---

## 🛠️ 服务器信息

### 前端服务器
```
地址: http://localhost:9000
端口: 9000
进程ID: 77565
```

### 后端服务器
```
地址: http://localhost:5176
端口: 5176
进程ID: 77718
API端点: /api/*
```

---

## 🔍 API端点

后端服务器提供的API：

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/generate-story` | POST | AI生成剧情 |
| `/api/generate-image` | POST | AI生成背景图 |
| `/api/player-decision` | POST | 保存玩家决策 |
| `/api/audience-vote` | POST | 保存观众投票 |

---

## 🎨 页面结构对比

### 原始页面（根目录）
```
index.html       - 简单首页
script.html      - 原始剧本页
live.html        - 原始直播页
```

### 模块化页面（pages/目录）
```
pages/script/    - 新版剧本选择
pages/live/      - 新版直播系统
pages/lobby/     - 等待大厅
pages/register/  - 注册流程（3步）
pages/profile/   - 用户资料
```

建议测试**模块化页面**，功能更完整！

---

## 🐛 故障排查

### 前端无法访问
```bash
# 检查服务器状态
lsof -ti:9000

# 重启前端服务器
cd /Users/Uta/live-story-use
python3 -m http.server 9000
```

### 后端API错误
```bash
# 查看后端日志
cd /Users/Uta/live-story-use/server
node index.js

# 检查.env配置
cat .env
```

### Firebase错误
```bash
# 检查密钥文件
ls -la /Users/Uta/live-story-use/serviceAccountKey.local.json
```

---

## 📊 与dev分支的区别

| 特性 | dev分支 | use分支（当前） |
|------|---------|----------------|
| **AI集成** | ❌ 无 | ✅ Gemini + Seedream |
| **用户系统** | ❌ 无 | ✅ Google登录 + Firebase |
| **页面结构** | 简单HTML | 模块化pages/ |
| **剧情生成** | 静态数据 | AI动态生成 |
| **背景图** | 静态链接 | AI实时生成 |
| **部署配置** | ❌ 无 | ✅ Vercel配置 |

---

## 🎯 快速体验建议

### 新手路线 🌟
1. http://localhost:9000/ （首页）
2. http://localhost:9000/pages/script/ （选剧本）
3. http://localhost:9000/pages/live/ （看直播）

### 开发者路线 💻
1. 查看 `server/index.js` 了解API
2. 查看 `assets/app.js` 了解前端逻辑
3. 查看 `pages/live/live.js` 了解直播系统

### AI功能测试 🤖
1. 打开浏览器开发者工具（F12）
2. 访问直播页面
3. 查看Network标签，观察AI API调用

---

## 📝 下一步探索

1. **测试AI剧情生成**
   - 进入直播页面
   - 做出决策
   - 观察AI如何生成后续剧情

2. **查看代码实现**
   ```bash
   # 后端AI集成
   cat /Users/Uta/live-story-use/server/index.js
   
   # 前端逻辑
   cat /Users/Uta/live-story-use/assets/app.js
   ```

3. **修改AI提示词**
   - 编辑 `server/index.js`
   - 自定义剧情生成风格

---

## 🚀 开始探索吧！

**立即访问：**
```
http://localhost:9000/
```

**推荐流程：**
1. 首页 → 了解项目
2. Script页 → 选择剧本  
3. Live页 → 体验AI剧情

祝测试愉快！🎉

