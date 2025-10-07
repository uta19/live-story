document.addEventListener('DOMContentLoaded', () => {
  const optionContainer = document.getElementById('identityOptions');
  const nextBtn = document.getElementById('nextStepBtn');
  let selectedRole = null;

  optionContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-role]');
    if (!button) return;

    selectedRole = button.dataset.role;
    highlightSelection(button, optionContainer);
    nextBtn?.removeAttribute('disabled');
  });

  nextBtn?.addEventListener('click', () => {
    if (!selectedRole) return;
    const url = new URL('../register-step2/index.html', window.location.href);
    url.searchParams.set('role', selectedRole);
    window.location.href = url.toString();
  });
});

function highlightSelection(activeBtn, container) {
  const buttons = container?.querySelectorAll('button[data-role]') ?? [];
  buttons.forEach((btn) => {
    btn.classList.remove('border-indigo-400', 'bg-indigo-500/20');
  });
  activeBtn.classList.add('border-indigo-400', 'bg-indigo-500/20');
}
