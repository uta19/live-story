const fs = require('fs');
const path = require('path');

// 需要处理的文件
const files = [
  'pages/script/script.js',
  'pages/script/index.html',
  'pages/register-success/index.html',
  'pages/profile/index.html',
  'pages/lobby/index.html',
  'pages/live/live.js',
  'pages/live/index.html',
];

let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // 替换 Figma 图片链接
  // 匹配 https://www.figma.com/api/mcp/asset/xxxxx
  const regex = /https:\/\/www\.figma\.com\/api\/mcp\/asset\/[a-zA-Z0-9-]+/g;
  const matches = content.match(regex);
  
  if (matches) {
    content = content.replace(regex, (match) => {
      return `/api/proxy-image?url=${encodeURIComponent(match)}`;
    });
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file}: 替换了 ${matches.length} 个图片链接`);
    totalReplacements += matches.length;
  } else {
    console.log(`⏭️  ${file}: 没有找到 Figma 图片链接`);
  }
});

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ 总共替换了 ${totalReplacements} 个图片链接`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

