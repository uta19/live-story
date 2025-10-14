import '../../assets/app.js';
import { getFirebaseApp } from '../../assets/firebase.js';
import { initAuthUI, requireAuth, fetchUserProfile } from '../../assets/auth.js';
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let loginButton;
const userAvatarImg = document.getElementById('script-user-avatar');
const stageAvatarImg = document.getElementById('script-stage-avatar');
const filterBar = document.getElementById('script-filters');
const quickCard = document.getElementById('script-quick-card');
const detailPanel = document.getElementById('script-detail');
const detailClose = document.getElementById('detail-close');
const detailStoryTitle = document.getElementById('detail-story-title');
const detailStorySynopsis = document.getElementById('detail-story-synopsis');
const detailCharacterName = document.getElementById('detail-character-name');
const detailCharacterPublic = document.getElementById('detail-character-public');
const detailCharacterRelationships = document.getElementById('detail-character-relationships');
const detailCharacterSecret = document.getElementById('detail-character-secret');
const detailChoiceContext = document.getElementById('detail-choice-context');
const detailChoicePrompt = document.getElementById('detail-choice-prompt');
const detailOptions = document.getElementById('detail-options');
const detailResponse = document.getElementById('detail-response');
const detailConfirm = document.getElementById('detail-confirm');

let currentScripts = [];
let currentStory = null;
let currentCharacter = null;
let currentChoice = null;
let selectedOptionId = null;
let currentUser = null;

function setUserAvatar(url) {
  if (!userAvatarImg) return;
  userAvatarImg.src = url || 'https://via.placeholder.com/48x48?text=Avatar';
}

function setStageAvatar(url) {
  if (!stageAvatarImg) return;
  stageAvatarImg.src = url || '/api/proxy-image?url=https%3A%2F%2Fwww.figma.com%2Fapi%2Fmcp%2Fasset%2F1a013bd4-eeb6-498c-a688-a3f811a10e88';
}

function showMatchedState() {
  filterBar?.classList.add('hidden');
  quickCard?.classList.add('hidden');
  detailPanel?.classList.remove('hidden');
}

function resetMatchedState() {
  filterBar?.classList.remove('hidden');
  quickCard?.classList.remove('hidden');
  if (detailPanel) {
    detailPanel.classList.add('hidden');
  }
  currentStory = null;
  currentCharacter = null;
  currentChoice = null;
  selectedOptionId = null;
  if (detailOptions) detailOptions.innerHTML = '';
  if (detailResponse) detailResponse.value = '';
}

function normalizeStory(raw, fallbackId) {
  if (!raw) raw = {};
  const story = {
    id: fallbackId || raw.id || raw.display_fields?.Storyname || '未命名剧本',
    Storyname:
      raw.display_fields?.Storyname ||
      raw.Storyname ||
      raw.storyName ||
      fallbackId ||
      '未命名剧本',
    Storyimage:
      raw.display_fields?.Storyimage ||
      raw.Storyimage ||
      raw.storyImage ||
      raw.story_image ||
      '',
    synopsis: raw.display_fields?.synopsis || raw.synopsis || '',
    character_pool: raw.model_facing_content?.character_pool || [],
    opening_choices: raw.user_facing_content?.opening_choices || []
  };
  return story;
}

function normalizeRecord(raw, fallbackId) {
  if (!raw) raw = {};
  const source = raw.display_fields || raw.story || raw;
  return normalizeStory({ ...raw, display_fields: source }, fallbackId);
}

