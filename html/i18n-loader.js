/* ==========================================================
   唯戒 · 多语言 loader（原型版）
   ----------------------------------------------------------
   设计目标：开发拿到 i18n/*.json 后可直接 drop into i18next /
   vue-i18n / Flutter intl 等任何正式 i18n 库，不会重复造轮子。
   ----------------------------------------------------------
   API:
     window.I18N.lang          → 当前语言代码
     window.I18N.dict          → 当前词典
     window.t(key, vars?)      → 查表 + 占位符替换
     window.setLang(lang)      → 切换语言（异步加载 + 重渲）
     window.renderI18nNodes()  → 扫描 [data-i18n] 重渲
     window.onLangChange(cb)   → 订阅语言切换（业务代码用）
   ----------------------------------------------------------
   data-i18n 用法：
     <span data-i18n="nav.today">今日</span>
     <button data-i18n-attr="aria-label:metric.btnMeasure">+</button>
   ========================================================== */
(function () {
  const SUPPORTED = ['zh-CN', 'en', 'ja', 'vi', 'th'];
  const FALLBACK  = 'zh-CN';
  const KEY_STORE = 'weijie_lang';

  // 当前状态
  const I18N = {
    lang: (function () {
      try {
        const saved = localStorage.getItem(KEY_STORE);
        if (saved && SUPPORTED.includes(saved)) return saved;
      } catch (e) {}
      const nav = (navigator.language || '').toLowerCase();
      if (nav.startsWith('en')) return 'en';
      if (nav.startsWith('ja')) return 'ja';
      if (nav.startsWith('vi')) return 'vi';
      if (nav.startsWith('th')) return 'th';
      return FALLBACK;
    })(),
    dict: {},
    fallbackDict: {},
    listeners: [],
  };

  // 路径式查表（'habit.walk.desc' → dict.habit.walk.desc）
  function lookup(dict, key) {
    return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
  }

  // 占位符替换：'Hello {name}' + {name:'Sam'} → 'Hello Sam'
  function interpolate(str, vars) {
    if (typeof str !== 'string' || !vars) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
  }

  // 主查表函数：未命中先回退 fallback dict，再回退 key 自身
  function t(key, vars) {
    let raw = lookup(I18N.dict, key);
    if (raw == null) raw = lookup(I18N.fallbackDict, key);
    if (raw == null) raw = key;
    return interpolate(raw, vars);
  }

  // 扫描 DOM 重渲所有带 i18n 标记的节点
  function renderI18nNodes(root = document) {
    // 文本节点
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const txt = t(key);
      if (txt != null) el.textContent = txt;
    });
    // HTML 节点（含 <b> 等内嵌标签的文案）
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = t(key);
    });
    // 属性形式（aria-label / placeholder / title 等）
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const spec = el.getAttribute('data-i18n-attr');
      if (!spec) return;
      spec.split(',').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  async function loadJSON(lang) {
    const res = await fetch(`./i18n/${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load i18n/${lang}.json`);
    return await res.json();
  }

  // seq counter：防止 boot 初次 setLang 和用户手动 setLang 的 in-flight 竞态
  // 任何 setLang 都拿一个全局 seq，落地前若 seq 已被更新的请求覆盖就丢弃自己的结果
  let _setLangSeq = 0;
  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = FALLBACK;
    const mySeq = ++_setLangSeq;
    try {
      const dict = await loadJSON(lang);
      if (mySeq !== _setLangSeq) return; // 有更新请求覆盖，丢弃
      I18N.lang = lang;
      I18N.dict = dict;
      try { localStorage.setItem(KEY_STORE, lang); } catch (e) {}
      document.documentElement.setAttribute('lang', lang);
      renderI18nNodes();
      I18N.listeners.forEach(fn => { try { fn(lang); } catch (e) {} });
    } catch (e) {
      console.error('[i18n] setLang failed:', e);
    }
  }

  // 启动：预加载 fallback（zh-CN）+ 当前语言；保证查表永远不会 miss
  async function boot() {
    try {
      I18N.fallbackDict = await loadJSON(FALLBACK);
    } catch (e) { /* 缺省词典不存在也不影响 */ }
    await setLang(I18N.lang);
  }

  // 导出到 window
  window.I18N = I18N;
  window.t = t;
  window.setLang = setLang;
  window.renderI18nNodes = renderI18nNodes;
  window.onLangChange = function (cb) {
    if (typeof cb === 'function') I18N.listeners.push(cb);
  };

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
