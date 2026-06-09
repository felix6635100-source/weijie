#!/bin/bash
# 唯戒 APP · 一期封板功能清单 · 颜色刷新脚本
# 用法：双击本文件即可（macOS）
# 作用：F 列「一期实现」和 G 列「当前实现情况」各自独立按自己的值染色
#   是 → 绿  ｜  否 → 红  ｜  部分 → 蓝  ｜  待定 → 黄  ｜  空 → 清空

cd "$(dirname "$0")"
XLSX="2026-06-02-唯戒APP一期封板功能清单.xlsx"

if [ ! -f "$XLSX" ]; then
  echo "❌ 没找到文件：$XLSX"
  echo "   请把本脚本放在和 xlsx 同一个目录"
  read -n 1 -s -r -p "按任意键关闭..."
  exit 1
fi

python3 - <<PYEOF
from openpyxl import load_workbook
from openpyxl.styles import PatternFill

xlsx = "$XLSX"
wb = load_workbook(xlsx)
ws = wb["一期封板·功能清单"]

COLORS = {
    "是":  "D1FAE5",   # 绿
    "否":  "FECACA",   # 红
    "待定": "FEF9C3",   # 黄
    "部分": "BFDBFE",   # 蓝
}
NONE = PatternFill(fill_type=None)

def fill_for(val):
    val = (val or "").strip()
    if val in COLORS:
        return PatternFill("solid", fgColor=COLORS[val]), val
    return NONE, ("空" if val == "" else "其它")

stats_f = {"是":0,"否":0,"待定":0,"部分":0,"空":0,"其它":0}
stats_g = {"是":0,"否":0,"待定":0,"部分":0,"空":0,"其它":0}

for row in range(3, ws.max_row + 1):
    # F 列「一期实现」独立染色
    f_fill, f_key = fill_for(ws.cell(row=row, column=6).value)
    ws.cell(row=row, column=6).fill = f_fill
    stats_f[f_key] += 1

    # G 列「当前实现情况」按自己的值独立染色（不跟随 F）
    g_fill, g_key = fill_for(ws.cell(row=row, column=7).value)
    ws.cell(row=row, column=7).fill = g_fill
    stats_g[g_key] += 1

wb.save(xlsx)

print(f"✓ 已刷新 {ws.max_row - 2} 行")
print(f"  F 列「一期实现」:    是 {stats_f['是']} ｜ 否 {stats_f['否']} ｜ 部分 {stats_f['部分']} ｜ 待定 {stats_f['待定']} ｜ 空 {stats_f['空']}")
print(f"  G 列「当前实现情况」: 是 {stats_g['是']} ｜ 否 {stats_g['否']} ｜ 部分 {stats_g['部分']} ｜ 待定 {stats_g['待定']} ｜ 空 {stats_g['空']}")
if stats_f["其它"] or stats_g["其它"]:
    print(f"  ⚠ 异常值：F {stats_f['其它']} 行 / G {stats_g['其它']} 行（填了不在下拉里的内容）")
PYEOF

echo
read -n 1 -s -r -p "按任意键关闭..."
