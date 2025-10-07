const params = new URLSearchParams(window.location.search);
const imageUrl = params.get('imageUrl');
const role = params.get('role');
const talent = params.get('talent');
const talentDesc = params.get('talentDesc');

const canvas = document.getElementById('successCanvas');
const defaultContent = document.getElementById('defaultContent');
const summaryInfo = document.getElementById('summaryInfo');

if (summaryInfo) {
    const parts = [];
    if (role) parts.push(`羁绊：${role}`);
    if (talent) parts.push(`天赋：${talent}`);
    if (talentDesc) parts.push(talentDesc);
    summaryInfo.textContent = parts.join(' ｜ ') || 'Ta 已准备好与你踏入无限世界。';
}

if (imageUrl && canvas) {
    const container = document.createElement('div');
    container.className = 'result-image';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'AI 生成形象';
    img.loading = 'lazy';
    container.appendChild(img);
    canvas.appendChild(container);
    container.style.display = 'flex';
    if (defaultContent) {
        defaultContent.style.opacity = '0.1';
    }
}

