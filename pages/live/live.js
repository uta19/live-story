import '../../assets/app.js';
import { getFirebaseApp } from '../../assets/firebase.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let livePayload = null;
let unsubscribeDecisions = null;
let unsubscribeEngagementVotes = null;
let cumulatedDecisions = {};
let promptConfigCache = null;
let hasTriggeredGeneration = false;
let expectedDecisionCount = null;
let manualStartUsed = false;
const barrageMessages = [];
let isGenerating = false;
let isNarrativePlaying = false;
let pendingDecisionSignature = '';
let lastGeneratedDecisionSignature = '';

let autoGeneratePending = false;

const PROXY_ORIGIN = window.__PROXY_ORIGIN__ || 'http://localhost:5176';
const DEFAULT_GEMINI_INPUT_TEMPLATE = `#剧情背景 {model_facing_content}
# 玩家决策 {decision_output}
# 观众们投票结果 {audience_engagement_output}
# 角色信息 {character_setup}
# 角色当前状态 {character_states}`;

function applyTemplate(template, values) {
  return template.replace(/\{(.*?)\}/g, (match, key) => {
    const value = values[key.trim()];
    return typeof value === 'string' ? value : String(value ?? '');
  });
}

const DEFAULT_BACKGROUND = '/api/proxy-image?url=https%3A%2F%2Fwww.figma.com%2Fapi%2Fmcp%2Fasset%2Fa733fbff-74d6-4551-8f14-54abd322ce2f';
const DIALOGUE_DELAY = 1100;
const DIALOGUE_AUTO_ADVANCE_MS = 6000;

const wait = (ms = DIALOGUE_DELAY) => new Promise((resolve) => setTimeout(resolve, ms));

function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = text.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sliced);
      } catch (innerError) {
        console.error('safeParseJson secondary failure', {
          preview: sliced.slice(0, 200),
          error: innerError
        });
      }
    }
    console.error('safeParseJson primary failure', {
      preview: text.slice(0, 200),
      error
    });
    return null;
  }
}

function createStoryContext(storyId = null) {
  return {
    storyId,
    modelFacingContent: '',
    characterSetup: '',
    characterStates: '',
    characterImages: {},
    lastDecisions: [],
    allDecisions: [],
    lastEngagements: [],
    allEngagements: []
  };
}

let storyContext = createStoryContext();
let currentEngagementResult = null;
let lastDecisionResults = [];
let lastEngagementResults = [];
let characterAvatarMap = {};
let pollSelection = null;

const statusCard = document.getElementById('live-status');
const statusText = document.getElementById('live-status-text');
const forceStartButton = document.getElementById('live-force-start');
const mainTitle = document.getElementById('live-main-title');
const pollTitle = document.getElementById('live-poll-title');
const pollPrompt = document.getElementById('live-poll-prompt');
const pollYesBar = document.getElementById('live-poll-yes');
const pollYesLabel = document.getElementById('live-poll-yes-label');
const pollNoBar = document.getElementById('live-poll-no');
const pollNoLabel = document.getElementById('live-poll-no-label');
let currentEngagementOptions = [];
const pollYesButton = document.querySelector('[data-option="yes"]');
const pollNoButton = document.querySelector('[data-option="no"]');
const pollYesText = document.getElementById('live-poll-yes-text');
const pollNoText = document.getElementById('live-poll-no-text');

const backgroundImage = document.getElementById('live-background');
const visualEffectsLayer = document.getElementById('live-visual-effects');
const dialogueOverlay = document.getElementById('live-dialogue-overlay');
const dialoguePlayer = document.getElementById('live-dialogue-player');
const dialogueBubble = document.getElementById('live-dialogue-bubble');
const dialogueSpeaker = document.getElementById('live-dialogue-speaker');
const dialogueText = document.getElementById('live-dialogue-text');
const dialoguesContainer = document.getElementById('live-dialogues');
const decisionContainer = document.getElementById('live-decision');
const decisionPrompt = document.getElementById('live-decision-prompt');
const decisionOptions = document.getElementById('live-decision-options');
const decisionConfirm = document.getElementById('live-decision-confirm');
const progressStep = document.getElementById('live-progress-step');
const progressBar = document.getElementById('live-progress-bar');

const barrageContainer = document.getElementById('live-barrage');
const barrageForm = document.getElementById('live-barrage-form');
const barrageInput = document.getElementById('live-barrage-input');
const storyWrapper = document.getElementById('live-story-wrapper');
const storyPanel = document.getElementById('live-story-info');
const storyToggle = document.getElementById('live-story-toggle');
const storyIcon = document.getElementById('live-story-icon');

const dialogueProgress = null;
const dialogueNextButton = null;

let currentDecisionPoint = null;
let currentEngagementPoint = null;
let currentEngagementId = null;
let pollTotals = { yes: 50, no: 50 };

const DECISION_TIMEOUT_MS = 5000;
let decisionTimer = null;

function clearDecisionTimer() {
  if (decisionTimer) {
    clearTimeout(decisionTimer);
    decisionTimer = null;
  }
}

function renderDecisionPoint(block) {
  const point = block?.decision_point;
  if (!point || !decisionContainer || !decisionPrompt || !decisionOptions) return;

  currentDecisionPoint = point;
  decisionContainer.classList.remove('hidden');
  decisionPrompt.textContent = point.prompt || '请做出选择';
  decisionOptions.innerHTML = '';

  (point.options || []).forEach((opt) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:border-white/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ffcc00]/80';
    button.innerHTML = `
      <span class="font-semibold">${opt.text || opt.strategy || opt.id}</span>
      ${opt.strategy && opt.text ? `<p class="mt-1 text-xs text-white/60">${opt.text}</p>` : ''}
    `;
    button.addEventListener('click', () => {
      decisionContainer.dataset.selectedOption = opt.id;
      decisionOptions.querySelectorAll('button').forEach((b) => {
        b.classList.remove('border-[#ffcc00]', 'bg-[#ffcc00]/10');
      });
      button.classList.add('border-[#ffcc00]', 'bg-[#ffcc00]/10');
    });
    decisionOptions.appendChild(button);
  });

  clearDecisionTimer();
  decisionTimer = setTimeout(async () => {
    const options = point.options || [];
    if (!options.length) return;
    const random = options[Math.floor(Math.random() * options.length)];
    decisionContainer.dataset.selectedOption = random.id;
    await submitDecisionSelection();
  }, DECISION_TIMEOUT_MS);
}

