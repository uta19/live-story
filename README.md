# 🎭 Aiko Mobile - 互动直播剧情系统

一个基于 AI 驱动的互动式直播剧情平台，支持实时剧情生成、玩家决策和观众投票。

## ✨ 功能特性

- 🤖 **AI 驱动剧情生成**：集成 Gemini API，动态生成引人入胜的剧情
- 🎨 **AI 背景图生成**：使用 Seedream API 自动生成场景背景
- 🎮 **玩家决策系统**：支持多玩家实时决策，影响剧情走向
- 📊 **观众互动投票**：观众可参与投票，影响故事发展
- 💬 **实时字幕播放**：自动轮播对话，支持角色头像和旁白
- 📱 **响应式设计**：完美适配手机、平板和桌面端
- 🔥 **离线缓存**：Script 页面支持离线浏览

## 🛠️ 技术栈

### 前端
- **HTML5 + CSS3 + JavaScript (ES6+)**
- **Tailwind CSS** - 样式框架
- **Firebase** - 用户认证和实时数据库

### 后端
- **Node.js + Express** - API 服务器
- **Axios** - HTTP 客户端
- **CORS** - 跨域支持

### AI 服务
- **Gemini API** (via OpenRouter) - 剧情生成
- **Seedream API** - 背景图生成

## 📦 项目结构

```
aiko-mobile/
├── assets/              # 全局资源
│   ├── app.js          # 主应用逻辑
│   ├── auth.js         # 用户认证
│   ├── firebase.js     # Firebase 配置
│   └── styles.css      # 全局样式
├── pages/              # 页面目录
│   ├── live/           # 直播页面
│   ├── lobby/          # 大厅页面
│   ├── script/         # 剧本选择页面
│   ├── register/       # 注册流程
│   └── profile/        # 用户资料
├── server/             # 后端服务器
│   ├── index.js        # Express 服务器
│   ├── .env.example    # 环境变量模板
│   └── package.json    # 依赖配置
├── index.html          # 首页
├── vercel.json         # Vercel 配置
└── DEPLOYMENT.md       # 部署指南
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/lys164/live-story.git
cd live-story
git checkout use
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd server
npm install
```

### 3. 配置环境变量

在 `server/` 目录下创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API keys：

```env
GEMINI_API_KEY=你的_gemini_api_key
SEEDREAM_API_KEY=你的_seedream_api_key
OPENROUTER_API_KEY=你的_openrouter_api_key
OPENROUTER_REFERER=http://localhost:53002
OPENROUTER_TITLE=Aiko Mobile Proxy
```

### 4. 启动服务

**启动后端服务器：**
```bash
cd server
node index.js
# 服务器运行在 http://localhost:5176
```

**启动前端服务器：**
```bash
# 在项目根目录
python3 -m http.server 53002
# 前端运行在 http://localhost:53002
```

### 5. 访问应用

打开浏览器访问：`http://localhost:53002`

## 📝 使用说明

### 1. 注册/登录
- 使用 Google 账号登录
- 完成角色设定（头像、人设）

### 2. 选择剧本
- 进入 Script 页面
- 浏览可用剧本
- 选择角色和策略

### 3. 开始直播
- 等待其他玩家加入
- 系统自动生成剧情
- 观看剧情展开
- 在决策点做出选择

### 4. 观众互动
- 观众可实时投票
- 投票结果影响剧情走向

## 🌐 部署到生产环境

详细部署指南请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)

**推荐方案**：
- 前端：Vercel（免费，自动 HTTPS）
- 后端：Railway（免费额度，自动休眠）
- 数据库：Firebase（已配置）

## 🔑 获取 API Keys

### Gemini API
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API key

### OpenRouter
1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册账号并获取 API key

### Seedream API
1. 访问 [火山引擎](https://www.volcengine.com/)
2. 开通视觉智能服务
3. 获取 API key

### Firebase
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目
3. 启用 Authentication（Google）
4. 启用 Firestore Database
5. 复制配置到 `assets/firebase.js`

## 🐛 常见问题

### 1. CORS 错误
确保后端服务器正确配置了 CORS，允许前端域名访问。

### 2. Firebase 连接失败
检查 Firebase 配置是否正确，网络连接是否正常。

### 3. API 调用失败
- 检查 `.env` 文件中的 API keys 是否正确
- 确认 API 配额是否用完
- 查看后端日志排查错误

## 📄 开源协议

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

- [Gemini API](https://ai.google.dev/) - AI 剧情生成
- [Seedream](https://www.volcengine.com/) - AI 图像生成
- [Firebase](https://firebase.google.com/) - 后端服务
- [Tailwind CSS](https://tailwindcss.com/) - UI 框架

