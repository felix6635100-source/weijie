# 唯戒 · i18n keys 字串清单（Phase 1 · 今日模块）

> 给开发对接生产环境 i18n 系统（i18next / vue-i18n / Flutter intl / iOS Localizable.strings）用。
>
> 当前阶段交付：`zh-CN.json` + `en.json`，覆盖今日模块的主要 UI。
> 后续阶段会扩到 维度 / 关心 / 收获 / 个人中心，以及 ja / vi / th 三语。

---

## 文件位置

```
APP需求原型/html/
├── i18n/
│   ├── zh-CN.json   ← 中文基准（含 __meta__）
│   └── en.json
├── i18n-loader.js   ← ~120 行原型用 loader（开发可替换为正式库）
└── 01-今日模块.html  ← 接入了 data-i18n 属性
```

## 占位符约定

- 所有变量用 `{name}` 格式：`"已完成 {current}/{goal} 步"`
- 兼容 i18next（默认 `{{var}}` 也支持 `{var}`，或自行配置 interpolation 分隔符）
- 兼容 vue-i18n（默认 `{var}` 格式直接通过）
- 兼容 Flutter intl（用 `ICU` 模式时需把 `{var}` 转换为 `{var, string, }`）

---

## 字串清单（按 namespace 分）

### `common.*` — 通用按钮

| Key | zh-CN | en | 出现位置 |
|---|---|---|---|
| `common.edit` | 编辑 | Edit | section-edit 链接（身体、今日挑战） |
| `common.done` | 完成 | Done | T5 记录编辑态 |
| `common.cancel` | 取消 | Cancel | 模态底部 |
| `common.save` | 保存 | Save | 模态底部 |
| `common.confirm` | 确认 | Confirm | T7 picker |
| `common.ok` | 好的 | OK | toast 消息 |
| `common.close` | 关闭 | Close | × 按钮 aria |
| `common.more` | 更多 | More | - |
| `common.viewAll` | 查看全部 | View all | - |

### `nav.*` — 底部 tab 标签

| Key | zh-CN | en | 出现位置 |
|---|---|---|---|
| `nav.today` | 今日 | Today | topbar 标题 + 底部 tab |
| `nav.level` | 维度 | Level | 底部 tab |
| `nav.care` | 关心 | Care | 底部 tab |
| `nav.harvest` | 收获 | Harvest | 底部 tab |

### `ringStatus.*` — 戒指状态标签

| Key | zh-CN | en | 出现位置 |
|---|---|---|---|
| `ringStatus.connected` | 已连接 | Connected | topbar ring-tag |
| `ringStatus.disconnected` | 未连接 | Disconnected | topbar 状态切换后 |
| `ringStatus.offline` | 已离线 | Offline | topbar 状态切换后 |
| `ringStatus.lowBattery` | 低电量 | Low battery | topbar 状态切换后 |

### `rings3.*` — 三环卡（含氛围语 + Day 称号）

| Key | zh-CN | en | 出现位置 |
|---|---|---|---|
| `rings3.habit.label` | 习惯 | Habits | 图例 |
| `rings3.habit.subtitle` | 持之以恒 | Stay consistent | 图例副标题 |
| `rings3.care.label` | 关心 | Care | 图例 |
| `rings3.care.subtitle` | 心意相通 | Stay connected | 图例副标题 |
| `rings3.growth.label` | 成长 | Growth | 图例 |
| `rings3.growth.subtitle` | 成长跃迁 | Level up | 图例副标题 |
| `rings3.summary.empty` | 未显示任何圆环 | No rings shown | 氛围语·空态 |
| `rings3.summary.startSingle` | 今日的圆环交给你 | Light up your first ring today | N=1 起步 |
| `rings3.summary.startMulti` | 今日的第一环交给你 | Light up your first ring today | N≥2 起步 |
| `rings3.summary.fullSingle` | 圆环全亮，今日满级 | Ring complete — Today's done! | N=1 全亮 |
| `rings3.summary.fullDouble` | 双环全亮，今日满级 | Both rings complete — Today's done! | N=2 全亮 |
| `rings3.summary.fullTriple` | 三环全亮，今日满级 | All three rings complete — Today's done! | N=3 全亮 |
| `rings3.summary.almostGold` | 离金牌只差最后一环 | One ring away from gold | 差最后一环升金 |
| `rings3.summary.midSilver` | 再添一环就能升银 | One more ring to reach silver | N=3 的 1/3 中间档 |
| `rings3.dayTitle.nice` | Nice Day | Nice Day | 铜档 |
| `rings3.dayTitle.great` | Great Day | Great Day | 银档 |
| `rings3.dayTitle.perfect` | Perfect Day | Perfect Day | 金档 |

### `section.*` — 区段标题