function renderEngagementPoint(block) {
  const point = block?.audience_engagement_point;
  if (!point || !pollPrompt || !pollTitle) return;

  currentEngagementPoint = point;
  currentEngagementId = point.engagement_id;
  currentEngagementOptions = point.options || [];

  if (pollYesButton && currentEngagementOptions[0]) {
    pollYesButton.dataset.option = currentEngagementOptions[0].id || 'yes';
    pollYesText.textContent = currentEngagementOptions[0].text || currentEngagementOptions[0].id;
  }
  if (pollNoButton && currentEngagementOptions[1]) {
    pollNoButton.dataset.option = currentEngagementOptions[1].id || 'no';
    pollNoText.textContent = currentEngagementOptions[1].text || currentEngagementOptions[1].id;
  }

  pollTitle.textContent = point.prompt_to_audience || '投票进行中';
  pollPrompt.textContent = '参与投票即可影响剧情走向';

  updatePollDisplay();
  if (point.engagement_id) {
    subscribeToEngagementVotes(livePayload.storyId, point.engagement_id);
  }
}

function setStatus(message, variant = 'info') {
  if (!statusCard || !statusText) return;
  statusCard.classList.remove('hidden');
  statusText.textContent = message;
  if (variant === 'error') {
    statusCard.classList.remove('text-white/70');
    statusCard.classList.add('text-red-400');
  } else {
    statusCard.classList.remove('text-red-400');
    statusCard.classList.add('text-white/70');
  }
}

function hideStatus() {
  if (!statusCard) return;
  statusCard.classList.add('hidden');
}

function appendBarrage(message) {
  if (!barrageContainer) return;
  barrageMessages.push(message);
  if (barrageMessages.length > 30) barrageMessages.shift();
  barrageContainer.innerHTML = barrageMessages
    .map((item) => `<p>${item}</p>`)
    .join('');
  barrageContainer.scrollTop = barrageContainer.scrollHeight;
}

function populateStoryInfo() {
  const raw = window.localStorage.getItem('aiko-selected-story');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    livePayload = data;
    resetStoryContext(data.storyId || data.storyName || null);

    if (mainTitle) mainTitle.textContent = data.storyName || '直播剧情';
    if (pollTitle) pollTitle.textContent = '投票未开始';
    if (pollPrompt) pollPrompt.textContent = '参与投票即可影响剧情走向';

    // 设置背景图为剧本封面
    if (data.storyImage && backgroundImage) {
      backgroundImage.src = data.storyImage;
    }

    if (!storyWrapper || !storyPanel || !storyToggle || !storyIcon) return;

    const title = document.getElementById('live-story-name');
    const characterName = document.getElementById('live-character-name');
    const publicIdentity = document.getElementById('live-character-public');
    const relationships = document.getElementById('live-character-relationships');
    const secret = document.getElementById('live-character-secret');
    const context = document.getElementById('live-choice-context');
    const prompt = document.getElementById('live-choice-prompt');
    const option = document.getElementById('live-choice-option');
    const response = document.getElementById('live-choice-response');

    if (title) title.textContent = data.storyName || '角色详情';
    if (characterName) characterName.textContent = data.characterName ? `角色：${data.characterName}` : '';
    if (publicIdentity) publicIdentity.textContent = data.publicIdentity ? `身份：${data.publicIdentity}` : '';
    if (relationships)
      relationships.textContent = data.initialRelationships ? `关系：${data.initialRelationships}` : '';
    if (secret) secret.textContent = data.secretObjective ? `目标：${data.secretObjective}` : '';
    if (context) context.textContent = data.choiceContext || '';
    if (prompt) prompt.textContent = data.choicePrompt || '';
    if (option)
      option.textContent = data.optionStrategy || data.optionText
        ? `策略：${data.optionStrategy || ''} ${data.optionText || ''}`
        : '';
    if (response)
      response.textContent = data.responseText ? `你的计划：${data.responseText}` : '';

    storyWrapper.classList.remove('hidden');
    storyPanel.classList.add('hidden');

    storyToggle.addEventListener('click', () => {
      const isHidden = storyPanel.classList.contains('hidden');
      storyPanel.classList.toggle('hidden', !isHidden);
      storyIcon.textContent = isHidden ? '收起 ⌃' : '展开 ⌄';
    });

    window.localStorage.removeItem('aiko-selected-story');
  } catch (error) {
    console.warn('解析剧本缓存失败', error);
  }
}

async function fetchPromptConfig(storyId) {
  if (promptConfigCache?.storyId === storyId) return promptConfigCache;
  const promptDoc = await getDoc(doc(db, 'Prompts', 'systemprompt-live'));
  const promptData = promptDoc.exists() ? promptDoc.data() : {};

  const storyDoc = await getDoc(doc(db, 'script', storyId));
  const storyData = storyDoc.exists() ? storyDoc.data() : null;

  updateStoryContextAfterPrompt(storyData);
  characterAvatarMap = storyContext.characterImages;

  promptConfigCache = {
    storyId,
    systemPrompt: promptData?.systemprompt || '',
    inputTemplate: promptData?.int || '',
    storyData
  };

  return promptConfigCache;
}

function getExpectedCharacterNames(storyData) {
  if (!storyData?.model_facing_content?.character_pool) return [];
  return storyData.model_facing_content.character_pool.map((c) => c.character_name || c.characterId).filter(Boolean);
}

