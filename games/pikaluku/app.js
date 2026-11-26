/* Pikaluku (Flash Subitizer) — Game Engine */
(() => {
  const { MatikkaAudio, MatikkaUI, MatikkaScheduler, MatikkaQuantities } = window;

  MatikkaUI.registerSW('../../sw.js');

  /* ========================================================================
     CONFIG OPTIONS
     ======================================================================== */
  const RANGES = [
    { id: '1-5', label: '1–5', min: 1, max: 5 },
    { id: '1-10', label: '1–10', min: 1, max: 10 },
    { id: '5-10', label: '5–10', min: 5, max: 10 }
  ];

  const FORMATS = [
    { id: 'mixed', label: 'Sekaisin' },
    { id: 'dots-prog', label: 'Pisteet' },
    { id: 'tenframe', label: 'Kymppiruudukko' },
    { id: 'fingers', label: 'Sormet' },
    { id: 'dice', label: 'Nopat' }
  ];

  const SPEEDS = [
    { id: 'slow', label: '2,0 s', ms: 2000 },
    { id: 'normal', label: '1,5 s', ms: 1500 },
    { id: 'fast', label: '1,0 s', ms: 1000 }
  ];

  const MODES = [
    { id: 'player', label: 'Pelaaja' },
    { id: 'teacher', label: 'Taulu' }
  ];

  const LENGTHS = [8, 10, 12];

  const config = {
    rangeId: '1-10',
    formatId: 'mixed',
    speedId: 'normal',
    modeId: 'player',
    roundLength: 10
  };

  /* ========================================================================
     DOM ELEMENTS
     ======================================================================== */
  const el = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    setupHome: document.getElementById('btn-setup-home'),
    setupMute: document.getElementById('btn-setup-mute'),
    setupRange: document.getElementById('setup-range'),
    setupFormat: document.getElementById('setup-format'),
    setupSpeed: document.getElementById('setup-speed'),
    setupMode: document.getElementById('setup-mode'),
    setupLength: document.getElementById('setup-length'),
    btnStart: document.getElementById('btn-start'),

    progressDots: document.getElementById('progress-dots'),
    btnPeek: document.getElementById('btn-peek'),
    btnMute: document.getElementById('btn-mute'),
    btnExit: document.getElementById('btn-exit'),

    stageCard: document.getElementById('stage-card'),
    stimulusLayer: document.getElementById('stimulus-layer'),
    revealBadge: document.getElementById('reveal-badge'),
    flashBar: document.getElementById('flash-bar'),
    flashBarFill: document.getElementById('flash-bar-fill'),
    curtain: document.getElementById('curtain'),
    btnCurtainLook: document.getElementById('btn-curtain-look'),
    curtainQuestion: document.getElementById('curtain-question'),

    answerDock: document.querySelector('.answer-dock'),
    keypad: document.getElementById('keypad'),
    nextBar: document.getElementById('next-bar'),
    btnNext: document.getElementById('btn-next'),
    teacherBar: document.getElementById('teacher-bar'),
    btnGmPeek: document.getElementById('btn-gm-peek'),
    btnGmReveal: document.getElementById('btn-gm-reveal'),
    btnGmNext: document.getElementById('btn-gm-next'),

    exitModal: document.getElementById('exit-modal'),
    exitStep1: document.getElementById('exit-step-1'),
    exitStep2: document.getElementById('exit-step-2'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    btnModalStep2: document.getElementById('btn-modal-step2'),
    btnModalBack: document.getElementById('btn-modal-back'),
    btnModalConfirm: document.getElementById('btn-modal-confirm'),

    endScreen: document.getElementById('end-screen'),
    endLine: document.getElementById('end-line'),
    btnEndAgain: document.getElementById('btn-end-again')
  };

  /* ========================================================================
     SHARED SHELL WIRING
     ======================================================================== */
  el.setupHome.innerHTML = MatikkaUI.ICON_HOME;
  const syncSetupMute = MatikkaUI.wireMuteButton(el.setupMute);
  const syncGameMute = MatikkaUI.wireMuteButton(el.btnMute);

  MatikkaUI.wireExitModal({
    triggerBtn: el.btnExit,
    modal: el.exitModal,
    step1: el.exitStep1,
    step2: el.exitStep2,
    cancelBtn: el.btnModalCancel,
    toStep2Btn: el.btnModalStep2,
    backBtn: el.btnModalBack,
    confirmRestartBtn: el.btnModalConfirm,
    onRestart: returnToSetup
  });

  /* ========================================================================
     SETUP SCREEN RENDERING
     ======================================================================== */
  function renderSegGroup(container, options, currentVal, onPick) {
    container.innerHTML = options.map(opt => {
      const val = typeof opt === 'object' ? opt.id : opt;
      const label = typeof opt === 'object' ? opt.label : String(opt);
      const active = val === currentVal ? ' active' : '';
      return `<button type="button" class="seg-btn${active}" data-val="${val}">${label}</button>`;
    }).join('');

    container.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        MatikkaAudio.unlock();
        MatikkaAudio.playTap();
        const raw = btn.dataset.val;
        const parsed = typeof currentVal === 'number' ? Number(raw) : raw;
        onPick(parsed);
        renderSetup();
      });
    });
  }

  function renderSetup() {
    renderSegGroup(el.setupRange, RANGES, config.rangeId, v => { config.rangeId = v; });
    renderSegGroup(el.setupFormat, FORMATS, config.formatId, v => { config.formatId = v; });
    renderSegGroup(el.setupSpeed, SPEEDS, config.speedId, v => { config.speedId = v; });
    renderSegGroup(el.setupMode, MODES, config.modeId, v => { config.modeId = v; });
    renderSegGroup(el.setupLength, LENGTHS, config.roundLength, v => { config.roundLength = v; });
  }

  /* ========================================================================
     GAME STATE
     ======================================================================== */
  let session = null;
  let phase = 'idle'; // 'ready' | 'flashing' | 'answering' | 'retry' | 'verified'
  let currentValue = 1;
  let currentFormat = 'subgroups';
  let hadMissThisTurn = false;
  let usedPeekThisTurn = false;
  let cleanStreak = 0;
  let flashTimer = null;
  let canAdvance = false;

  function getRange() {
    return RANGES.find(r => r.id === config.rangeId) || RANGES[1];
  }

  function getFlashMs() {
    return (SPEEDS.find(s => s.id === config.speedId) || SPEEDS[1]).ms;
  }

  function clearFlashTimer() {
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
    el.flashBar.classList.remove('active');
    el.flashBarFill.style.transition = 'none';
    el.flashBarFill.style.transform = 'scaleX(0)';
  }

  function chooseFormatForTurn() {
    if (config.formatId === 'tenframe') return 'tenframe';
    if (config.formatId === 'fingers') return 'fingers';
    if (config.formatId === 'dice') return 'dice';
    if (config.formatId === 'dots-prog') {
      if (cleanStreak >= 4 && Math.random() < 0.55) {
        return 'dots';
      }
      return 'subgroups';
    }
    const pool = cleanStreak >= 4
      ? ['subgroups', 'tenframe', 'dots', 'fingers', 'dice']
      : ['subgroups', 'tenframe', 'fingers', 'dice'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function buildKeypad() {
    const range = getRange();
    const isSmall = range.max <= 5;
    const minBtn = 1;
    const maxBtn = isSmall ? 5 : 10;

    el.answerDock.classList.toggle('compact', isSmall || config.modeId === 'teacher');

    let html = '';
    for (let n = minBtn; n <= maxBtn; n++) {
      html += `<button type="button" class="num-btn" data-num="${n}" disabled>${n}</button>`;
    }
    el.keypad.innerHTML = html;

    el.keypad.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        handleAnswerTap(Number(btn.dataset.num), btn);
      });
    });
  }

  function setKeypadEnabled(enabled) {
    el.keypad.querySelectorAll('.num-btn').forEach(btn => {
      if (btn.classList.contains('wrong')) {
        btn.disabled = true;
      } else {
        btn.disabled = !enabled;
      }
    });
  }

  function resetKeypadVisuals() {
    el.keypad.querySelectorAll('.num-btn').forEach(btn => {
      btn.classList.remove('wrong', 'correct');
      btn.disabled = true;
    });
  }

  function renderProgress() {
    const { completed, total } = session.progress();
    let html = '';
    for (let i = 0; i < total; i++) {
      const cls = i < completed ? ' done' : (i === completed ? ' current' : '');
      html += `<span class="prog-dot${cls}"></span>`;
    }
    el.progressDots.innerHTML = html;
  }

  function startRound() {
    MatikkaAudio.unlock();
    clearFlashTimer();

    const range = getRange();
    const pool = [];
    for (let n = range.min; n <= range.max; n++) pool.push(n);

    session = MatikkaScheduler.createSession({
      pool,
      roundLength: config.roundLength,
      maxExtraTurns: config.modeId === 'teacher' ? 0 : 4,
      maxRequeuesPerKey: 2
    });
    cleanStreak = 0;

    el.endScreen.classList.add('hidden');
    el.setupScreen.classList.add('hidden');
    el.gameScreen.classList.remove('hidden');
    el.gameScreen.classList.toggle('mode-teacher', config.modeId === 'teacher');

    if (syncGameMute) syncGameMute();

    buildKeypad();
    if (config.modeId === 'teacher') {
      el.keypad.classList.add('hidden');
      el.nextBar.classList.add('hidden');
      el.teacherBar.classList.remove('hidden');
      el.btnPeek.classList.add('hidden');
    } else {
      el.keypad.classList.remove('hidden');
      el.nextBar.classList.add('hidden');
      el.teacherBar.classList.add('hidden');
      el.btnPeek.classList.remove('hidden');
    }

    prepareTurn();
  }

  function returnToSetup() {
    clearFlashTimer();
    phase = 'idle';
    canAdvance = false;
    el.endScreen.classList.add('hidden');
    el.gameScreen.classList.add('hidden');
    el.setupScreen.classList.remove('hidden');
    if (syncSetupMute) syncSetupMute();
  }

  function prepareTurn() {
    clearFlashTimer();
    const item = session.current();
    if (!item) {
      finishRound();
      return;
    }

    phase = 'ready';
    canAdvance = false;
    currentValue = item.key;
    currentFormat = chooseFormatForTurn();
    hadMissThisTurn = false;
    usedPeekThisTurn = false;

    renderProgress();

    // Generate fresh visual layout underneath closed curtain
    el.stimulusLayer.innerHTML = MatikkaQuantities.render(currentValue, currentFormat);

    el.stageCard.classList.remove('state-correct', 'state-retry', 'clickable');
    el.revealBadge.classList.add('hidden');
    el.revealBadge.classList.remove('teacher');

    // Close curtain and show Katso button
    el.curtain.classList.remove('open');
    el.btnCurtainLook.classList.remove('hidden');
    el.curtainQuestion.classList.add('hidden');

    if (config.modeId === 'player') {
      el.keypad.classList.remove('hidden');
      el.nextBar.classList.add('hidden');
      resetKeypadVisuals();
      el.btnPeek.disabled = true;
    } else {
      el.btnGmPeek.disabled = true;
      el.btnGmReveal.disabled = true;
      el.btnGmPeek.classList.remove('hidden');
      el.btnGmReveal.classList.remove('hidden');
      el.btnGmNext.classList.add('hidden');
    }
  }

  function runFlash(isPeek = false) {
    if (phase !== 'ready' && phase !== 'answering') return;
    clearFlashTimer();

    if (isPeek) {
      usedPeekThisTurn = true;
    }

    phase = 'flashing';
    const duration = getFlashMs();

    MatikkaAudio.playFlash();
    el.btnCurtainLook.classList.add('hidden');
    el.curtainQuestion.classList.add('hidden');
    el.btnPeek.disabled = true;
    setKeypadEnabled(false);

    if (config.modeId === 'teacher') {
      el.btnGmPeek.disabled = true;
      el.btnGmReveal.disabled = true;
    }

    // Lift curtain
    el.curtain.classList.add('open');

    // Subtle hairline bar sweep
    el.flashBar.classList.add('active');
    el.flashBarFill.style.transition = 'none';
    el.flashBarFill.style.transform = 'scaleX(1)';
    void el.flashBarFill.offsetWidth;
    el.flashBarFill.style.transition = `transform ${duration}ms linear`;
    el.flashBarFill.style.transform = 'scaleX(0)';

    flashTimer = setTimeout(() => {
      flashTimer = null;
      el.flashBar.classList.remove('active');
      // Drop curtain
      el.curtain.classList.remove('open');
      el.curtainQuestion.classList.remove('hidden');

      phase = 'answering';
      if (config.modeId === 'player') {
        setKeypadEnabled(true);
        el.btnPeek.disabled = false;
      } else {
        el.btnGmPeek.disabled = false;
        el.btnGmReveal.disabled = false;
      }
    }, duration);
  }

  function enableAdvanceNextFrame() {
    canAdvance = false;
    requestAnimationFrame(() => {
      if (phase === 'verified') {
        canAdvance = true;
      }
    });
  }

  function handleAnswerTap(val, btn) {
    if (phase !== 'answering' && phase !== 'retry') return;

    if (val === currentValue) {
      phase = 'verified';

      const clean = !hadMissThisTurn && !usedPeekThisTurn;
      if (clean) {
        cleanStreak += 1;
      } else {
        cleanStreak = 0;
      }

      session.record({ correct: !hadMissThisTurn, assisted: usedPeekThisTurn });
      renderProgress();

      MatikkaAudio.playCorrect(cleanStreak);

      setKeypadEnabled(false);
      el.btnPeek.disabled = true;

      // Lift curtain immediately to verify visually
      el.curtain.classList.add('open');
      el.stageCard.classList.remove('state-retry');
      el.stageCard.classList.add('state-correct');

      el.revealBadge.textContent = String(currentValue);
      el.revealBadge.classList.remove('hidden');

      // Swap immediately to Seuraava (no delayed timer race) and arm on next frame
      el.keypad.classList.add('hidden');
      el.nextBar.classList.remove('hidden');
      enableAdvanceNextFrame();
    } else {
      // Gentle correction: lift curtain immediately so child can inspect and tap the right number
      hadMissThisTurn = true;
      cleanStreak = 0;
      phase = 'retry';

      MatikkaAudio.playMiss();
      btn.classList.add('wrong');
      btn.disabled = true;
      el.btnPeek.disabled = true;

      el.curtain.classList.add('open');
      el.stageCard.classList.add('state-retry');
    }
  }

  function revealForTeacher() {
    if (phase !== 'answering') return;
    phase = 'verified';

    session.record({ correct: true, assisted: false });
    renderProgress();
    MatikkaAudio.playCorrect(session.progress().completed);

    el.curtain.classList.add('open');
    el.stageCard.classList.add('state-correct');

    el.revealBadge.textContent = String(currentValue);
    el.revealBadge.classList.add('teacher');
    el.revealBadge.classList.remove('hidden');

    el.btnGmPeek.classList.add('hidden');
    el.btnGmReveal.classList.add('hidden');
    el.btnGmNext.classList.remove('hidden');
    enableAdvanceNextFrame();
  }

  function nextTurn() {
    if (phase !== 'verified' || !canAdvance) return;
    canAdvance = false;
    MatikkaAudio.playTap();
    if (session.isDone()) {
      finishRound();
    } else {
      prepareTurn();
    }
  }

  function finishRound() {
    clearFlashTimer();
    phase = 'idle';
    canAdvance = false;
    MatikkaAudio.playWin();
    const lines = [
      'Hienosti nähty!',
      'Tarkka silmä!',
      'Kierros valmis!'
    ];
    el.endLine.textContent = lines[Math.floor(Math.random() * lines.length)];
    el.endScreen.classList.remove('hidden');
  }

  /* ========================================================================
     EVENT LISTENERS
     ======================================================================== */
  el.btnStart.addEventListener('click', startRound);

  el.btnCurtainLook.addEventListener('click', (e) => {
    e.stopPropagation();
    runFlash(false);
  });

  // Tapping anywhere on the ready curtain also starts the flash cleanly
  el.curtain.addEventListener('click', () => {
    if (phase === 'ready') {
      runFlash(false);
    }
  });

  el.btnPeek.addEventListener('click', () => {
    if (phase === 'answering') {
      runFlash(true);
    }
  });

  el.btnNext.addEventListener('click', nextTurn);
  el.btnGmPeek.addEventListener('click', () => runFlash(true));
  el.btnGmReveal.addEventListener('click', revealForTeacher);
  el.btnGmNext.addEventListener('click', nextTurn);

  el.btnEndAgain.addEventListener('click', startRound);

  // Initial setup render
  renderSetup();
})();
