// Eyes overlay: follows the cursor and can click to trigger fixes
(function() {
  if (window.__ui_copilot_eyes_installed) return;
  window.__ui_copilot_eyes_installed = true;

  const container = document.createElement('div');
  container.id = 'copilot-eyes-container';
  container.innerHTML = `
    <div id="copilot-eyes" aria-hidden="true">
      <div class="eye left"><div class="pupil"></div></div>
      <div class="eye right"><div class="pupil"></div></div>
    </div>
  `;
  document.documentElement.appendChild(container);

  const eyes = container.querySelectorAll('.eye');
  const pupils = container.querySelectorAll('.pupil');

  let enabled = false;

  function updatePosition(x, y) {
    // Position eyes near top-right corner but follow cursor subtly
    const rect = container.getBoundingClientRect();
    const centerX = x;
    const centerY = y;

    pupils.forEach(p => {
      const eyeRect = p.parentElement.getBoundingClientRect();
      const dx = centerX - (eyeRect.left + eyeRect.width / 2);
      const dy = centerY - (eyeRect.top + eyeRect.height / 2);
      const angle = Math.atan2(dy, dx);
      const max = 8;
      const px = Math.cos(angle) * max;
      const py = Math.sin(angle) * max;
      p.style.transform = `translate(${px}px, ${py}px)`;
    });
  }

  function onMove(e) {
    updatePosition(e.clientX, e.clientY);
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    container.classList.add('visible');
    window.addEventListener('mousemove', onMove);
    container.addEventListener('click', onClick, true);
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    container.classList.remove('visible');
    window.removeEventListener('mousemove', onMove);
    container.removeEventListener('click', onClick, true);
  }

  function onClick(e) {
    // Try to find the nearest element under cursor (ignore the eyes themselves)
    const px = e.clientX;
    const py = e.clientY;
    container.classList.add('temp-ignore');
    const el = document.elementFromPoint(px, py);
    container.classList.remove('temp-ignore');

    if (!el) return;

    // If clicked on a UI element, ask uiCopilot to fix it
    if (window.uiCopilot) {
      // Prefer fixing the element itself, otherwise audit
      if (el && typeof uiCopilot.fixElement === 'function') {
        uiCopilot.fixElement(el);
        // flash the pupils to indicate action
        flashPupils();
      }
    }
  }

  function flashPupils() {
    pupils.forEach(p => p.classList.add('flash'));
    setTimeout(() => pupils.forEach(p => p.classList.remove('flash')), 400);
  }

  // Expose toggle API for popup/background
  window.uiCopilotEyes = {
    enable,
    disable,
    toggle: () => (enabled ? disable() : enable()),
    isEnabled: () => enabled
  };

  // Start disabled by default
  disable();
})();
