/* ============================================================
 * 唯戒 · 演示助手（mock-demo.js · v1.0）
 *
 * 目的：让 5 个原型 HTML 都能演示「夏日漫步 · 凉夜万步」8 步完整闭环。
 * 在每个左侧 nav (aside.side-nav) 底部追加一段"演示捷径"按钮组，
 * 每个按钮 = 一键 MockUser.patch(...) 跳到对应步骤；
 * 步骤 6 同时拉起共享的「挑战完成弹窗」。
 *
 * 依赖：mock-shared.js（须先加载）
 * 用法：<script src="./mock-shared.js"></script>
 *       <script src="./mock-demo.js"></script>
 *
 * 仅在原型 / 演示环境引入；生产环境不该携带本文件。
 * ============================================================ */
(function () {
  'use strict';
  if (!window.MockUser) {
    console.warn('[MockDemo] window.MockUser not available; load mock-shared.js first.');
    return;
  }

  /* ---------- 1. 步骤逻辑 ---------- */
  const STEPS = [
    {
      id: 1, icon: '🎬', label: '1·重置·未加入',
      hint: 'sakura.joined=false / 0/15；今日步数清零；level / medals 复位',
      do() {
        window.MockUser.patch({
          challenges: { sakura: { joined: false, current: 0, target: 15, unit: '天' } },
          today: { habits: { walk: { current: 0, target: 10000, unit: '步' } } },
          level:  { lv: 12, stageName: '行动', xp: 1840, xpToNext: 660, streakDays: 7 },
          rewards:{ medals: { unlocked: 24, total: 110 } },
          _demo:  { sakuraCompleted: false }
        });
        toast('🎬 已重置到演示起点');
      }
    },
    {
      id: 4, icon: '👟', label: '4·走够 6,000 步',
      hint: '当日 walk.current=6000；活动 sakura.current=1（首日达标）',
      do() {
        window.MockUser.patch({
          challenges: { sakura: { joined: true, current: 1 } },
          today: { habits: { walk: { current: 6000 } } }
        });
        toast('👟 今日已走 6,000 步，活动进度 +1 天');
      }
    },
    {
      id: 5, icon: '⏳', label: '5·临近完成 14/15',
      hint: 'sakura.current=14；再差 1 天',
      do() {
        window.MockUser.patch({
          challenges: { sakura: { joined: true, current: 14 } },
          today: { habits: { walk: { current: 6000 } } }
        });
        toast('⏳ 已坚持 14 天，再 1 天就达成');
      }
    },
    {
      id: 6, icon: '🏆', label: '6·触发完成弹窗',
      hint: 'sakura.current=15；level +200 XP；medals +1；弹完成动效（L8 正式组件）',
      do() {
        const u = window.MockUser.get();
        const curXp = (u.level && u.level.xp) || 1840;
        const curMedals = (u.rewards && u.rewards.medals && u.rewards.medals.unlocked) || 24;
        const curXpToNext = (u.level && u.level.xpToNext) || 660;
        window.MockUser.patch({
          challenges: { sakura: { joined: true, current: 15 } },
          level: { xp: curXp + 200, xpToNext: Math.max(0, curXpToNext - 200) },
          rewards: { medals: { unlocked: curMedals + 1 } },
          _demo: { sakuraCompleted: true }
        });
        /* 优先调用 04 内的正式 L8 组件；当前页不在 04 时跳过去并附带 query 参数 */
        if (typeof window.openLvCompleteModal === 'function') {
          window.openLvCompleteModal('sakura');
        } else {
          window.location.href = './04-练级模块.html?openComplete=sakura';
        }
      }
    },
    {
      id: 'reset', icon: '🔄', label: '重置全部 mock',
      hint: '回到 MOCK_USER 默认值（schema 出厂态）',
      do() {
        window.MockUser.reset();
        toast('🔄 已重置全部 mock 数据');
      }
    }
  ];

  /* ---------- 2. 注入面板样式 ---------- */
  function injectStyle() {
    if (document.getElementById('mock-demo-style')) return;
    const css = `
      .mock-demo-panel {
        margin-top: 16px; padding: 12px 10px 10px;
        border-top: 1px dashed rgba(108,92,231,0.35);
        background: linear-gradient(180deg, rgba(108,92,231,0.05), rgba(168,85,247,0.04));
        border-radius: 10px;
      }
      .mock-demo-panel .md-section-label {
        font-size: 11px; font-weight: 700; color: #6c5ce7;
        letter-spacing: 0.04em; margin: 0 0 8px 2px; line-height: 1.3;
      }
      .mock-demo-panel .md-btn {
        display: flex; align-items: center; gap: 6px;
        width: 100%; padding: 7px 10px; margin: 0 0 4px 0;
        font-size: 12px; font-weight: 600;
        color: #312e81;
        background: #fff; border: 1px solid rgba(108,92,231,0.25); border-radius: 8px;
        cursor: pointer; text-align: left;
        transition: background .12s, transform .08s, border-color .12s;
        font-family: inherit;
      }
      .mock-demo-panel .md-btn:hover { background: rgba(108,92,231,0.08); border-color: rgba(108,92,231,0.40); }
      .mock-demo-panel .md-btn:active { transform: scale(0.98); }
      .mock-demo-panel .md-icon { font-size: 13px; flex-shrink: 0; }
      .mock-demo-panel .md-label { flex: 1; min-width: 0; }
      .mock-demo-panel .md-tip {
        font-size: 10px; color: #8A8DA4; margin-top: 6px; padding: 0 2px;
        line-height: 1.5;
      }

      /* 共享 toast（与各模块的 toast 互不干扰，挂 body 上） */
      .md-toast {
        position: fixed; left: 50%; bottom: 64px; transform: translateX(-50%);
        background: rgba(20,22,25,0.92); color: #fff;
        padding: 10px 18px; border-radius: 22px;
        font-size: 13px; font-weight: 600; white-space: nowrap;
        z-index: 99999;
        pointer-events: none;
        opacity: 0; transition: opacity .2s, bottom .2s;
      }
      .md-toast.show { opacity: 1; bottom: 80px; }

      /* 注：挑战完成弹窗 已升级为 04-练级模块 内的正式 L8 组件，本文件不再注入临时 DOM。 */
      @keyframes mdFadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    const styleEl = document.createElement('style');
    styleEl.id = 'mock-demo-style';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /* ---------- 3. 注入捷径面板到所有 aside.side-nav ---------- */
  function injectPanel() {
    document.querySelectorAll('aside.side-nav').forEach(sb => {
      if (sb.querySelector('.mock-demo-panel')) return;
      const panel = document.createElement('div');
      panel.className = 'mock-demo-panel';
      panel.innerHTML = `
        <div class="md-section-label">🎬 演示捷径 · 凉夜万步</div>
        ${STEPS.map(s => `<button type="button" class="md-btn" data-step="${s.id}" title="${s.hint}">
          <span class="md-icon">${s.icon}</span>
          <span class="md-label">${s.label}</span>
        </button>`).join('')}
        <div class="md-tip">每个按钮 = 一键 patch mock，5 个模块全部实时同步</div>
      `;
      sb.appendChild(panel);
    });
  }

  /* ---------- 4. 共享 toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    let el = document.getElementById('mdToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mdToast';
      el.className = 'md-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- 5. 完成弹窗 ----------
     已升级为 04-练级模块 内的正式 L8 组件（id="lvCompleteModal"）。
     本文件不再注入临时 DOM；step 6 直接调用 window.openLvCompleteModal()。
     若当前页不是 04，则跳转 04?openComplete=sakura 让其加载后自动弹起。 */

  /* ---------- 6. 点击委托：所有 md-btn ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.mock-demo-panel .md-btn');
    if (!btn) return;
    const id = btn.dataset.step;
    const step = STEPS.find(s => String(s.id) === id);
    if (step) step.do();
  });

  /* ---------- 7. 暴露 API ---------- */
  window.MockDemo = {
    step1: STEPS[0].do,
    step4: STEPS[1].do,
    step5: STEPS[2].do,
    step6: STEPS[3].do,
    reset: STEPS[4].do,
    toast,
  };

  /* ---------- 8. 初始化 ---------- */
  function init() { injectStyle(); injectPanel(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ============================================================
 * XP 说明弹窗 · 所有模块共用（点 XP 标签即弹）
 * 涵盖：01 今日 · 02 关心 · 03 个人中心 · 04 维度 · 05 收获
 * ============================================================ */
(function () {
  // ---------- 1. 注入样式 ----------
  var style = document.createElement('style');
  style.textContent = [
    '.xp-info-mask{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99998;opacity:0;pointer-events:none;transition:opacity 0.22s ease;display:flex;align-items:center;justify-content:center;padding:24px}',
    '.xp-info-mask.show{opacity:1;pointer-events:auto}',
    '.xp-info-card{background:#fff;border-radius:22px;padding:28px 22px 22px;width:340px;max-width:90vw;max-height:88vh;overflow-y:auto;box-shadow:0 24px 80px rgba(108,92,231,0.32);transform:scale(0.92);transition:transform 0.26s cubic-bezier(0.34,1.56,0.64,1);position:relative}',
    '.xp-info-mask.show .xp-info-card{transform:scale(1)}',
    '.xp-info-close{position:absolute;top:10px;right:14px;width:30px;height:30px;border-radius:50%;background:#f3f4f6;color:#6b7280;border:none;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}',
    '.xp-info-icon{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#FFC940,#FF8A1A);display:flex;align-items:center;justify-content:center;font-size:34px;margin:0 auto 12px;box-shadow:0 8px 22px rgba(255,138,26,0.38);color:#fff}',
    '.xp-info-title{font-size:20px;font-weight:800;text-align:center;color:#1F2330;margin-bottom:6px;letter-spacing:0.5px}',
    '.xp-info-sub{font-size:13px;color:#6b7280;text-align:center;line-height:1.6;margin-bottom:18px}',
    '.xp-info-section{margin-bottom:14px;background:#FAFAFB;border-radius:14px;padding:14px 14px 10px}',
    '.xp-info-h{font-size:13px;font-weight:700;color:#6C5CE7;margin-bottom:8px;display:flex;align-items:center;gap:6px}',
    '.xp-info-list{font-size:12.5px;color:#1F2330;line-height:1.7;padding-left:0;list-style:none;margin:0}',
    '.xp-info-list li{padding:3px 0;padding-left:14px;position:relative}',
    '.xp-info-list li::before{content:"";position:absolute;left:0;top:12px;width:5px;height:5px;border-radius:50%;background:#FFA31A}',
    '.xp-info-list li b{color:#6C5CE7;font-weight:700}',
    '.xp-info-btn{width:100%;margin-top:6px;padding:13px;background:linear-gradient(135deg,#6C5CE7,#A855F7,#EC4899);color:#fff;font-weight:700;font-size:15px;border:none;border-radius:999px;cursor:pointer;box-shadow:0 6px 20px rgba(108,92,231,0.3)}',
    '.xp-info-btn:active{transform:scale(0.97)}',
    '[data-xp-info-hooked]{cursor:pointer}'
  ].join('');
  document.head.appendChild(style);

  // ---------- 2. 注入弹窗 DOM ----------
  var mask = document.createElement('div');
  mask.className = 'xp-info-mask';
  mask.id = 'xpInfoMask';
  mask.innerHTML = [
    '<div class="xp-info-card" onclick="event.stopPropagation()">',
    '  <button class="xp-info-close" onclick="window.closeXpInfo()">✕</button>',
    '  <div class="xp-info-icon">⚡</div>',
    '  <div class="xp-info-title">XP · 经验值</div>',
    '  <div class="xp-info-sub">完成行为获得"经验值"，累积升级；等级越高，专属皮肤、头像框、永久加成倍率也越多。</div>',
    '  <div class="xp-info-section">',
    '    <div class="xp-info-h">💎 怎么获得 XP？</div>',
    '    <ul class="xp-info-list">',
    '      <li>完成今日挑战：每张 <b>+20 ~ +40 XP</b></li>',
    '      <li>给好友点赞：<b>+3 XP/次</b>（每日上限 60）</li>',
    '      <li>给好友留言：<b>+5 XP/次</b>（每日上限 30）</li>',
    '      <li>加入维度挑战：<b>+10 XP</b>；完赛 <b>+50 ~ +200 XP</b></li>',
    '      <li>邀请好友：<b>+5 XP/次</b>（每日上限 50）</li>',
    '      <li>每日开 App 签到：<b>+5 XP</b>（每日 1 次）</li>',
    '      <li>阅读教程文章：<b>+5 XP/篇</b>（每日 1 篇）</li>',
    '    </ul>',
    '  </div>',
    '  <div class="xp-info-section">',
    '    <div class="xp-info-h">🎯 XP 用来做什么？</div>',
    '    <ul class="xp-info-list">',
    '      <li>累积升级，共 <b>25 个等级</b></li>',
    '      <li>每升 5 级触发<b>形象进化</b>，解锁皮肤 / 头像框 / 永久 XP 加成</li>',
    '      <li>满足条件颁发<b>勋章</b>与<b>连击</b>成就</li>',
    '      <li>登上<b>好友 XP 排行榜</b></li>',
    '    </ul>',
    '  </div>',
    '  <button class="xp-info-btn" onclick="window.closeXpInfo()">知道了</button>',
    '</div>'
  ].join('');
  mask.addEventListener('click', function (e) {
    if (e.target === mask) window.closeXpInfo();
  });
  document.body.appendChild(mask);

  // ---------- 3. 暴露开关 API ----------
  window.openXpInfo = function () {
    document.getElementById('xpInfoMask').classList.add('show');
  };
  window.closeXpInfo = function () {
    document.getElementById('xpInfoMask').classList.remove('show');
  };

  // ---------- 4. 自动绑定所有 XP 标签 ----------
  /* 选择器覆盖 5 个模块里所有"XP 标签/胶囊"元素的 class（来自扫描结果）；
     收获模块的列表是 JS 动态注入，故通过 setInterval 周期补绑。 */
  var SELECTORS = [
    '.habit-xp',         // 01 今日 - 挑战卡 XP 标签
    '.xp-amount',        // 01 今日
    '.xp-action',        // 01 今日
    '.xp-badge',         // 04 维度 - 通用 XP 胶囊
    '.j-xp',             // 04 维度 - 已加入卡 XP
    '.mc-xp',            // 04 维度 - 月度卡 XP
    '.lc-pill-xp',       // 04 维度 - 奖品 XP 倍率
    '.podium-xp',        // 02 关心 - 颁奖台 XP
    '.podium-xp-lbl',    // 02 关心 - 颁奖台 XP 标签
    '.my-rank-xp',       // 02 关心 - 我的排名 XP
    '.ch-xp',            // 03 个人中心 - 消息行内 XP
    '.h-total-pill',     // 05 收获 - 昨日 XP 总数
    '.h-xp-main'         // 05 收获 - XP 明细每行数值
  ].join(',');

  function bindEl(el) {
    if (!el || el.getAttribute('data-xp-info-hooked')) return;
    el.setAttribute('data-xp-info-hooked', '1');
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      window.openXpInfo();
    });
  }

  /* 判断一段短文本是否"看起来就是 XP 标签"
     例：+30 XP / +10 XP/次 / XP × 1.10 / 累计 1840 XP / +50 ~ +200 XP */
  function isXpLabelText(text) {
    if (!text) return false;
    text = String(text).trim();
    if (text.length === 0 || text.length > 40) return false;
    if (!/XP/i.test(text)) return false;
    // 含数字 + XP；或 XP × N；或包含"经验"
    return /[+\d][\d,.\s]*XP\b/i.test(text)
        || /XP\s*[×x*]\s*\d/i.test(text)
        || /\bXP\b/.test(text) && /\d/.test(text);
  }

  function bindAll() {
    // 1. 白名单 class
    document.querySelectorAll(SELECTORS).forEach(bindEl);
    // 2. 文本兜底：扫描叶子元素，文本像 XP 标签的也绑定（覆盖未列入白名单的所有 XP 元素）
    var TAGS = 'span,div,b,em,i,strong,p,small,label';
    document.querySelectorAll(TAGS).forEach(function (el) {
      if (el.getAttribute('data-xp-info-hooked')) return;
      if (el.children.length > 0) return;  // 只处理叶子节点
      if (isXpLabelText(el.textContent)) bindEl(el);
    });
  }

  function start() {
    bindAll();
    console.log('[XP-info] 已绑定 XP 标签弹窗（点任何 XP 标签可看说明）');
    setInterval(bindAll, 1500);  // 周期补绑：覆盖收获/维度等动态注入的列表
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
