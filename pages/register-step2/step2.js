document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role') ?? '你的伙伴';

  const roleHint = document.getElementById('roleHint');
  const talentOptions = document.getElementById('talentOptions');
  const talentResult = document.getElementById('talentResult');
  const talentNameOutput = document.getElementById('talentName');
  const talentDescOutput = document.getElementById('talentDescription');
  const confirmBtn = document.getElementById('confirmTalentBtn');
  const rerollBtn = document.getElementById('rerollBtn');
  const customSection = document.getElementById('customSection');
  const customInput = document.getElementById('customTalent');
  const applyCustomBtn = document.getElementById('applyCustomBtn');

  let selectedCard = null;
  let selectedTalent = null;
  let selectedDesc = '';
  let revealed = false;

  const choices = [
    {
      title: '燃烧自己照亮一切',
      talent: '雷霆术',
      desc: '无论代价，TA 都会化身光芒守护一切。',
    },
    {
      title: '融入阴影静待时机',
      talent: '隐匿术',
      desc: 'TA 擅长潜伏与静待，在暗处寻找破局。',
    },
    {
      title: '预知未来规避风险',
      talent: '读心术',
      desc: '冷静分析未来可能，选择最安全的路径。',
    },
  ];

  if (roleHint) {
    roleHint.textContent = `TA 与你之间的羁绊类型：${role}`;
  }

  if (talentOptions && talentOptions.childElementCount === 0) {
    choices.forEach((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'talent-card';
      button.dataset.talent = choice.talent;
      button.dataset.desc = choice.desc;
      button.innerHTML = `
        <div>
          <p class="text-lg font-semibold text-white">${choice.title}</p>
          <p class="mt-2 text-sm text-white/60">${choice.desc}</p>
        </div>
      `;
      talentOptions.appendChild(button);
    });
  }

  const getCards = () => Array.from(talentOptions?.querySelectorAll('.talent-card') ?? []);

  talentOptions?.addEventListener('click', (event) => {
    if (revealed) return;
    const card = event.target.closest('.talent-card');
    if (!card || !talentOptions.contains(card)) return;
    selectCard(card);
  });

  confirmBtn?.addEventListener('click', () => {
    if (!selectedCard) return;

    if (!revealed) {
      revealTalent(
        selectedCard.dataset.talent ?? '未知天赋',
        selectedCard.dataset.desc ?? '',
        selectedCard
      );
      return;
    }

    goToStepThree(role, selectedTalent, selectedDesc);
  });

  rerollBtn?.addEventListener('click', () => {
    if (!revealed) return;
    const cards = getCards();
    if (cards.length === 0) return;
    const random = cards[Math.floor(Math.random() * cards.length)];
    revealTalent(random.dataset.talent ?? '神秘天赋', random.dataset.desc ?? '', random);
  });

  applyCustomBtn?.addEventListener('click', () => {
    if (!revealed) return;
    const value = customInput?.value?.trim();
    if (!value) return;
    revealTalent(value, '你亲自赋予 TA 的独特异能。');
  });

  function selectCard(card) {
    selectedCard = card;
    const cards = getCards();
    cards.forEach((item) => item.classList.remove('is-active'));
    card.classList.add('is-active');
    confirmBtn?.removeAttribute('disabled');
  }

  function revealTalent(name, desc, card) {
    selectedTalent = name;
    selectedDesc = desc ?? '';
    if (card) {
      selectCard(card);
    }
    updateResult();
    rerollBtn?.classList.remove('hidden');
    customSection?.classList.remove('hidden');
    if (confirmBtn) {
      confirmBtn.textContent = '继续';
      confirmBtn.classList.add('bg-emerald-500', 'hover:bg-emerald-400');
    }
    revealed = true;
  }

  function updateResult() {
    if (!talentResult || !talentNameOutput || !talentDescOutput) return;
    talentResult.hidden = false;
    talentNameOutput.textContent = selectedTalent ?? '';
    talentDescOutput.textContent = selectedDesc ?? '';
  }

  function goToStepThree(roleValue, talentValue, descValue) {
    if (!talentValue) return;
    const url = new URL('../register-step3/index.html', window.location.href);
    url.searchParams.set('role', roleValue);
    url.searchParams.set('talent', talentValue);
    url.searchParams.set('talentDesc', descValue ?? '');
    window.location.href = url.toString();
  }
});

