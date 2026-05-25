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
