/* Matikkapelit — Shared UI Utilities (Mute toggle, 2-step exit modal, PWA SW) */
window.MatikkaUI = (() => {
  const ICON_SOUND_ON = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"></polygon>
      <path d="M15.5 8.5a5 5 0 0 1 0 7"></path>
      <path d="M18.8 5.8a9 9 0 0 1 0 12.4"></path>
    </svg>`;

  const ICON_SOUND_OFF = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"></polygon>
      <line x1="22" y1="9" x2="16" y2="15"></line>
      <line x1="16" y1="9" x2="22" y2="15"></line>
    </svg>`;

  const ICON_CLOSE = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;

  const ICON_HOME = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5"></path>
      <path d="M5.5 9.5V20h13V9.5"></path>
    </svg>`;

  function registerSW(swPath = './sw.js') {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(swPath).catch(() => {});
      });
    }
  }

  function wireMuteButton(btn) {
    if (!btn || !window.MatikkaAudio) return;
    const render = () => {
      const isMuted = window.MatikkaAudio.isMuted();
      btn.innerHTML = isMuted ? ICON_SOUND_OFF : ICON_SOUND_ON;
      btn.classList.toggle('muted', isMuted);
      btn.setAttribute('aria-pressed', String(isMuted));
      btn.setAttribute('aria-label', isMuted ? 'Äänet pois' : 'Äänet päällä');
    };
    render();
    btn.addEventListener('click', () => {
      window.MatikkaAudio.setMuted(!window.MatikkaAudio.isMuted());
      render();
      if (!window.MatikkaAudio.isMuted()) {
        window.MatikkaAudio.playTap();
      }
    });
    return render;
  }

  function wireExitModal({
    triggerBtn,
    modal,
    step1,
    step2,
    cancelBtn,
    toStep2Btn,
    backBtn,
    confirmRestartBtn,
    onRestart
  }) {
    if (!triggerBtn || !modal) return;
    triggerBtn.innerHTML = ICON_CLOSE;

    const open = () => {
      step1.classList.remove('hidden');
      step2.classList.add('hidden');
      modal.classList.remove('hidden');
    };

    const close = () => {
      modal.classList.add('hidden');
    };

    triggerBtn.addEventListener('click', open);
    cancelBtn.addEventListener('click', close);
    toStep2Btn.addEventListener('click', () => {
      step1.classList.add('hidden');
      step2.classList.remove('hidden');
    });
    backBtn.addEventListener('click', () => {
      step2.classList.add('hidden');
      step1.classList.remove('hidden');
    });
    confirmRestartBtn.addEventListener('click', () => {
      close();
      if (typeof onRestart === 'function') onRestart();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    return { open, close };
  }

  return {
    ICON_HOME,
    ICON_CLOSE,
    registerSW,
    wireMuteButton,
    wireExitModal
  };
})();
