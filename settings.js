(() => {
  'use strict';
  const STORAGE_KEY = 'spider-text-settings-v1';
  const groups = [
    { title: '排版', fields: [
      { key: 'fontScale', label: '文字大小', min: .7, max: 1.3, step: .01, value: 1, unit: '×' },
      { key: 'weight', label: '字重', min: 300, max: 700, step: 10, value: 400 },
      { key: 'lineHeight', label: '行高', min: 1.1, max: 1.9, step: .01, value: 88 / 60, unit: '×' },
      { key: 'tracking', label: '字距', min: -.08, max: .04, step: .001, value: -3.2 / 60, unit: 'em' },
    ] },
    { title: '配色', fields: [
      { key: 'paper', label: '背景', value: '#fbfbfb', type: 'color' },
      { key: 'ink', label: '正文', value: '#161616', type: 'color' },
      { key: 'panel0', label: '贴纸 · 洋红', value: '#d500ed', type: 'color' },
      { key: 'panel1', label: '贴纸 · 绿', value: '#24ee19', type: 'color' },
      { key: 'panel2', label: '贴纸 · 黄', value: '#ffd20a', type: 'color' },
      { key: 'panel3', label: '贴纸 · 蓝紫', value: '#2815ec', type: 'color' },
    ] },
    { title: '动效', fields: [
      { key: 'speed', label: '播放速度', min: .25, max: 2, step: .05, value: 1, unit: '×' },
      { key: 'effectLength', label: '单词特效时长', min: .5, max: 2, step: .05, value: 1, unit: '×' },
      { key: 'intensity', label: '套色偏移', min: 0, max: 2, step: .05, value: 1, unit: '×' },
      { key: 'rotation', label: '贴纸旋转', min: 0, max: 2, step: .05, value: 1, unit: '×' },
      { key: 'particles', label: '网点与碎片', min: 0, max: 1, step: .05, value: 1, unit: '×' },
    ] },
  ];
  const fields = groups.flatMap(group => group.fields);
  const defaults = Object.fromEntries(fields.map(field => [field.key, field.value]));
  let values = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    for (const field of fields) {
      const value = saved?.[field.key];
      if (field.type === 'color' && /^#[0-9a-f]{6}$/i.test(value)) values[field.key] = value;
      else if (typeof value === 'number' && Number.isFinite(value) && field.type !== 'color')
        values[field.key] = Math.max(field.min, Math.min(field.max, value));
    }
  } catch { /* Storage can be disabled; controls remain usable in memory. */ }
  const form = document.querySelector('#settings-form');
  const panel = document.querySelector('#settings-panel');
  const toggle = document.querySelector('#tune');
  const status = document.querySelector('#settings-status');
  const display = field => field.type === 'color' ? values[field.key].toUpperCase()
    : `${Number(values[field.key].toFixed(field.key === 'tracking' ? 3 : 2))}${field.unit || ''}`;
  for (const group of groups) {
    const section = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.title;
    section.append(legend);
    for (const field of group.fields) {
      const label = document.createElement('label');
      label.className = field.type === 'color' ? 'color-field' : 'range-field';
      label.htmlFor = `setting-${field.key}`;
      const name = document.createElement('span');
      name.textContent = field.label;
      const input = document.createElement('input');
      input.type = field.type || 'range';
      input.id = `setting-${field.key}`;
      input.name = field.key;
      input.value = values[field.key];
      if (field.type !== 'color') {
        input.min = field.min; input.max = field.max; input.step = field.step;
      }
      const output = document.createElement('output');
      output.htmlFor = input.id;
      output.textContent = display(field);
      label.append(name, output, input);
      section.append(label);
    }
    form.append(section);
  }
  function apply(changed = 'all') {
    const root = document.documentElement.style;
    for (const [key, css] of [['fontScale','--font-scale'],['weight','--font-weight'],
      ['lineHeight','--line-height'],['tracking','--tracking'],['paper','--paper'],['ink','--ink']])
      root.setProperty(css, values[key]);
    document.dispatchEvent(new CustomEvent('revealsettings', { detail: { changed } }));
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); status.textContent = '已保存在本机'; }
    catch { status.textContent = '本次调整有效；浏览器未允许保存'; }
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => {
    const field = fields.find(item => item.key === event.target.name);
    if (!field) return;
    values[field.key] = field.type === 'color' ? event.target.value : Number(event.target.value);
    event.target.previousElementSibling.textContent = display(field);
    apply(field.key);
    save();
  });
  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('tuning', open);
    window.dispatchEvent(new Event('resize'));
    if (open) document.querySelector('#close-settings').focus();
    else toggle.focus();
  }
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  document.querySelector('#close-settings').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  document.querySelector('#reset-settings').addEventListener('click', () => {
    values = { ...defaults };
    for (const field of fields) {
      const input = form.elements.namedItem(field.key);
      input.value = values[field.key];
      input.previousElementSibling.textContent = display(field);
    }
    apply(); save(); status.textContent = '已恢复视频默认值';
  });
  window.RevealSettings = { get: () => ({ ...values }), defaults: { ...defaults } };
  apply();
})();
