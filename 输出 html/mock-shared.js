/* ==========================================================
 * 唯戒 · 共享 Mock 数据层（v1.0）
 *
 * 目的：让 01-今日 / 02-关心 / 03-个人中心 / 04-练级 / 05-收获 五个原型
 * 共享同一份用户数据，跨模块跳转后顶栏头像 / 等级 / 戒指电量 / 挑战进度
 * 永远保持一致。本文件先于其他业务 JS 加载。
 *
 * 用法：
 *   <script src="./mock-shared.js"></script>
 *   <script>
 *     const u = window.MOCK_USER;
 *     document.querySelector('.username').textContent = u.profile.name;
 *
 *     // 监听变更（跨标签页 + 同标签页 patch 都会触发）
 *     window.MockUser.subscribe(snap => render(snap));
 *
 *     // 局部更新（自动持久化 + 广播订阅者）
 *     window.MockUser.patch({ profile: { name: '新名字' } });
 *
 *     // 整体重置回默认
 *     window.MockUser.reset();
 *   </script>
 *
 * Schema 字段命名遵循"领域 + 字段"小驼峰；数值用纯数字、单位放外层（progress + unit）。
 * 日期相关字段用 ISO `YYYY-MM-DD` 字符串。
 * ========================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'airing_mock_user_v1';

  /* ---------- 1. 默认数据（一切硬编码的源头） ---------- */
  const DEFAULTS = {
    // 系统时间锚点（让所有"今日 / 剩余 N 天"算法可对齐）
    meta: {
      schemaVersion: 2,        // v2：avatar 字段重构（avatar / avatarLetter / 中文姓名首字）
      today: '2026-07-12',     // 演示日期落在 7 月档中段
      weekday: '周日',          // 中文星期
    },

    // 用户基础（顶栏、个人中心、关心圈、收获 IP 都用）
    profile: {
      name: '阿明',
      /* avatar 是统一头像字段，可承载 3 种值，syncTopbar 自动识别：
         · emoji 字符（如 '🦊'） → 当作文字渲染在圆形按钮里
         · 'data:image/...' 或 http(s) URL → 设为 background-image，按钮变图片头像
         · 空 / 留白 → 落回 avatarLetter 字母占位 */
      avatar: '🦊',
      avatarEmoji: '🦊',       // 别名（向后兼容），不再单独使用
      avatarLetter: '阿',       // 头像加载失败 / 空值时的字母占位（昵称首字符）
      avatarBg: 'linear-gradient(135deg,#6c5ce7,#a855f7)',
      phone: '+86 138 0000 0000',
      gender: 'female',
      age: 28,
      heightCm: 168,
      weightKg: 55,
      healthTags: ['睡眠优等生', '步数达人'],
      registerDate: '2026-04-12',
    },

    // 等级 / XP（练级 L1.A + 收获 H1.A 共用）
    level: {
      lv: 12,
      stageName: '行动',
      stageRange: 'L10 - L14',
      xp: 1840,
      xpToNext: 660,            // 距下一级
      xpTotalForNext: 2500,     // 下一级总线
      streakDays: 7,
      seasonSkin: 'default',    // default / spring / summer / autumn / winter
    },

    // 戒指连接（5 个顶栏的连接状态标签共用）
    ring: {
      status: 'connected',      // connected / disconnected / offline
      batteryPct: 85,
      sn: 'AR-X8K2-9M4P',
      lastSyncText: '刚刚',
      firmware: 'v1.2.3',
    },

    // 今日 · 三环 + 8 指标 + 7 挑战卡（01 今日模块用）
    today: {
      rings: { habit: 78, care: 62, growth: 45 },     // 三环达成度 %
      medal: 'silver',                                 // iron / bronze / silver / gold
      metrics: {
        stress:    { value: 23, tier: 'normal',  label: '心理压力正常' },
        recovery:  { value: 12, tier: 'fatigue', label: '身体过渡疲劳' },
        hrv:       { value: 48, tier: 'good',    label: '良好' },
        steps:     { value: 8520, tier: 'good',  label: '中度活跃' },
        sleep:     { hours: 7.55, awakePct: 8, remPct: 16, corePct: 46, deepPct: 30, tier: 'good' },
        spo2:      { value: 98, tier: 'excellent', label: '优秀' },
        hr:        { value: 72, tier: 'good',    label: '良好' },
        temp:      { value: 36.5, tier: 'good',  label: '良好' },
      },
      habits: {
        // 7 张挑战卡进度（与"今日"卡 1:1）。target/unit 与策划稿对齐。
        walk:  { current: 8520,  target: 10000, unit: '步',   enabled: true,  xp: 30 },
        sleep: { current: 7.55,  target: 8,     unit: '小时', enabled: true,  xp: 40 },
        burn:  { current: 310,   target: 500,   unit: 'kcal', enabled: true,  xp: 35 },
        water: { current: 1100,  target: 2000,  unit: 'ml',   enabled: true,  xp: 20 },
        stand: { current: 9,     target: 12,    unit: '次',   enabled: true,  xp: 25 },
        run:   { current: 3.2,   target: 6,     unit: 'km',   enabled: true,  xp: 30 },
        med:   { current: 1,     target: 2,     unit: '次',   enabled: true,  xp: 20 },
      },
    },

    // 7 月档挑战进度（04 练级 + 05 收获共用）
    // key 与 04 练级模块的 CHALLENGES 对齐
    challenges: {
      sakura:   { joined: true,  current: 9,      target: 15,      unit: '天', xpReward: 200 }, // 凉夜万步
      morning:  { joined: false, current: 7,      target: 20,      unit: '天', xpReward: 300 }, // 晨光漫步
      stand:    { joined: true,  current: 12,     target: 30,      unit: '天', xpReward: 250 }, // 久坐站起来
      sheep:    { joined: false, current: 6,      target: 14,      unit: '天', xpReward: 250 }, // 夏夜清梦
      water:    { joined: true,  current: 13,     target: 21,      unit: '天', xpReward: 200 }, // 一日清泉
      runner:   { joined: false, current: 4,      target: 15,      unit: '次', xpReward: 400 }, // 心肺打卡
      postmeal: { joined: false, current: 3,      target: 12,      unit: '天', xpReward: 350 }, // 千卡突破
      annual:   { joined: true,  current: 237178, target: 2026000, unit: '步', xpReward: 1000 }, // 年度心动 200 万步
    },

    // 关心圈 / 好友（02 关心 + 03 个人中心 P7 用）
    social: {
      friendCount: 8,
      todayXP: 145,
      weekXP: 1840,
      rankInFriends: 5,         // 我在好友 XP 排行榜的位置
      likesGiven: 12,           // 今日我点赞次数
      commentsGiven: 3,
      unreadFriend: 2,          // 好友通知未读（待我同意 + 别的）
      unreadMessages: 12,       // P7 消息中心总未读（4 类合计）
      unreadByCategory: { friend: 2, challenge: 4, health: 5, system: 1 },
      isOnNearbyDiscover: false,
    },

    // 收获 · 资产（05 收获模块用）
    rewards: {
      currentTitle: '行动者',          // 当前佩戴称号（≤ 6 字）
      currentTitleSource: 'LV12 等级里程碑',
      currentFrame: '简约线框',
      currentSeasonSkin: 'default',
      titles:  { unlocked: 8,  total: 35  },
      medals:  { unlocked: 24, total: 110 },
      frames:  { unlocked: 5,  total: 12  },
      // 昨日 XP 来源明细（H1.D 用）
      yesterdayXP: [
        { source: '步数挑战完成', time: '昨日 22:14', baseXP: 30, bonusXP: 3 },
        { source: '喝水挑战完成', time: '昨日 21:50', baseXP: 20, bonusXP: 2 },
        { source: '好友点赞 ×4', time: '昨日 18:30', baseXP: 12, bonusXP: 1 },
        { source: '加入新挑战「夏日漫步 · 凉夜万步」', time: '昨日 12:00', baseXP: 10, bonusXP: 1 },
        { source: '签到', time: '昨日 09:00', baseXP: 5, bonusXP: 0 },
      ],
    },

    // 全 App 偏好 / 状态
    settings: {
      theme: 'system',          // system / light / dark
      dynamicShareScope: 'friends', // friends / friendsAndNearby / onlySelf
      practiceTimeChips: ['joined', '25', '50', '75', '100'],
      practiceShareToggle: true,
    },
  };

  /* ---------- 2. 工具：深合并 / 深拷贝 ---------- */
  function isPlainObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  }
  function deepClone(v) {
    if (Array.isArray(v)) return v.map(deepClone);
    if (isPlainObject(v)) {
      const out = {};
      for (const k in v) out[k] = deepClone(v[k]);
      return out;
    }
    return v;
  }
  function deepMerge(target, patch) {
    // 把 patch 合并进 target（mutate target）。仅深合并普通对象，数组与原始值整体覆盖。
    for (const k in patch) {
      const pv = patch[k];
      const tv = target[k];
      if (isPlainObject(pv) && isPlainObject(tv)) {
        deepMerge(tv, pv);
      } else {
        target[k] = isPlainObject(pv) ? deepClone(pv) : pv;
      }
    }
    return target;
  }

  /* ---------- 3. 存储层 ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return deepClone(DEFAULTS);
      const parsed = JSON.parse(raw);
      // schema 版本不匹配 → 用默认；可在升级时改这里走 migration
      if (!parsed || parsed.meta?.schemaVersion !== DEFAULTS.meta.schemaVersion) {
        return deepClone(DEFAULTS);
      }
      // 浅 + 深合并：把缺失字段从默认补全（向前兼容字段扩展）
      const merged = deepClone(DEFAULTS);
      deepMerge(merged, parsed);
      // 关键：meta.today / weekday 始终取最新默认值，避免演示日期穿越
      merged.meta.today = DEFAULTS.meta.today;
      merged.meta.weekday = DEFAULTS.meta.weekday;
      return merged;
    } catch (_) {
      return deepClone(DEFAULTS);
    }
  }
  function save(snap) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch (_) { /* 隐私模式 / 配额满 / iframe 跨域：静默吞掉 */ }
  }

  /* ---------- 4. 暴露 API ---------- */
  const subscribers = new Set();
  function broadcast() {
    subscribers.forEach(fn => {
      try { fn(window.MOCK_USER); } catch (e) { console.warn('[MockUser] subscriber error', e); }
    });
  }

  window.MOCK_USER = load();

  window.MockUser = {
    /** 获取当前快照（已是 window.MOCK_USER 的引用，外部尽量只读） */
    get() { return window.MOCK_USER; },

    /** 局部更新 + 持久化 + 通知订阅者
     *  示例：MockUser.patch({ ring: { batteryPct: 60 } })
     */
    patch(partial) {
      if (!isPlainObject(partial)) return;
      deepMerge(window.MOCK_USER, partial);
      save(window.MOCK_USER);
      broadcast();
    },

    /** 整体重置回默认值（开发面板用） */
    reset() {
      window.MOCK_USER = deepClone(DEFAULTS);
      save(window.MOCK_USER);
      broadcast();
    },

    /** 订阅变更，返回取消订阅函数 */
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {};
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    /** 默认值（只读用，方便取 schema 形状） */
    defaults: DEFAULTS,
  };

  /* ---------- 5. 跨标签页同步：监听 storage 事件 ---------- */
  window.addEventListener('storage', (ev) => {
    if (ev.key !== STORAGE_KEY) return;
    if (!ev.newValue) return;
    try {
      const next = JSON.parse(ev.newValue);
      if (next && next.meta?.schemaVersion === DEFAULTS.meta.schemaVersion) {
        // 用 deepMerge 覆盖现有引用，保证外部已有的 window.MOCK_USER 引用还能读到新数据
        // 先清掉旧 key（避免遗留属性）
        for (const k in window.MOCK_USER) delete window.MOCK_USER[k];
        deepMerge(window.MOCK_USER, next);
        broadcast();
      }
    } catch (_) {}
  });

  /* ---------- 6. 便捷渲染 helper：5 个模块顶栏统一调用 ----------
   * 用法（任一模块业务 JS 末尾）：
   *   MockUser.syncTopbar();           // 自动找 [data-mock] 元素填充
   *   MockUser.subscribe(MockUser.syncTopbar);  // 数据变化时自动重渲染
   *
   * 模板里加 `data-mock="profile.name"` / `data-mock="ring.battery"` 等占位即可。
   * 支持的 key（见 DEFAULTS 字段路径，常用快捷别名）：
   *   profile.name / profile.avatarLetter / profile.avatarEmoji
   *   ring.status         → 文案 "已连接 / 未连接 / 已离线"
   *   ring.battery        → "85%"
   *   ring.batteryPct     → "85"
   *   ring.statusClass    → "is-connected / is-disconnected / is-offline"（方便挂样式）
   *   level.lv / level.xp / level.stageName / level.streakDays
   */
  const RING_STATUS_TEXT = {
    connected:    '已连接',
    disconnected: '未连接',
    offline:      '已离线',
  };
  function getMockField(path) {
    const u = window.MOCK_USER;
    switch (path) {
      case 'ring.status':       return RING_STATUS_TEXT[u.ring.status] || '未连接';
      case 'ring.statusClass':  return 'is-' + u.ring.status;
      case 'ring.battery':      return u.ring.batteryPct + '%';
      default: {
        // 通用 dot path（如 profile.name / level.lv / today.metrics.steps.value）
        return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), u);
      }
    }
  }
  window.MockUser.getField = getMockField;

  window.MockUser.syncTopbar = function () {
    const u = window.MOCK_USER;

    // 1) 通用：凡是带 data-mock 属性的元素，自动填充对应字段
    document.querySelectorAll('[data-mock]').forEach(el => {
      const path = el.getAttribute('data-mock');
      const val = getMockField(path);
      if (val == null) return;
      if (el.dataset.mockMode === 'attr-style-bg') {
        el.style.background = String(val);
      } else if (el.tagName === 'IMG') {
        el.src = String(val);
      } else {
        el.textContent = String(val);
      }
    });

    // 2) 戒指标签整体颜色 class（已连接绿 / 未连接黄 / 已离线灰）
    document.querySelectorAll('[data-mock-ring-status]').forEach(el => {
      el.classList.remove('is-connected', 'is-disconnected', 'is-offline');
      el.classList.add('is-' + u.ring.status);
    });

    // 3) 电池图标内部 --battery-pct CSS 变量（驱动横向电池填充条宽度）
    document.querySelectorAll('[data-mock-battery-icon]').forEach(el => {
      el.style.setProperty('--battery-pct', u.ring.batteryPct + '%');
    });

    // 4) 消息中心未读小红点：未读 = 0 时隐藏整个徽章；否则显示数字（≥100 显示 99+）
    document.querySelectorAll('[data-mock-unread-badge]').forEach(el => {
      const count = u.social.unreadMessages || 0;
      if (count <= 0) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
        el.textContent = count >= 100 ? '99+' : String(count);
      }
    });

    // 5) 头像统一渲染：把所有 [data-mock-avatar] 的元素按头像值自动渲染
    //    支持 3 种取值：emoji 字符 / dataURL / http(s) URL / 空 → 字母占位
    document.querySelectorAll('[data-mock-avatar]').forEach(el => {
      const p = u.profile || {};
      const av = (p.avatar || p.avatarEmoji || '').trim();
      // 字母占位：优先用 schema 的 avatarLetter；缺省时从 name 首字计算（中文取汉字，英文转大写）
      const firstChar = (p.name || 'A').trim().charAt(0) || 'A';
      const isAscii = /^[\x00-\x7F]$/.test(firstChar);
      const letter = p.avatarLetter || (isAscii ? firstChar.toUpperCase() : firstChar);
      const isImage = av && (av.startsWith('data:') || /^https?:\/\//i.test(av));
      el.classList.add('mock-avatar-cell');
      // 让 flex 对齐永远生效，避免被父级 CSS 影响
      el.style.display = el.style.display || 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.overflow = 'hidden';
      if (isImage) {
        // 真人 / 自定义图：图片铺满，无底色
        el.style.background = `url("${av}") center/cover no-repeat`;
        el.style.color = 'transparent';
        el.style.fontSize = '';
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)';
        el.textContent = '';
      } else if (av) {
        // emoji 头像：白底 + 轻阴影（与各种顶栏背景都有对比）
        el.style.background = '#FFFFFF';
        el.style.color = '#141619';
        el.style.fontSize = '20px';      // emoji 字号
        el.style.lineHeight = '1';
        el.style.fontWeight = '400';
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)';
        el.textContent = av;
      } else {
        // 字母占位 + 品牌渐变背景
        el.style.background = p.avatarBg || 'linear-gradient(135deg,#6c5ce7,#a855f7)';
        el.style.color = '#fff';
        el.style.fontSize = '14px';      // 字母字号
        el.style.fontWeight = '700';
        el.style.lineHeight = '1';
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)';
        el.textContent = letter;
      }
    });
  };

  // 数据变化时自动重渲染顶栏（订阅 mock 变更）
  window.MockUser.subscribe(() => window.MockUser.syncTopbar());

  // 文档 ready 时自动跑一次（不阻塞业务 JS）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.MockUser.syncTopbar());
  } else {
    window.MockUser.syncTopbar();
  }
})();
