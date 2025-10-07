# 部署指南

## 📦 部署架构

```
前端（Vercel/Netlify） → 后端服务器（Railway/Render） → Firebase + API
```

---

## 🚀 方案一：Vercel + Railway（推荐）

### 步骤 1: 部署后端到 Railway

1. **访问 [Railway](https://railway.app/)**
   - 使用 GitHub 账号登录
   - 点击 "New Project" → "Deploy from GitHub repo"
   - 选择 `live-story` 仓库，分支选择 `use`

2. **配置 Root Directory**
   - 在 Railway 项目设置中，设置 Root Directory 为 `server`
   - 这样 Railway 会只部署 server 文件夹

3. **添加环境变量**
   在 Railway 项目的 Variables 中添加：
   ```
   GEMINI_API_KEY=你的_gemini_api_key
   SEEDREAM_API_KEY=你的_seedream_api_key
   OPENROUTER_API_KEY=你的_openrouter_api_key
   OPENROUTER_REFERER=https://你的域名.railway.app
   OPENROUTER_TITLE=Aiko Mobile Proxy
   PORT=5176
   ```

4. **记录后端 URL**
   - 部署完成后，Railway 会给你一个 URL，类似：
   - `https://你的项目名.railway.app`
   - **保存这个 URL，前端需要用到**

---

### 步骤 2: 部署前端到 Vercel

1. **访问 [Vercel](https://vercel.com/)**
   - 使用 GitHub 账号登录
   - 点击 "Add New..." → "Project"
   - 选择 `live-story` 仓库

2. **配置部署**
   - **Framework Preset**: Other
   - **Root Directory**: `.` (项目根目录)
   - **Build Command**: 留空（静态站点）
   - **Output Directory**: `.` (项目根目录)

3. **更新前端 API 地址**
   
   部署完成后，你需要更新前端代码中的 API 地址：
   
   **文件**: `pages/live/live.js`
   
   找到这些地方：
   ```javascript
   // 修改前
   const PROXY_URL = 'http://localhost:5176';
   
   // 修改后
   const PROXY_URL = 'https://你的项目名.railway.app';
   ```

4. **重新部署**
   - 提交代码更改
   - Vercel 会自动重新部署

---

## 🚀 方案二：Netlify + Render

### 步骤 1: 部署后端到 Render

1. **访问 [Render](https://render.com/)**
   - 注册/登录账号
   - 点击 "New +" → "Web Service"
   - 连接 GitHub 仓库 `live-story`

2. **配置服务**
   - **Name**: aiko-mobile-server
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`

3. **添加环境变量**
   在 Environment 标签页添加：
   ```
   GEMINI_API_KEY=你的_gemini_api_key
   SEEDREAM_API_KEY=你的_seedream_api_key
   OPENROUTER_API_KEY=你的_openrouter_api_key
   OPENROUTER_REFERER=https://你的域名.onrender.com
   OPENROUTER_TITLE=Aiko Mobile Proxy
   ```

4. **记录后端 URL**
   - 例如：`https://aiko-mobile-server.onrender.com`

---

### 步骤 2: 部署前端到 Netlify

1. **访问 [Netlify](https://www.netlify.com/)**
   - 登录账号
   - 点击 "Add new site" → "Import an existing project"
   - 选择 GitHub 仓库 `live-story`

2. **配置部署**
   - **Branch**: `use`
   - **Base directory**: 留空
   - **Build command**: 留空
   - **Publish directory**: `.`

3. **更新前端 API 地址**（同方案一）

---

## 🔧 部署后需要修改的文件

### 1. `pages/live/live.js`

找到并修改 API 地址：

```javascript
// 第 8-10 行左右
const PROXY_URL = 'https://你的后端域名';  // 改成你的 Railway 或 Render URL
```

### 2. 提交并推送更改

```bash
git add .
git commit -m "chore: 更新生产环境 API 地址"
git push origin use
```

---

## 🔐 Firebase 配置

前端使用的 Firebase 配置在 `assets/firebase.js` 中已经包含。如果需要修改：

```javascript
const firebaseConfig = {
  apiKey: "你的_firebase_api_key",
  authDomain: "你的_项目.firebaseapp.com",
  projectId: "你的_项目_id",
  // ...其他配置
};
```

---

## ✅ 验证部署

1. **测试后端**：
   ```bash
   curl https://你的后端域名/health
   ```
   应该返回 OK 或服务器状态

2. **测试前端**：
   - 访问 Vercel/Netlify 给你的域名
   - 尝试登录
   - 进入 live 页面测试剧情生成

---

## 🐛 常见问题

### 1. CORS 错误
如果前端无法访问后端，在 `server/index.js` 中确认 CORS 配置：

```javascript
app.use(cors({
  origin: ['https://你的前端域名.vercel.app', 'https://你的前端域名.netlify.app'],
  credentials: true
}));
```

### 2. 环境变量未生效
- 检查环境变量拼写是否正确
- 重启服务（Railway/Render 会自动重启）
- 查看部署日志确认变量已加载

### 3. 502 Bad Gateway
- 检查后端服务是否正常运行
- 查看后端日志排查错误
- 确认端口配置正确（Railway 自动分配端口）

---

## 💡 推荐配置

- **前端**: Vercel（免费，自动 HTTPS，全球 CDN）
- **后端**: Railway（免费额度足够，自动休眠唤醒）
- **数据库**: Firebase（已配置）

---

## 📝 自定义域名（可选）

### Vercel
1. 进入项目设置 → Domains
2. 添加你的域名
3. 在域名服务商处添加 CNAME 记录

### Railway
1. 进入项目设置 → Domains
2. 添加自定义域名
3. 配置 DNS 记录