| Key | zh-CN | en | 出现位置 |
|---|---|---|---|
| `section.body` | 身体 | Body | C3 身体指标卡 |
| `section.challenges` | 今日挑战 | Today's Challenges | C4 7 张挑战卡 |

### `metric.*` — 身体指标卡（占位，未来阶段接入）

预留 key，下一阶段再接入 DOM：

| Key | zh-CN | en |
|---|---|---|
| `metric.btnMeasure` | 手动测量 | Measure |
| `metric.btnStart` | 开始测量 | Start measuring |
| `metric.lastMeasured` | 刚刚 · {time} | Just now · {time} |
| `metric.rangeNormal` | 正常范围 {min}-{max} | Normal range {min}-{max} |
| `metric.rangeToday` | 今日范围 {min}-{max} {unit} | Today's range {min}-{max} {unit} |
| `metric.status.good` | 良好 | Good |
| `metric.status.normal` | 正常 | Normal |
| `metric.status.low` | 偏低 | Low |
| `metric.status.high` | 偏高 | High |
| `metric.status.lightFatigue` | 轻度疲劳 | Light fatigue |
| `metric.stressOk` | 心理压力正常 | Stress level normal |

### `habit.*.name` + `chip` + `desc` — 7 张挑战卡

```
walk / sleep / burn / water / stand / run / medicine
```

每张卡 4 个 key：

| 子 key | 用途 | 占位符 |
|---|---|---|
| `habit.{slug}.name` | 卡片标题（如"走路"） | – |
| `habit.{slug}.chip` | 目标 chip（如"10000 步目标"） | `{goal}` |
| `habit.{slug}.xpLabel` | XP 徽章（如"+30 XP"） | – |
| `habit.{slug}.desc` | 卡片描述（含进度 + Wellness 鼓励） | `{current}` `{goal}` `{remain}` |

> ⚠️ 当前阶段只接入了 `name`。`chip` / `desc` 是动态生成的，下一阶段在 JS 渲染器里接入 `t()` 调用。

### `social.*` — 卡片底部点赞 / 评论

| Key | zh-CN | en | 出现位置 |
|---|---|---|---|
| `social.likedBy` | {names} 等{count}个赞 | {names} and {count} others liked | 挑战卡 social 行 |
| `social.comment` | 评论 | Comment | 评论按钮 |
| `social.likeAria` | 点赞 / 取消点赞 | Like / Unlike | 点赞 ♥ aria-label |
| `social.commentAria` | 评论 | Comment | 评论 aria-label |

---

## DOM 标记规范（开发对照用）

| 用法 | 例子 |
|---|---|
| **简单文本替换** | `<div data-i18n="nav.today">今日</div>` |
| **HTML 内容**（含 `<b>` 等） | `<div data-i18n-html="habit.walk.desc"></div>` |
| **属性翻译** | `<button data-i18n-attr="aria-label:metric.btnMeasure">+</button>` |
| **多属性** | `data-i18n-attr="title:nav.today,aria-label:nav.today"` |
| **JS 动态构造** | `el.textContent = t('habit.walk.chip', { goal: 10000 })` |

---

## 切换语言

### 用户交互

顶栏 `🌐 中` / `🌐 EN` 按钮 → 下拉菜单选语言 → 立即生效 + 写入 `localStorage.weijie_lang`

### JS API（loader 提供）

```js
window.setLang('en')          // 异步加载 + 重渲所有 [data-i18n]
window.t('habit.walk.name')   // 查表
window.t('habit.walk.chip', { goal: 10000 })  // 带占位符
window.onLangChange(lang => { ... })  // 订阅语言切换事件
```

---

## 后续阶段计划

| 阶段 | 范围 | 状态 |
|---|---|---|
| 1️⃣ 试点 | 今日模块 · zh + en | ✅ 已交付 |
| 2️⃣ 主体 | 维度 / 关心 / 收获 / 个人中心 · zh + en | ⏳ 待启动 |
| 3️⃣ 补语言 | ja + vi + th 三语扩充 | ⏳ 翻译公司报价后启动 |
| 4️⃣ 动态文案接入 | 7 张挑战卡 desc + 三环氛围语 + tier 提示带 · 改 JS 渲染器走 `t()` | ⏳ 在阶段 2 同步做 |

---

## 给开发的交付物

1. **`i18n/*.json`** ×N 种语言 → 直接喂给生产 i18n 库
2. **本文档** (`i18n-keys-glossary.md`) → key 用途、出现位置、占位符约定
3. **`挑战目标档位文案.md`** → 6 挑战的 4 档收益提示文案（picker 用）
4. **`Sheet_20260610.csv`** → CSV 来自医疗合规审查，列出哪些原始文案是高风险表达 + 改写后的 Wellness 风格

如需扩展 key 命名规范、JSON 嵌套深度调整、或换成 flat keys 形式，告诉我，可以直接出脚本批量转换。