function getRandomOption(options = []) {
  if (!Array.isArray(options) || !options.length) return null;
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

function updatePollBars(yes = 50, no = 50) {
  pollTotals = { yes, no };
  if (pollYesBar) pollYesBar.style.width = `${yes}%`;
  if (pollNoBar) pollNoBar.style.width = `${no}%`;
  if (pollYesLabel) pollYesLabel.textContent = `${yes}%`;
  if (pollNoLabel) pollNoLabel.textContent = `${no}%`;
}

function clearNarrative() {
  if (backgroundImage) {
    backgroundImage.src = '/api/proxy-image?url=https%3A%2F%2Fwww.figma.com%2Fapi%2Fmcp%2Fasset%2Fa733fbff-74d6-4551-8f14-54abd322ce2f';
  }
  if (visualEffectsLayer) visualEffectsLayer.innerHTML = '';
  if (dialoguesContainer) dialoguesContainer.innerHTML = '';
  if (decisionContainer) {
    decisionContainer.classList.add('hidden');
    decisionContainer.dataset.selectedOption = '';
  }
  currentDecisionPoint = null;
  currentEngagementPoint = null;
  currentEngagementId = null;
  pollPrompt.textContent = '参与投票即可影响剧情走向';
  if (pollTitle) pollTitle.textContent = '投票未开始';
  if (forceStartButton) {
    forceStartButton.disabled = false;
    forceStartButton.classList.remove('opacity-50', 'pointer-events-none');
  }
}

function clearDialoguesAndInteractions() {
  // 不隐藏字幕面板，只清空内容
  if (dialogueSpeaker) dialogueSpeaker.textContent = '';
  if (dialogueText) dialogueText.textContent = '';
  if (visualEffectsLayer) {
    visualEffectsLayer.innerHTML = '';
  }
  if (dialoguesContainer) {
    dialoguesContainer.innerHTML = '';
  }
  if (decisionContainer) {
    decisionContainer.classList.add('hidden');
    decisionContainer.dataset.selectedOption = '';
  }
  currentDecisionPoint = null;
  currentEngagementPoint = null;
  currentEngagementId = null;
  pollPrompt.textContent = '参与投票即可影响剧情走向';
  if (pollTitle) pollTitle.textContent = '投票未开始';

  // 清空对话队列
  dialogueQueue.length = 0;
  resetDialogueTimers();
}

async function renderDialogues(block) {
  if (!dialoguesContainer) return;
  await ensureCharacterImages(livePayload?.storyId);
  const dialogues = Array.isArray(block.dialogues) ? block.dialogues : [];

  for (let index = 0; index < dialogues.length; index += 1) {
    const dialogue = dialogues[index];
    if (!dialogue?.text) continue;

    const bubble = document.createElement('div');
    const isPlayer = dialogue.speaker === livePayload?.characterName;
    const avatarUrl = getCharacterImage(dialogue.speaker);

    if (dialogue.speaker === '旁白') {
      bubble.className = 'flex w-full justify-center';
      bubble.innerHTML = `<div class="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80">${dialogue.text}</div>`;
    } else {
      bubble.className = `flex items-start gap-3 ${isPlayer ? 'justify-end text-right' : 'justify-start text-left'}`;
      bubble.innerHTML = isPlayer
        ? `
          <div class="max-w-[75%] rounded-2xl bg-[#ffcc00] px-4 py-3 text-sm text-black">
            <p class="text-xs opacity-70">${dialogue.speaker}</p>
            <p class="mt-1">${dialogue.text}</p>
          </div>
          <img src="${avatarUrl}" alt="${dialogue.speaker}" class="h-12 w-12 rounded-full object-cover" />
        `
        : `
          <img src="${avatarUrl}" alt="${dialogue.speaker}" class="h-12 w-12 rounded-full object-cover" />
          <div class="max-w-[75%] rounded-2xl bg-white/10 px-4 py-3 text-sm text-white">
            <p class="text-xs opacity-70">${dialogue.speaker}</p>
            <p class="mt-1">${dialogue.text}</p>
          </div>
        `;
    }

    dialoguesContainer.appendChild(bubble);
    dialoguesContainer.scrollTop = dialoguesContainer.scrollHeight;

    if (index < dialogues.length - 1) {
      await wait();
    }
  }
}

function renderVisualEffects(block) {
  if (!visualEffectsLayer) return;
  visualEffectsLayer.innerHTML = '';
  if (Array.isArray(block.visual_effects)) {
    block.visual_effects.forEach((effect) => {
      const span = document.createElement('span');
      span.className = `visual-effect ${effect}`;
      visualEffectsLayer.appendChild(span);
    });
  }
}

async function renderBackground(block) {
  if (!backgroundImage) return;
  const prompt = block.background_image || '';
  if (!prompt) {
    backgroundImage.src = DEFAULT_BACKGROUND;
    return;
  }

  try {
    const generatedUrl = await requestSeedreamImage(prompt);
    if (generatedUrl) {
      backgroundImage.src = generatedUrl;
    } else {
      backgroundImage.src = DEFAULT_BACKGROUND;
    }
  } catch (error) {
    console.warn('生成背景图失败', error);
    backgroundImage.src = DEFAULT_BACKGROUND;
  }
}

const seedreamImageCache = new Map();

async function requestSeedreamImage(prompt) {
  try {
    if (!prompt) return null;
    if (seedreamImageCache.has(prompt)) return seedreamImageCache.get(prompt);
    const response = await fetch(`${PROXY_ORIGIN}/api/seedream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error(`Seedream 代理请求失败：${response.status}`);
    const data = await response.json();
    const image = data?.imageUrl || null;
    if (image) seedreamImageCache.set(prompt, image);
    return image;
  } catch (error) {
    console.warn('请求 Seedream API 出错', error);
    return null;
  }
}

async function callGemini(systemPrompt, input) {
  const response = await fetch(`${PROXY_ORIGIN}/api/gemini`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ systemPrompt, input })
  });

  if (!response.ok) {
    throw new Error(`Gemini API 请求失败：${response.status}`);
  }

  const result = await response.json();
  appendBarrage('系统：直播剧情已生成，敬请期待 ✨');
  return result;
}

function resolveNarrativePayload(result) {
  const stripCodeFence = (text) => {
    if (!text) return text;
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\s*/i, '');
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.replace(/```$/i, '');
      } else {
        cleaned = cleaned.replace(/```/g, '');
      }
    }
    return cleaned.trim();
  };

  const pickFirstText = (content) => {
    if (!content) return '';
    if (typeof content === 'string') return stripCodeFence(content);
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === 'string') return stripCodeFence(item);
          if (item?.text) return stripCodeFence(item.text);
          if (item?.type === 'text' && item?.text) return stripCodeFence(item.text);
          return '';
        })
        .filter(Boolean)
        .join('\n')
        .trim();
    }
    if (typeof content === 'object' && content.text) return stripCodeFence(content.text);
    return '';
  };

  if (result?.choices?.length) {
    const choice = result.choices[0];
    const message = choice?.message;
    if (typeof message === 'string') return stripCodeFence(message);
    if (message?.content) {
      const text = pickFirstText(message.content);
      if (text) return text;
    }
  }

  if (result?.candidates?.length) {
    const candidate = result.candidates[0];
    const content = candidate?.content || candidate?.output;
    if (typeof content === 'string') return stripCodeFence(content);
    const text = pickFirstText(content);
    if (text) return text;
  }

  return null;
}

async function playNarrative(result) {
  isNarrativePlaying = true;
  hideStatus();
  setForceStartState({ visible: false });
  clearDecisionTimer();
  try {
    const payloadText = resolveNarrativePayload(result);
    const parsedPayload = payloadText ? payloadText : result;
    const parsed = typeof parsedPayload === 'string' ? safeParseJson(parsedPayload) : parsedPayload;

    if (!parsed) {
      throw new Error('无法解析模型返回内容');
    }

    const blocks = parsed?.narrative_block || [];

    if (!blocks.length) {
      throw new Error('narrative_block 缺失');
    }

    const backgroundPromises = blocks
      .map((block) => block.background_image)
      .filter(Boolean)
      .map((prompt) => requestSeedreamImage(prompt));
    if (backgroundPromises.length) {
      await Promise.allSettled(backgroundPromises);
    }

    clearDialoguesAndInteractions();
    if (backgroundImage) backgroundImage.src = DEFAULT_BACKGROUND;

    lastDecisionResults = [];
    lastEngagementResults = [];

    for (const block of blocks) {
      await renderBackground(block);
      renderVisualEffects(block);
      await renderDialogueBlock(block);
      if (block.decision_point) {
        renderDecisionPoint(block);
        lastDecisionResults.push(block.decision_point);
      }
      if (block.audience_engagement_point) {
        renderEngagementPoint(block);
        lastEngagementResults.push(block.audience_engagement_point);
      }
    }

    recordDecisionHistory(lastDecisionResults);
    recordEngagementHistory(lastEngagementResults);

    const totalBlocks = blocks.length;
    updateProgressDisplay(totalBlocks, totalBlocks);

    if (Array.isArray(parsed?.updated_character_states)) {
      recordCharacterStates(parsed.updated_character_states);
      parsed.updated_character_states.forEach((state) => {
        appendBarrage(`系统：${state.id} 状态更新 -> ${JSON.stringify(state.status_change)}`);
      });
    }
    isNarrativePlaying = false;
    manualStartUsed = false;
    setForceStartState({ visible: false });

    // 播放完成后，自动生成下一段剧情
    await evaluateDecisionsReady();

    // 如果没有等待决策，显示 loading 并自动生成下一段
    if (!currentDecisionPoint) {
      console.log('🔄 准备自动生成下一段剧情');
      console.log('当前状态:', { isGenerating, isNarrativePlaying, hasTriggeredGeneration, livePayload: !!livePayload });

      setStatus('正在生成下一段剧情...', 'loading');
      appendBarrage('系统：剧情生成中，请稍候... ✨');

      // 延迟2秒后生成，让用户有时间看完
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('⏰ 延迟结束，开始调用 tryGenerateLiveContent');

      try {
        await tryGenerateLiveContent();
        console.log('✅ tryGenerateLiveContent 调用完成');
      } catch (error) {
        console.error('❌ 自动生成下一段剧情失败', error);
        appendBarrage('系统：自动生成失败，请手动点击"直接开始"');
        setForceStartState({ visible: true, enabled: true });
      }
    } else {
      console.log('⏸️ 存在决策点，等待玩家选择');
    }
  } catch (error) {
    console.error('解析或渲染剧情失败', error);
    appendBarrage('系统：解析剧情失败，请稍后重试');
    isNarrativePlaying = false;
    manualStartUsed = false;
    hasTriggeredGeneration = false;
    setForceStartState({ visible: true, enabled: true });
    clearDecisionTimer();
  }
}

async function tryGenerateLiveContent() {
  console.log('🎬 tryGenerateLiveContent 被调用');
  console.log('检查条件:', { livePayload: !!livePayload, isGenerating });

  if (!livePayload) {
    console.warn('❌ livePayload 为空，跳过生成');
    return;
  }

  if (isGenerating) {
    console.warn('⏳ 正在生成中，跳过本次调用');
    return;
  }

  console.log('✅ 条件通过，开始生成剧情');
  const { systemPrompt, inputTemplate, storyData } = await fetchPromptConfig(livePayload.storyId);

  const modelFacingContent = storyContext.modelFacingContent || '{}';
  const decisionOutput = buildDecisionOutputForPrompt(!hasTriggeredGeneration) || '[]';
  const engagementOutput = buildEngagementOutputForPrompt(!hasTriggeredGeneration) || '[]';
  const characterSetup = storyContext.characterSetup || '[]';
  const characterStates = storyContext.characterStates || '[]';

  const rawTemplate = inputTemplate && typeof inputTemplate === 'string' ? inputTemplate : '';
  const template = rawTemplate.trim().length ? rawTemplate : DEFAULT_GEMINI_INPUT_TEMPLATE;
  const rawInput = applyTemplate(template, {
    'model_facing_content': modelFacingContent,
    'decision_output': decisionOutput,
    'audience_engagement_output': engagementOutput,
    'character_setup': characterSetup,
    'character_states': characterStates
  });

  const input = rawInput.replace(/\s+/g, ' ').trim();

  console.debug('[live] Gemini 输入调试', {
    templateLength: template.length,
    modelFacingContentLength: modelFacingContent.length,
    decisionOutputLength: decisionOutput.length,
    engagementOutputLength: engagementOutput.length,
    characterSetupLength: characterSetup.length,
    characterStatesLength: characterStates.length,
    finalInputLength: input.length,
    finalInputPreview: `${input.slice(0, 200)}...${input.slice(-80)}`
  });

  if (!input || input.trim() === '') {
    console.warn('Gemini input is empty, skipping generation.');
    setStatus('生成直播剧情失败，请稍后重试。', 'error');
    if (forceStartButton) {
      forceStartButton.disabled = false;
      forceStartButton.classList.remove('opacity-50', 'pointer-events-none');
    }
    return;
  }

  const statusMessage = hasTriggeredGeneration
    ? '正在生成下一段剧情...'
    : '全员已就位，正在生成直播剧情...';
  setStatus(statusMessage);
  isGenerating = true;

  try {
    const result = await callGemini(systemPrompt, input);
    autoGeneratePending = false;
    setStatus('直播剧情生成完成，开始播放');

    // 标记已经生成过一次，后续显示"下一段"
    hasTriggeredGeneration = true;

    // 在调用 playNarrative 之前重置 isGenerating
    // 这样 playNarrative 完成后可以立即开始下一轮生成
    isGenerating = false;

    await playNarrative(result);
  } catch (error) {
    console.error(error);
    setStatus('生成直播剧情失败，请稍后重试。', 'error');
    manualStartUsed = false;
    autoGeneratePending = false;
    hasTriggeredGeneration = false;
    isGenerating = false;
    if (forceStartButton) {
      forceStartButton.disabled = false;
      forceStartButton.classList.remove('opacity-50', 'pointer-events-none');
    }
  } finally {
    autoGeneratePending = false;
    if (forceStartButton) {
      forceStartButton.disabled = false;
      forceStartButton.classList.remove('opacity-50', 'pointer-events-none');
    }
  }
}

async function forceFillDecisions() {
  const { storyData } = await fetchPromptConfig(livePayload.storyId);
  const expectedCharacters = getExpectedCharacterNames(storyData);
  expectedDecisionCount = expectedCharacters.length || expectedDecisionCount;
  expectedCharacters.forEach((characterName) => {
    const existing = Object.values(cumulatedDecisions).find(
      (d) => d.characterName === characterName || d.characterId === characterName
    );
    if (!existing) {
      const choice = storyData?.user_facing_content?.opening_choices?.find(
        (item) => item.character_id === characterName || item.character_name === characterName
      );
      const randomOption = getRandomOption(choice?.options || []);
      if (randomOption) {
        cumulatedDecisions[`auto-${characterName}`] = {
          characterId: characterName,
          characterName,
          prompt: choice?.prompt || '',
          options: choice?.options || [],
          selectedOption: {
            id: randomOption.id || '',
            strategy: randomOption.strategy || '',
            text: randomOption.text || ''
          },
          selectedOptionId: randomOption.id || '',
          selectedOptionStrategy: randomOption.strategy || '',
          selectedOptionText: randomOption.text || '',
          responseText: '[系统随机策略]',
          autoGenerated: true,
          updatedAt: serverTimestamp()
        };
      }
    }
  });
}

function subscribeToDecisions(storyId) {
  if (unsubscribeDecisions) unsubscribeDecisions();
  const decisionsRef = collection(db, 'sessions', storyId, 'decisions');
  unsubscribeDecisions = onSnapshot(
    decisionsRef,
    async (snapshot) => {
      const decisions = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        cumulatedDecisions[docSnap.id] = data;
        decisions.push(data);
      });
      recordDecisionHistory(decisions);
      const { storyData } = await fetchPromptConfig(storyId);
      expectedDecisionCount = storyData?.model_facing_content?.character_pool?.length || decisions.length;
      await ensureCharacterImages(storyId);
      await evaluateDecisionsReady();
    },
    (error) => {
      console.error('监听策略失败', error);
      setStatus('监听玩家策略时出错，请刷新页面。', 'error');
    }
  );
}

async function evaluateDecisionsReady() {
  if (!livePayload || isNarrativePlaying || isGenerating) return;
  await ensureCharacterImages(livePayload.storyId);
  const config = await fetchPromptConfig(livePayload.storyId);
  const required = expectedDecisionCount || config.storyData?.model_facing_content?.character_pool?.length || 0;
  const current = Object.keys(cumulatedDecisions).length;

  if (!required) {
    setStatus('等待玩家加入...');
    setForceStartState({ visible: false, enabled: false });
    return;
  }

  if (current < required) {
    setStatus(`已收到 ${current}/${required} 位玩家的策略，等待其他玩家...`);
    setForceStartState({ visible: true, enabled: !manualStartUsed });
    return;
  }

  if (!autoGeneratePending) {
    autoGeneratePending = true;
    setStatus('策略齐备，正在生成直播剧情...');
    setForceStartState({ visible: false, enabled: false });
    await tryGenerateLiveContent();
  }
}

async function submitDecisionSelection() {
  if (!currentDecisionPoint || !currentUser) return;
  clearDecisionTimer();
  const selectedId = decisionContainer.dataset.selectedOption;
  if (!selectedId) {
    alert('请选择一个策略');
    return;
  }
  const selectedOption = currentDecisionPoint.options?.find((opt) => opt.id === selectedId);
  if (!selectedOption) return;

  try {
    await setDoc(
      doc(db, 'sessions', livePayload.storyId, 'decisions', currentUser.uid),
      {
        decisionId: currentDecisionPoint.decision_id,
        characterId: currentDecisionPoint.character_id,
        prompt: currentDecisionPoint.prompt,
        selectedOption,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    appendBarrage(`你选择了：${selectedOption.text}`);
    decisionContainer.classList.add('hidden');
    recordDecisionHistory([{ ...currentDecisionPoint, selectedOption }]);
  } catch (error) {
    console.error('提交角色决策失败', error);
    alert('提交失败，请稍后再试');
  }
}

async function submitAudienceVote(optionId) {
  if (!currentEngagementPoint || !currentEngagementPoint.engagement_id || !currentUser) return;

  const voteDoc = doc(
    db,
    'sessions',
    livePayload.storyId,
    'engagements',
    currentEngagementPoint.engagement_id,
    'votes',
    currentUser.uid
  );

  try {
    await setDoc(voteDoc, {
      optionId,
      updatedAt: serverTimestamp()
    });
    appendBarrage(`你投票：${optionId}`);
  } catch (error) {
    console.error('提交投票失败', error);
    alert('投票失败，请稍后再试');
  }
}

function updatePollDisplay(votes = {}) {
  const yesVotes = votes.yes || 0;
  const noVotes = votes.no || 0;
  const total = yesVotes + noVotes;
  const yesPercent = total ? Math.round((yesVotes / total) * 100) : 50;
  const noPercent = 100 - yesPercent;

  updatePollBars(yesPercent, noPercent);
}

function subscribeToEngagementVotes(storyId, engagementId) {
  if (unsubscribeEngagementVotes) unsubscribeEngagementVotes();
  const votesRef = collection(db, 'sessions', storyId, 'engagements', engagementId, 'votes');
  unsubscribeEngagementVotes = onSnapshot(votesRef, (snapshot) => {
    const tally = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const option = data?.optionId;
      if (!option) return;
      tally[option] = (tally[option] || 0) + 1;
    });
    const yesId = currentEngagementOptions[0]?.id;
    const noId = currentEngagementOptions[1]?.id;
    updatePollDisplay({
      yes: yesId ? tally[yesId] || 0 : 0,
      no: noId ? tally[noId] || 0 : 0
    });
  });
}

function handlePollButtons() {
  [pollYesButton, pollNoButton].forEach((button) => {
    if (!button) return;
    button.addEventListener('click', () => {
      submitAudienceVote(button.dataset.option);
    });
  });
}

function handleForms() {
  if (barrageForm && barrageInput) {
    barrageForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = barrageInput.value.trim();
      if (!text) return;
      const sender = currentUser?.displayName || currentUser?.email || '匿名用户';
      appendBarrage(`${sender}：${text}`);
      barrageInput.value = '';
    });
  }
  if (decisionConfirm) {
    decisionConfirm.addEventListener('click', submitDecisionSelection);
  }
}

function resetStoryContext(storyId) {
  storyContext = createStoryContext(storyId);
}

function buildCharacterImageMap(storyData) {
  const map = {};
  storyData?.model_facing_content?.character_pool?.forEach((character) => {
    if (character.character_name && character.character_image) {
      map[character.character_name] = character.character_image;
    }
  });
  storyContext.characterImages = map;
}

function getCharacterImage(name) {
  if (!name) return DEFAULT_BACKGROUND;
  return storyContext.characterImages?.[name] || DEFAULT_BACKGROUND;
}

function updateStoryContextAfterPrompt(storyData) {
  if (!storyData) return;
  storyContext.modelFacingContent = JSON.stringify(storyData.model_facing_content || {}, null, 2);
  storyContext.characterSetup = JSON.stringify(storyData.user_facing_content?.character_setup || [], null, 2);
  storyContext.characterStates = JSON.stringify(storyData.model_facing_content?.character_pool || [], null, 2);
  buildCharacterImageMap(storyData);
}

function recordDecisionHistory(decisions) {
  storyContext.lastDecisions = decisions || [];
  storyContext.allDecisions.push(storyContext.lastDecisions);
}

function recordEngagementHistory(engagements) {
  storyContext.lastEngagements = engagements || [];
  storyContext.allEngagements.push(storyContext.lastEngagements);
}

function recordCharacterStates(states) {
  if (!states) return;
  storyContext.characterStates = JSON.stringify(states, null, 2);
}

function buildDecisionOutputForPrompt(isFirstRound) {
  const data = isFirstRound ? storyContext.allDecisions?.[0] || [] : storyContext.lastDecisions || [];
  return JSON.stringify(data || []);
}

function buildEngagementOutputForPrompt(isFirstRound) {
  if (isFirstRound) return '[]';
  return JSON.stringify(storyContext.lastEngagements || []);
}

async function ensureCharacterImages(storyId) {
  if (!storyId) return;
  if (Object.keys(storyContext.characterImages || {}).length) return;
  try {
    const snapshot = await getDoc(doc(db, 'characterpool', 'characterimages'));
    if (snapshot.exists()) {
      const data = snapshot.data() || {};
      Object.entries(data).forEach(([key, value]) => {
        if (value?.imageUrl && !storyContext.characterImages[key]) {
          storyContext.characterImages[key] = value.imageUrl;
        }
      });
    }
  } catch (error) {
    console.warn('读取角色立绘失败', error);
  }
}

function setForceStartState({ visible = true, enabled = true, label = '直接开始' } = {}) {
  if (!forceStartButton) return;
  forceStartButton.classList.toggle('hidden', !visible);
  forceStartButton.disabled = !enabled;
  forceStartButton.classList.toggle('opacity-50', !enabled);
  forceStartButton.classList.toggle('pointer-events-none', !enabled);
  forceStartButton.textContent = label;
}

const dialogueQueue = [];
let dialogueIsPlaying = false;
let dialogueAutoTimer = null;
let dialogueStepResolver = null;

function resetDialogueTimers() {
  if (dialogueAutoTimer) {
    clearTimeout(dialogueAutoTimer);
    dialogueAutoTimer = null;
  }
  dialogueStepResolver = null;
}

function startDialogueTimer(onTimeout) {
  resetDialogueTimers();
  dialogueAutoTimer = setTimeout(() => {
    onTimeout?.();
  }, DIALOGUE_AUTO_ADVANCE_MS);
}

function normalizeDialogues(block) {
  console.log('🔍 normalizeDialogues 输入 block:', JSON.stringify(block, null, 2));
  const result = [];

  const flattenText = (value) => {
    if (!value && value !== 0) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map((item) => flattenText(item)).join('\n');
    if (typeof value === 'object') {
      if (value.text !== undefined) return flattenText(value.text);
      if (value.content !== undefined) return flattenText(value.content);
      if (value.value !== undefined) return flattenText(value.value);
    }
    return '';
  };

  const pushLine = (speaker, text) => {
    const flattened = flattenText(text);
    const trimmed = flattened.trim();
    if (!trimmed) return;
    console.log(`  ➕ 添加台词: [${speaker || '旁白'}] ${trimmed.substring(0, 50)}...`);
    result.push({ speaker: speaker || '旁白', text: trimmed });
  };

  // 1. 尝试从 dialogues 字段提取
  const dialogues = block?.dialogues;
  if (Array.isArray(dialogues)) {
    console.log('  📋 发现 dialogues 数组，长度:', dialogues.length);
    dialogues.forEach((item, idx) => {
      console.log(`    [${idx}] 类型:`, typeof item, '内容:', item);
      if (item && typeof item === 'object' && Array.isArray(item.lines)) {
        item.lines.forEach((line) => {
          if (typeof line === 'string' || typeof line === 'number') pushLine(item.speaker, line);
          else if (line && typeof line === 'object') pushLine(line.speaker || item.speaker, line);
        });
      } else if (typeof item === 'string' || typeof item === 'number') {
        pushLine('旁白', item);
      } else if (item && typeof item === 'object') {
        pushLine(item.speaker, item.text || item.content || item);
      }
    });
  } else if (dialogues && typeof dialogues === 'object') {
    console.log('  📦 发现 dialogues 对象');
    Object.values(dialogues).forEach((value) => pushLine(value.speaker, value));
  }

  // 2. 尝试从其他字段提取
  ['narration', 'narrative', 'description', 'text', 'content'].forEach((key) => {
    const value = block?.[key];
    if (value !== undefined && value !== null && value !== '') {
      console.log(`  📝 发现 ${key} 字段:`, value);
      pushLine('旁白', value);
    }
  });

  // 3. 最后尝试 dialogue 单数形式
  if (!result.length && block?.dialogue) {
    console.log('  💬 发现 dialogue 字段:', block.dialogue);
    pushLine(block.dialogue.speaker, block.dialogue);
  }

  console.log(`🔍 normalizeDialogues 输出: ${result.length} 条台词`);
  return result;
}

function renderDialogueBlock(block) {
  return new Promise((resolve) => {
    console.log('🎭 renderDialogueBlock 收到 block:', block);
    const dialogues = normalizeDialogues(block);
    console.log('🎭 normalizeDialogues 提取到台词:', dialogues);

    if (!dialogues.length) {
      console.warn('⚠️ 该片段没有台词，跳过');
      resolve();
      return;
    }

    const queueItem = {
      dialogues,
      resolve
    };

    dialogueQueue.push(queueItem);
    console.log('📝 已加入队列，当前队列长度:', dialogueQueue.length);

    if (!dialogueIsPlaying) {
      console.log('▶️ 开始播放台词');
      playNextDialogue();
    }
  });
}

async function playNextDialogue() {
  if (dialogueIsPlaying) {
    console.log('⏸️ 正在播放中，跳过');
    return;
  }
  const next = dialogueQueue.shift();
  if (!next) {
    console.log('✅ 队列为空，播放结束');
    return;
  }

  dialogueIsPlaying = true;
  const { dialogues, resolve } = next;
  console.log('🎬 开始播放一组台词，共', dialogues.length, '句');

  if (!dialoguePlayer) {
    console.error('❌ dialoguePlayer 元素未找到！');
    resolve();
    dialogueIsPlaying = false;
    playNextDialogue();
    return;
  }

  // 设置字幕面板样式
  const videoContainer = document.getElementById('live-video-container');
  const overlay = document.getElementById('live-dialogue-overlay');

  if (videoContainer) {
    videoContainer.style.setProperty('position', 'relative', 'important');
  }

  if (overlay) {
    overlay.style.setProperty('position', 'absolute', 'important');
    overlay.style.setProperty('bottom', '0', 'important');
    overlay.style.setProperty('left', '0', 'important');
    overlay.style.setProperty('right', '0', 'important');
    overlay.style.setProperty('width', '100%', 'important');
    overlay.style.setProperty('height', '88px', 'important');
    overlay.style.setProperty('z-index', '50', 'important');
    overlay.style.setProperty('pointer-events', 'none', 'important');
  }

  // 字幕面板样式
  dialoguePlayer.style.cssText = `
    display: flex !important;
    flex-direction: column !important;
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    height: 88px !important;
    background: rgba(0, 0, 0, 0.85) !important;
    backdrop-filter: blur(8px) !important;
    border-radius: 0 !important;
    padding: 8px 14px !important;
    z-index: 51 !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
    margin: 0 !important;
    overflow: hidden !important;
  `;

  for (let index = 0; index < dialogues.length; index += 1) {
    const dialogue = dialogues[index];
    if (!dialogue?.text) {
      console.warn('⚠️ 跳过空台词:', dialogue);
      continue;
    }

    console.log(`💬 [${index + 1}/${dialogues.length}] ${dialogue.speaker}: ${dialogue.text.substring(0, 30)}...`);

    await new Promise((stepResolve) => {
      dialogueStepResolver = null;
      startDialogueTimer(() => {
        if (dialogueStepResolver) {
          const resolver = dialogueStepResolver;
          dialogueStepResolver = null;
          resetDialogueTimers();
          resolver();
        }
      });

      // 设置说话人
      if (dialogueSpeaker) {
        dialogueSpeaker.textContent = dialogue.speaker || '旁白';
        dialogueSpeaker.style.cssText = `
          display: block !important;
          font-size: 9px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: rgba(255, 255, 255, 0.6) !important;
          margin-bottom: 4px !important;
        `;
      }

      // 设置台词文本
      if (dialogueText) {
        const wrapper = document.getElementById('live-dialogue-text-wrapper');
        if (wrapper) {
          wrapper.scrollTop = 0;
          wrapper.style.cssText = `
            flex: 1 !important;
            overflow-y: auto !important;
            padding-right: 4px !important;
            max-height: 64px !important;
          `;
        }
        dialogueText.textContent = dialogue.text;
        dialogueText.style.cssText = `
          display: block !important;
          font-size: 11px !important;
          line-height: 1.5 !important;
          color: rgba(255, 255, 255, 0.95) !important;
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          text-align: left !important;
        `;
      }

      // 记录到历史
      if (dialoguesContainer) {
        const transcriptItem = document.createElement('p');
        transcriptItem.className = 'text-xs text-white/50';
        transcriptItem.textContent = `${dialogue.speaker || '旁白'}：${dialogue.text}`;
        dialoguesContainer.appendChild(transcriptItem);
      }

      dialogueStepResolver = stepResolve;
    });
  }

  resetDialogueTimers();

  // 继续播放下一个队列，不要隐藏面板（由外层控制）
  dialogueIsPlaying = false;
  resolve();

  // 如果队列中还有内容，继续播放
  if (dialogueQueue.length > 0) {
    console.log('📋 队列中还有', dialogueQueue.length, '组台词，继续播放');
    playNextDialogue();
  } else {
    console.log('✅ 当前队列播放完毕，等待下一个 block');
  }
}

if (dialogueNextButton) {
  dialogueNextButton.disabled = true;
}

function updateProgressDisplay(current, total) {
  if (!progressStep || !progressBar) return;
  progressStep.textContent = `段落 ${current}/${total}`;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  progressBar.style.width = `${percentage}%`;
}

(document.addEventListener('DOMContentLoaded', () => {
  populateStoryInfo();

  if (statusCard) {
    setStatus('正在等待所有玩家进入直播舞台并完成选择...');
  }

  if (forceStartButton) {
    forceStartButton.classList.remove('hidden');
    forceStartButton.disabled = false;
    forceStartButton.addEventListener('click', async () => {
      console.log('force start clicked', { disabled: forceStartButton.disabled, manualStartUsed, livePayload });
      if (!livePayload || forceStartButton.disabled) return;
      manualStartUsed = true;
      forceStartButton.disabled = true;
      forceStartButton.classList.add('opacity-50', 'pointer-events-none');
      setStatus('主持人发话，立即进入直播！');
      try {
        await forceFillDecisions();
        await tryGenerateLiveContent();
      } catch (error) {
        console.error('直接开始触发失败', error);
        forceStartButton.disabled = false;
        forceStartButton.classList.remove('opacity-50', 'pointer-events-none');
      }
    });
  }

  handleForms();
  handlePollButtons();

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    const loginHint = document.getElementById('live-login-hint');
    if (user && livePayload?.storyId) {
      if (loginHint) loginHint.remove();
      subscribeToDecisions(livePayload.storyId);
      if (currentEngagementId) subscribeToEngagementVotes(livePayload.storyId, currentEngagementId);
      await evaluateDecisionsReady();
    } else if (!user) {
      setStatus('请登录以继续体验直播。');
      if (!loginHint) {
        const hintWrapper = document.createElement('div');
        hintWrapper.id = 'live-login-hint';
        hintWrapper.className = 'mt-3 space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70';
        hintWrapper.innerHTML = `
          <p>你当前尚未登录，登录后才能观看直播剧情。</p>
          <a href='../script/index.html' class='inline-flex items-center justify-center rounded-full bg-[#ffcc00] px-4 py-2 text-sm font-semibold text-black shadow hover:bg-[#ffd633]'>前往剧本页登录</a>
        `;
        statusCard?.insertAdjacentElement('afterend', hintWrapper);
      }
    }
  });

  const chartContainer = document.getElementById('live-poll-chart');
  if (chartContainer && typeof echarts !== 'undefined') {
    const chart = echarts.init(chartContainer);
    chart.setOption({
      color: ['#3300ff', '#ff3366'],
      grid: { left: 20, right: 20, top: 20, bottom: 10 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'value',
        max: 100,
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#cbd5f5' }
      },
      yAxis: {
        type: 'category',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#f8fafc', fontSize: 13, fontWeight: 600 },
        data: ['会', '不会']
      },
      series: [
        {
          name: '投票占比',
          type: 'bar',
          barWidth: 20,
          data: [pollTotals.yes, pollTotals.no],
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#fff',
            fontWeight: 600
          },
          itemStyle: {
            borderRadius: [12, 12, 12, 12],
            shadowBlur: 12,
            shadowColor: 'rgba(51, 0, 255, 0.35)'
          }
        }
      ]
    });
    window.addEventListener('resize', () => chart.resize());
  }
}));

window.addEventListener('beforeunload', () => {
  clearDecisionTimer();
  resetDialogueTimers();
});

(async function restorePollSubscription() {
  if (livePayload?.storyId && currentEngagementId) {
    subscribeToEngagementVotes(livePayload.storyId, currentEngagementId);
  }
})();

