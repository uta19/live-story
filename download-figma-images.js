const https = require('https');
const fs = require('fs');
const path = require('path');

// 所有需要下载的Figma图片
const images = [
  // 系统状态图标
  { url: 'https://www.figma.com/api/mcp/asset/4f6657fe-bd74-4777-a7ba-71384daba6bf', name: 'system-status-1.png' },
  { url: 'https://www.figma.com/api/mcp/asset/59412f63-6f71-48e8-bb35-96dc809b558c', name: 'system-status-2.png' },
  { url: 'https://www.figma.com/api/mcp/asset/1929a028-fa75-4047-9c1c-902a68513096', name: 'system-status-3.png' },
  { url: 'https://www.figma.com/api/mcp/asset/01702fc3-17b4-400d-88b6-3f85db9a5fd8', name: 'system-status-4.png' },
  
  // 注册成功页
  { url: 'https://www.figma.com/api/mcp/asset/6dde43a2-253c-45ff-8ef9-a5c2e1085c25', name: 'register-bg.png' },
  { url: 'https://www.figma.com/api/mcp/asset/f11d9c3f-762a-476b-bff7-de86677f8474', name: 'default-character.png' },
  { url: 'https://www.figma.com/api/mcp/asset/4003178d-f7d6-4270-820c-fc63ed352804', name: 'light-effect.png' },
  
  // 角色主页
  { url: 'https://www.figma.com/api/mcp/asset/6bc8dcea-f08e-4616-b45f-caa0c02d87a0', name: 'profile-asuka.png' },
  { url: 'https://www.figma.com/api/mcp/asset/af1cb920-9e24-4230-8589-147a6aef78a3', name: 'skin-icon.png' },
  { url: 'https://www.figma.com/api/mcp/asset/8bfe716a-7a18-41c2-bd83-f9530279897e', name: 'arrow-up.png' },
  { url: 'https://www.figma.com/api/mcp/asset/12b1d593-6b62-4ff0-b526-ed6341c33c21', name: 'chat-icon.png' },
  { url: 'https://www.figma.com/api/mcp/asset/807a281e-8464-4207-afbf-420d3dd5389b', name: 'settings-icon.png' },
  
  // 大厅页
  { url: 'https://www.figma.com/api/mcp/asset/796eb908-cc1b-4d69-8398-4108a3031186', name: 'lobby-bg-stars.png' },
  { url: 'https://www.figma.com/api/mcp/asset/4727500c-9af4-4d3c-ae9a-67b2f9cc0862', name: 'lobby-icon-1.png' },
  { url: 'https://www.figma.com/api/mcp/asset/7c52cb8a-5a75-436a-993d-2c25ca6ee46a', name: 'lobby-icon-2.png' },
  { url: 'https://www.figma.com/api/mcp/asset/28866ea8-713b-4f07-9bf8-7ab2ba5e1e6a', name: 'lobby-icon-3.png' },
  { url: 'https://www.figma.com/api/mcp/asset/91c2d590-bb64-4f55-81ab-f928d17f54d6', name: 'lobby-room-1.png' },
  { url: 'https://www.figma.com/api/mcp/asset/57b0c3c7-48da-4c5f-bd68-ee412429fe95', name: 'lobby-room-2.png' },
  { url: 'https://www.figma.com/api/mcp/asset/41026908-3d53-4dae-83f4-c6ed15280d3e', name: 'lobby-room-3.png' },
  { url: 'https://www.figma.com/api/mcp/asset/8a6a86cc-6fe7-43ae-807e-f8fe4d71a6b2', name: 'lobby-room-4.png' },
  { url: 'https://www.figma.com/api/mcp/asset/eecdf1af-78fc-4d18-ad3b-f6253828b2c2', name: 'lobby-room-5.png' },
  { url: 'https://www.figma.com/api/mcp/asset/5111f168-fd80-4bf2-a794-36366d30f6c3', name: 'lobby-room-6.png' },
  { url: 'https://www.figma.com/api/mcp/asset/3794a50f-1ff9-4090-8460-50d9f27ec608', name: 'lobby-room-7.png' },
  { url: 'https://www.figma.com/api/mcp/asset/7a652d1b-da04-4394-84ff-3f95c77e8f97', name: 'lobby-room-8.png' },
  { url: 'https://www.figma.com/api/mcp/asset/176d18d7-c6b3-48d6-b570-f476d16bc3dd', name: 'lobby-room-9.png' },
  { url: 'https://www.figma.com/api/mcp/asset/b605ab9e-12f4-427e-ba6e-de5507cce423', name: 'lobby-room-10.png' },
  { url: 'https://www.figma.com/api/mcp/asset/e0469b30-84a7-45ba-8dad-cd757ff39431', name: 'lobby-banner.png' },
  
  // 直播页
  { url: 'https://www.figma.com/api/mcp/asset/39204d24-70f8-48b9-a3de-96e4ee4135ac', name: 'audience-1.png' },
  { url: 'https://www.figma.com/api/mcp/asset/f5203649-9a15-4d2b-b7bb-38a81430c8ad', name: 'audience-2.png' },
  { url: 'https://www.figma.com/api/mcp/asset/74703ad7-4939-4177-bc72-894bd2893bc0', name: 'audience-3.png' },
  { url: 'https://www.figma.com/api/mcp/asset/6ff7b7a7-7b4c-4bae-b659-a666de8b326f', name: 'audience-4.png' },
  { url: 'https://www.figma.com/api/mcp/asset/7d5fb588-adf3-4486-8c38-3bfc38be901b', name: 'audience-5.png' },
  { url: 'https://www.figma.com/api/mcp/asset/a733fbff-74d6-4551-8f14-54abd322ce2f', name: 'live-default-bg.png' },
  
  // 剧本页
  { url: 'https://www.figma.com/api/mcp/asset/9cfa55f7-b450-4ce6-bbb5-73b65d7a4cc2', name: 'user-avatar.png' },
  { url: 'https://www.figma.com/api/mcp/asset/1a013bd4-eeb6-498c-a688-a3f811a10e88', name: 'room-avatar.png' },
];

const outputDir = path.join(__dirname, 'assets', 'images');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadImage(imageObj) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, imageObj.name);
    
    // 如果文件已存在，跳过
    if (fs.existsSync(outputPath)) {
      console.log(`✓ 跳过 ${imageObj.name} (已存在)`);
      resolve();
      return;
    }
    
    console.log(`⬇️  下载 ${imageObj.name}...`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.figma.com/',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    };
    
    https.get(imageObj.url, options, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        console.log(`↪️  重定向 ${imageObj.name}`);
        https.get(response.headers.location, options, (redirectResponse) => {
          if (redirectResponse.statusCode === 200) {
            const file = fs.createWriteStream(outputPath);
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`✅ 完成 ${imageObj.name}`);
              resolve();
            });
          } else {
            console.error(`❌ 失败 ${imageObj.name}: HTTP ${redirectResponse.statusCode}`);
            reject(new Error(`HTTP ${redirectResponse.statusCode}`));
          }
        }).on('error', reject);
        return;
      }
      
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(outputPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ 完成 ${imageObj.name}`);
          resolve();
        });
      } else {
        console.error(`❌ 失败 ${imageObj.name}: HTTP ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (error) => {
      console.error(`❌ 错误 ${imageObj.name}:`, error.message);
      reject(error);
    });
  });
}

async function downloadAll() {
  console.log(`\n开始下载 ${images.length} 张图片到 ${outputDir}\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const img of images) {
    try {
      await downloadImage(img);
      success++;
    } catch (error) {
      failed++;
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 成功: ${success}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

downloadAll().catch(console.error);

