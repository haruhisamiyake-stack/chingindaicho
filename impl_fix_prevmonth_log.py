import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

nb = '\xa0'
results = []

old = (
    nb + ' if (prevMonthResult.isBlocking || prevMonthResult.socialTotal === null) {\n' +
    nb + ' ' + nb + ' return {\n' +
    nb + ' ' + nb + ' ' + nb + ' basePay: Number(b.basePay) || 0,\n'
)
new = (
    nb + ' if (prevMonthResult.isBlocking || prevMonthResult.socialTotal === null) {\n' +
    nb + ' ' + nb + ' calcLog.push("⚠ 前月給与の社保控除後金額が計算不可のため、賞与所得税の計算を中断しました。");\n' +
    nb + ' ' + nb + ' return {\n' +
    nb + ' ' + nb + ' ' + nb + ' basePay: Number(b.basePay) || 0,\n'
)

if old in content:
    content = content.replace(old, new, 1)
    results.append("OK: calcLog.push added before prevMonthResult early return")
else:
    results.append("ERROR: prevMonthResult early return anchor not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

for r in results:
    sys.stdout.buffer.write((r + "\n").encode("utf-8"))
