const params = new URLSearchParams(window.location.search);
const role = params.get('role') ?? '你的伙伴';
const talent = params.get('talent') ?? '未命名天赋';
const talentDesc = params.get('talentDesc') ?? '';

const summary = document.getElementById('summary');
const avatarInput = document.getElementById('avatarInput');
const uploadBtn = document.getElementById('uploadBtn');
const submitBtn = document.getElementById('submitBtn');
const dropZone = document.getElementById('dropZone');
const preview = document.getElementById('preview');
const placeholder = document.getElementById('uploadPlaceholder');
const statusText = document.getElementById('uploadStatus');

let previewDataUrl = null;
let selectedFile = null;

if (summary) {
    summary.innerHTML = `羁绊择定：<strong>${role}</strong> · 天赋觉醒：<strong>${talent}</strong>${talentDesc ? `（${talentDesc}）` : ''}`;
}

uploadBtn?.addEventListener('click', () => avatarInput?.click());
avatarInput?.addEventListener('change', handleFileSelect);

dropZone?.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('border-indigo-400');
});

dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-indigo-400');
});

dropZone?.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('border-indigo-400');
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    processFile(files[0]);
});

submitBtn?.addEventListener('click', async () => {
    if (!selectedFile) {
        alert('请先上传图片');
        return;
    }

    try {
        setStatus('正在唤醒灵魂影像...', false);
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('role', role);
        formData.append('talent', talent);
        formData.append('talentDesc', talentDesc);
        formData.append('image', selectedFile, selectedFile.name);

        // 使用相对路径，自动适配当前域名
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`接口报错：${response.status} ${errorText}`);
        }

        const data = await response.json();
        const imageUrl = data?.imageUrls?.[0] ?? null;
        setStatus('生图完成，即将进入注册成功页...', false);

        const successUrl = new URL('../register-success/index.html', window.location.href);
        if (imageUrl) {
            successUrl.searchParams.set('imageUrl', imageUrl);
        }
        successUrl.searchParams.set('role', role);
        successUrl.searchParams.set('talent', talent);
        successUrl.searchParams.set('talentDesc', talentDesc);

        window.location.href = successUrl.toString();
    } catch (error) {
        console.error(error);
        setStatus(`生成失败：${error.message}`, true);
        submitBtn.disabled = false;
    }
});

function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
}

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
        previewDataUrl = reader.result;
        if (preview) {
            preview.src = previewDataUrl;
            preview.classList.remove('hidden');
        }
        placeholder?.classList.add('hidden');
        submitBtn?.removeAttribute('disabled');
        setStatus('', false);
    };
    reader.readAsDataURL(file);
}

function setStatus(message, isError) {
    if (!statusText) return;
    statusText.textContent = message;
    statusText.classList.toggle('hidden', !message);
    statusText.classList.toggle('text-red-400', Boolean(isError));
}

