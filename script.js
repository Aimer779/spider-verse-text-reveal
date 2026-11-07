(() => {
  'use strict';
  const { lines, words, sample, duration } = RevealTimeline;
  const passage = document.querySelector('#passage');
  const pauseButton = document.querySelector('#pause');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let settings = RevealSettings.get();
  let nodes = [], running = !reduced.matches, time = 0, last = null, frame = 0;
  let previousTick = -1;
  const stableStates = new WeakMap();
  const noise = (seed) => {
    const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const svg = (body, width, name) => `<svg class="${name} absolute pointer-none overflow-visible" width="${width / 60}em" height="2.75em" viewBox="0 0 ${width} 165" aria-hidden="true">${body}</svg>`;
  function artwork(word, width) {
    const colors = [settings.panel0, settings.panel1, settings.panel2, settings.panel3];
    const w = width + 56, x = 28, end = x + width;
    const points = [
      `${x-3},40 ${end+4},33 ${end+2},111 ${x-5},115`,
      `${x-8},32 ${x+width*.3},37 ${x+width*.65},125 ${x-12},111`,
      `${x+width*.29},40 ${end+8},58 ${x+width*.62},94`,
      `${x+width*.58},91 ${end+7},76 ${end+1},119`,
    ];
    const defs = points.map((p, i) => `<clipPath id="clip-${word.id}-${i}"><polygon points="${p}"/></clipPath>`).join('');
    const text = `<text x="28" y="102" font-family="Inter, Arial, sans-serif" font-size="60" font-weight="${settings.weight}" letter-spacing="${settings.tracking * 60}">${word.text}</text>`;
    const pieces = points.map((p, i) => {
      const c = word.id === 3 ? [0, 0, 2, 3][i] : (word.id + i) % colors.length;
      return `<g><polygon points="${p}" fill="${colors[c]}" stroke="#101010" stroke-width="4.5" stroke-linejoin="miter"/><g clip-path="url(#clip-${word.id}-${i})" fill="${c % 3 === 0 ? '#fff' : '#111'}">${i === 1 ? `<path d="M25 20L0 130M34 20L9 130M43 20L18 130M52 20L27 130M61 20L36 130M70 20L45 130M79 20L54 130M88 20L63 130M97 20L72 130M106 20L81 130" stroke="#111" opacity=".3" stroke-width="3"/>` : ''}${text}</g></g>`;
    }).join('');
    let dots = '';
    for (let i = 0; i < 68; i++) {
      const n = word.id * 101 + i;
      const cluster = i < 20;
      const dx = cluster ? 44 + (i % 5) * 7 : 16 + noise(n) * (width + 22);
      const dy = cluster ? (i < 10 ? 3 : 125) + Math.floor(i / 5) * 6 : 51 + noise(n + 10) * 60;
      if (cluster) {
        if (noise(n) > .3) dots += `<circle cx="${dx}" cy="${dy}" r="${1.5 + noise(n+4)*1.5}" fill="#ec004b"/>`;
      } else dots += `<rect class="debris" x="${dx.toFixed(2)}" y="${dy.toFixed(2)}" width="${2 + noise(n + 3) * 5}" height="2" fill="${['#ed004b','#00caca','#ffcf00','#28df19'][i % 4]}"/>`;
    }
    return svg(`<defs>${defs}</defs>${pieces}`, w, 'comic') + svg(dots, w, 'dust');
  }
  function build() {
    passage.replaceChildren();
    nodes = [];
    let id = 0;
    lines.forEach((line) => {
      const row = document.createElement('span');
      row.className = 'line';
      line.forEach((text, index) => {
        const node = document.createElement('span');
        node.className = 'word relative';
        node.dataset.id = id++;
        const face = document.createElement('span');
        face.className = 'face';
        face.textContent = text;
        node.append(face);
        const strip = document.createElement('span');
        strip.className = 'slice-strip absolute pointer-none';
        strip.textContent = text;
        node.append(strip);
        for (const color of ['cyan', 'magenta', 'yellow']) {
          const ghost = document.createElement('span');
          ghost.className = `ghost ${color} absolute pointer-none`;
          ghost.textContent = text;
          node.append(ghost);
        }
        row.append(node);
        if (index < line.length - 1) row.append(' ');
        nodes.push(node);
      });
      passage.append(row, ' ');
    });
    measure();
    render(reduced.matches ? 5.5 : time, true);
  }
  function measure() {
    passage.style.setProperty('--fit', 1);
    const stage = document.querySelector('.stage');
    const available = stage.clientWidth - parseFloat(getComputedStyle(stage).paddingLeft) * 2;
    const required = Math.max(passage.getBoundingClientRect().width, ...nodes.map(node => node.offsetWidth));
    if (required > available) passage.style.setProperty('--fit', available / required);
    if (document.body.classList.contains('tuning') && innerWidth <= 700) {
      const availableHeight = stage.clientHeight - 90;
      const height = passage.getBoundingClientRect().height;
      if (height > availableHeight) passage.style.setProperty('--fit', Math.max(.2, availableHeight / height) * Number(passage.style.getPropertyValue('--fit')));
    }
    const fontSize = parseFloat(getComputedStyle(passage).fontSize);
    nodes.forEach((node, i) => {
      node.querySelectorAll('svg').forEach((item) => item.remove());
      node.insertAdjacentHTML('beforeend', artwork(words[i], node.offsetWidth * 60 / fontSize));
    });
  }
  function render(seconds, force = false) {
    const tick = Math.floor(seconds * 24);
    if (!force && tick === previousTick) return;
    previousTick = tick;
    nodes.forEach((node, i) => {
      const state = reduced.matches ? { state: 'settled', strength: 0 } : sample(words[i], seconds, settings.effectLength);
      const stable = ['hidden', 'settled', 'slice'].includes(state.state);
      const signature = `${state.state}:${state.cut || 0}:${state.offset || 0}`;
      if (!force && stable && stableStates.get(node) === signature) return;
      stableStates.set(node, stable ? signature : null);
      node.dataset.state = state.state;
      node.dataset.exiting = String(!!state.exiting);
      node.style.setProperty('--slice-cut', `${(state.cut || 0) / 60 + (settings.lineHeight - 88 / 60) / 2}em`);
      node.style.setProperty('--slice-offset', `${(state.offset || 0) / 60}em`);
      const jitter = noise(i * 13 + tick);
      const dx = (2 + jitter * 6) * state.strength * settings.intensity;
      const dy = (noise(tick + i * 7) - .5) * 12 * state.strength * settings.intensity;
      node.style.setProperty('--dx', `${dx / 60}em`);
      node.style.setProperty('--dy', `${dy / 60}em`);
      const art = node.querySelector('.comic');
      art.style.transform = `translate(${(jitter-.5)*.12}em, ${(jitter-.5)*.1}em) rotate(${(jitter-.5)*19*settings.rotation}deg)`;
      const dust = node.querySelector('.dust');
      dust.style.transform = `translate(${(jitter-.5)*.23}em, ${(jitter-.5)*.18}em)`;
      dust.style.opacity = String((state.state === 'panel' ? .8 : Math.min(1, state.strength)) * settings.particles);
      node.style.transform = state.exiting ? `translate(${(jitter-.5)*.12}em, ${(jitter-.5)*.15}em)` : '';
    });
    passage.dataset.time = seconds.toFixed(3);
  }
  function animate(now) {
    if (!running) return;
    if (last !== null) time = (time + (now - last) / 1000 * settings.speed) % duration;
    last = now;
    render(time);
    frame = requestAnimationFrame(animate);
  }
  function setRunning(value) {
    running = value && !reduced.matches;
    pauseButton.textContent = running ? 'Pause' : 'Play';
    cancelAnimationFrame(frame);
    last = null;
    if (running && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function seek(seconds) {
    setRunning(false);
    time = Math.max(0, Math.min(duration, seconds));
    render(time, true);
  }
  pauseButton.addEventListener('click', () => setRunning(!running));
  document.querySelector('#replay').addEventListener('click', () => {
    time = 0;
    render(time, true);
    setRunning(true);
  });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    last = null;
    if (!document.hidden && running) frame = requestAnimationFrame(animate);
  });
  reduced.addEventListener('change', () => {
    setRunning(!reduced.matches);
    render(time, true);
  });
  let resizeFrame, geometryDirty = false;
  document.addEventListener('revealsettings', event => {
    settings = RevealSettings.get();
    geometryDirty ||= event.detail.changed === 'all' || ['fontScale','weight','lineHeight','tracking','panel0','panel1','panel2','panel3'].includes(event.detail.changed);
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (geometryDirty) measure();
      geometryDirty = false;
      render(time, true);
    });
  });
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { measure(); render(time, true); });
  });
  // A deterministic seek boundary makes reference-frame comparison repeatable.
  window.reveal = { seek, play: () => setRunning(true), pause: () => setRunning(false),
    get time() { return time; }, get running() { return running; } };
  document.fonts.ready.then(() => {
    build();
    setRunning(running);
    document.documentElement.dataset.ready = 'true';
  });
})();