async function tryFetchCollection(db, pathSegments, retries = 3) {
  console.debug('尝试读取集合路径:', pathSegments.join('/'));

  for (let i = 0; i < retries; i++) {
    try {
      const snapshot = await getDocs(collection(db, ...pathSegments));
      const items = snapshot.docs
        .map((documentSnapshot) => normalizeRecord(documentSnapshot.data(), documentSnapshot.id))
        .filter(Boolean);
      console.debug('集合返回文档数:', items.length);
      if (items.length) {
        // 缓存数据到 localStorage
        try {
          localStorage.setItem('aiko-cached-scripts', JSON.stringify(items));
          localStorage.setItem('aiko-cached-scripts-time', Date.now().toString());
        } catch (e) {
          console.warn('无法缓存数据', e);
        }
        return items;
      }
    } catch (error) {
      console.warn(`读取集合失败 (尝试 ${i + 1}/${retries})`, pathSegments.join('/'), error);

      // 如果是最后一次尝试，抛出错误
      if (i === retries - 1) {
        throw error;
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  return [];
}

async function loadScriptsFromFirestore(db) {
  const paths = [
    ['script'],
    ['livestory', 'script', 'display_fields'],
    ['livestory', 'script', 'stories'],
    ['livestory']
  ];

  let lastError = null;

  for (const segments of paths) {
    try {
      const items = await tryFetchCollection(db, segments);
      if (items.length) {
        console.info('命中集合路径:', segments.join('/'), '文档数量:', items.length);
        return items;
      }
    } catch (error) {
      console.warn('路径读取失败:', segments.join('/'), error);
      lastError = error;
      // 继续尝试下一个路径
    }
  }

  // 如果所有路径都失败，抛出最后一个错误
  if (lastError) {
    throw lastError;
  }

  return [];
}

function renderScriptsList(scripts) {
  const list = document.getElementById('script-list');
  if (!list) return;
  list.innerHTML = '';
  scripts.forEach((story) => {
    const card = document.createElement('button');
    card.className = 'group relative overflow-hidden rounded-3xl text-left transition hover:scale-[1.02] hover:ring-2 hover:ring-white/30';
    card.innerHTML = `
      <img src="${story.Storyimage || 'https://via.placeholder.com/300x180?text=Story'}" alt="${story.Storyname}" class="h-[180px] w-full object-cover" loading="lazy" />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      <div class="absolute inset-x-4 bottom-4 space-y-2 text-sm">
        <p class="text-lg font-semibold">${story.Storyname}</p>
        <p class="text-xs text-white/70 line-clamp-2">${story.synopsis || ''}</p>
      </div>
    `;
    card.addEventListener('click', () => handleSelectStory(story));
    list.appendChild(card);
  });
}

function chooseRandomCharacter(story) {
  if (!story?.character_pool?.length) return null;
  const pool = story.character_pool;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function findChoiceForCharacter(story, characterName) {
  if (!story?.opening_choices?.length) return null;
  return (
    story.opening_choices.find(
      (choice) => choice.character_id === characterName || choice.character_name === characterName
    ) || null
  );
}

function renderDetail(story, character, choice) {
  if (!detailPanel) return;
  currentStory = story;
  currentCharacter = character;
  currentChoice = choice;
  selectedOptionId = null;
  detailOptions.innerHTML = '';
  detailResponse.value = '';

  detailStoryTitle.textContent = story?.Storyname || '';
  detailStorySynopsis.textContent = story?.synopsis || '';

  if (character) {
    detailCharacterName.textContent = character.character_name || '';
    detailCharacterPublic.textContent = character.public_identity
      ? `公开身份：${character.public_identity}`
      : character.description
        ? `角色设定：${character.description}`
        : '';
    detailCharacterRelationships.textContent = character.initial_relationships
      ? `关系网络：${character.initial_relationships}`
      : '';
    detailCharacterSecret.textContent = character.secret_objective
      ? `秘密目标：${character.secret_objective}`
      : character.objective
        ? `目标：${character.objective}`
        : '';
  } else {
    detailCharacterName.textContent = '';
    detailCharacterPublic.textContent = '';
    detailCharacterRelationships.textContent = '';
    detailCharacterSecret.textContent = '';
  }

  if (choice) {
    detailChoiceContext.textContent = choice.context || '';
    detailChoicePrompt.textContent = choice.prompt || '';
    if (Array.isArray(choice.options)) {
      choice.options.forEach((option) => {
        const optionId = option.id || option.strategy || '';
        const optionButton = document.createElement('button');
        optionButton.className = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10';
        optionButton.dataset.optionId = optionId;
        optionButton.innerHTML = `<p class="font-semibold text-white">${option.strategy || ''}</p><p class="mt-1 text-xs text-white/70">${option.text || ''}</p>`;
        optionButton.addEventListener('click', () => {
          selectedOptionId = optionId;
          Array.from(detailOptions.children).forEach((child) => child.classList.remove('ring-2', 'ring-[#ffcc00]'));
          optionButton.classList.add('ring-2', 'ring-[#ffcc00]');
        });
        detailOptions.appendChild(optionButton);
      });
    }
  } else {
    detailChoiceContext.textContent = '';
    detailChoicePrompt.textContent = '';
  }

  showMatchedState();
}

function handleSelectStory(story) {
  const character = chooseRandomCharacter(story);
  const choice = character ? findChoiceForCharacter(story, character.character_name) : null;
  renderDetail(story, character, choice);
}

async function saveDecisionToFirestore(payload, user) {
  if (!user) throw new Error('用户未登录');
  const db = getFirestore(getFirebaseApp());
  const decisionRef = doc(db, 'sessions', payload.storyId, 'decisions', user.uid);
  await setDoc(
    decisionRef,
    {
      ...payload,
      userId: user.uid,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function fetchScripts() {
  const list = document.getElementById('script-list');
  if (!list) return;

  resetMatchedState();
  list.innerHTML = '<p class="col-span-2 text-center text-sm text-white/60">正在加载剧本...</p>';

  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const scripts = await loadScriptsFromFirestore(db);
    currentScripts = scripts;
    console.debug('最终脚本数量:', scripts.length);

    if (!scripts.length) {
      list.innerHTML = '<p class="col-span-2 text-center text-sm text-white/60">暂时没有剧本数据</p>';
      return;
    }

    renderScriptsList(scripts);
  } catch (error) {
    console.error('加载剧本数据失败:', error);

    // 尝试从缓存加载
    const cachedScripts = loadCachedScripts();
    if (cachedScripts && cachedScripts.length > 0) {
      console.info('使用缓存数据，共', cachedScripts.length, '个剧本');
      currentScripts = cachedScripts;
      renderScriptsList(cachedScripts);

      // 显示离线提示
      const offlineWarning = document.createElement('div');
      offlineWarning.className = 'col-span-2 mb-4 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 px-4 py-3 text-center text-sm text-yellow-200';
      offlineWarning.innerHTML = `
        <p class="font-semibold">🔌 当前处于离线模式</p>
        <p class="mt-1 text-xs text-yellow-200/80">显示的是缓存数据，请检查网络连接后点击刷新按钮</p>
      `;
      list.insertBefore(offlineWarning, list.firstChild);
    } else {
      list.innerHTML = `
        <div class="col-span-2 flex flex-col items-center justify-center gap-4 py-12">
          <div class="text-center">
            <p class="text-lg font-semibold text-red-400">⚠️ 连接失败</p>
            <p class="mt-2 text-sm text-white/60">无法连接到服务器，请检查网络连接</p>
            <p class="mt-1 text-xs text-white/40">${error.message || '未知错误'}</p>
          </div>
          <button 
            class="rounded-full bg-white/20 px-6 py-2 text-sm font-medium text-white hover:bg-white/30 transition" 
            onclick="window.location.reload()"
          >
            重新加载
          </button>
        </div>
      `;
    }
  }
}

function loadCachedScripts() {
  try {
    const cached = localStorage.getItem('aiko-cached-scripts');
    const cacheTime = localStorage.getItem('aiko-cached-scripts-time');

    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      if (age < maxAge) {
        return JSON.parse(cached);
      } else {
        console.info('缓存已过期');
      }
    }
  } catch (e) {
    console.warn('读取缓存失败', e);
  }
  return null;
}

function goToLivePage() {
  window.location.href = '../live/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  loginButton = document.getElementById('script-login');
  const logoutButton = document.getElementById('script-logout');
  const reloadButton = document.getElementById('script-reload');
  const userInfo = document.getElementById('script-user-info');

  if (reloadButton) reloadButton.disabled = true;

  initAuthUI({
    loginButton,
    logoutButton,
    userInfoContainer: userInfo
  });

  requireAuth(async (user) => {
    currentUser = user;
    if (reloadButton) reloadButton.disabled = !user;

    if (user) {
      setUserAvatar(user.photoURL);
      try {
        const profile = await fetchUserProfile(user.uid);
        if (profile?.avatarProfile) {
          setStageAvatar(profile.avatarProfile);
        }
      } catch (error) {
        console.warn('加载用户 profile 失败', error);
      }
      fetchScripts();
    } else {
      const list = document.getElementById('script-list');
      setUserAvatar(null);
      setStageAvatar(null);
      resetMatchedState();
      if (list) {
        list.innerHTML = `
          <div class="col-span-2 flex flex-col items-center justify-center gap-3 py-12 text-center text-sm text-white/60">
            <p>请先登录以查看剧本</p>
            <button class="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30" id="script-login-inline">马上登录</button>
          </div>
        `;
        const inlineButton = document.getElementById('script-login-inline');
        if (inlineButton && loginButton) {
          inlineButton.addEventListener('click', () => loginButton.click());
        }
      }
    }
  });

  if (reloadButton) {
    reloadButton.addEventListener('click', fetchScripts);
  }

  if (detailConfirm) {
    detailConfirm.addEventListener('click', async () => {
      if (!currentStory || !currentCharacter) {
        alert('请选择一个剧本');
        return;
      }
      if (currentChoice?.options?.length && !selectedOptionId) {
        alert('请选择一个策略');
        return;
      }
      if (!currentUser) {
        alert('请先登录');
        return;
      }
      const chosenOption = currentChoice?.options?.find((opt) => (opt.id || opt.strategy) === selectedOptionId);
      const payload = {
        storyId: currentStory.id,
        storyName: currentStory.Storyname,
        storyImage: currentStory.Storyimage || '',
        characterId: currentCharacter.character_name,
        characterName: currentCharacter.character_name,
        publicIdentity: currentCharacter.public_identity || currentCharacter.description || '',
        secretObjective: currentCharacter.secret_objective || currentCharacter.objective || '',
        initialRelationships: currentCharacter.initial_relationships || '',
        prompt: currentChoice?.prompt || '',
        context: currentChoice?.context || '',
        options: currentChoice?.options || [],
        selectedOption: chosenOption
          ? {
            id: chosenOption.id || selectedOptionId || '',
            strategy: chosenOption.strategy || '',
            text: chosenOption.text || ''
          }
          : null,
        selectedOptionId: selectedOptionId || '',
        selectedOptionStrategy: chosenOption?.strategy || '',
        selectedOptionText: chosenOption?.text || '',
        responseText: detailResponse.value.trim()
      };
      payload.choicePrompt = payload.prompt;
      payload.choiceContext = payload.context;
      payload.optionStrategy = payload.selectedOptionStrategy;
      payload.optionText = payload.selectedOptionText;
      try {
        await saveDecisionToFirestore(payload, currentUser);
        window.localStorage.setItem('aiko-selected-story', JSON.stringify(payload));
      } catch (error) {
        console.error('保存策略失败', error);
        alert('保存策略失败，请稍后再试');
        return;
      }
      goToLivePage();
    });
  }

  if (detailClose) {
    detailClose.addEventListener('click', () => {
      resetMatchedState();
    });
  }
});
