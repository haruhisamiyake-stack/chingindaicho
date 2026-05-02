import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

n = '\xa0'
# Indentation levels (confirmed from debug output):
# if line:         \xa0
# block body:      \xa0\xa0
# forEach inner:   \xa0\xa0\xa0
# return props:    \xa0\xa0\xa0
# closing };:      \xa0\xa0
# closing }:       \xa0

i1 = n + ' '       # \xa0<space>
i2 = n + n + ' '   # \xa0\xa0<space>
i3 = n + n + n + ' '  # \xa0\xa0\xa0<space>

old = (
    f"{i1}if (stdAmountMissing) {{\n"
    f"{i2}calcLog.push(`⚠ 標準報酬月額が未入力です。社会保険料・所得税の計算をブロックします。`);\n"
    f"{i2}calcLog.push(`※ 雇用保険のみ計算します。社保・所得税は未計算のため以下の金額は参考値です。`);\n"
    f"{i2}const residentTax = Number(row.residentTax) || 0;\n"
    f"{i2}let totalCustomDeds = 0;\n"
    f"{i2}deductionDefs.forEach((def) => {{\n"
    f"{i3}const amt = Number(row.deductionAmounts?.[def.id]) || 0;\n"
    f"{i3}totalCustomDeds += amt;\n"
    f"{i2}}});\n"
    f"{i2}const socialTotal = employment;\n"
    f"{i2}const totalDeductions = socialTotal + residentTax + totalCustomDeds;\n"
    f"{i2}const netPay = grossPay - totalDeductions;\n"
    f"{i2}return {{\n"
    f"{i3}...row,\n"
    f"{i3}grossPay,\n"
    f"{i3}health: 0,\n"
    f"{i3}pension: 0,\n"
    f"{i3}nursing: 0,\n"
    f"{i3}childCare: 0,\n"
    f"{i3}employment,\n"
    f"{i3}incomeTax: null,\n"
    f'{i3}taxWarning: "標準報酬月額が未入力です",\n'
    f"{i3}isBlocking: true,\n"
    f"{i3}netPay,\n"
    f"{i3}socialTotal,\n"
    f"{i3}estStdAmount,\n"
    f"{i3}totalCustomDeds,\n"
    f"{i3}totalDeductions,\n"
    f"{i3}calcLog,\n"
    f"{i2}}};\n"
    f"{i1}}}"
)

new = (
    f"{i1}if (stdAmountMissing) {{\n"
    f"{i2}calcLog.push(`⚠ 標準報酬月額が未入力です。社会保険料・所得税の計算を中断します。`);\n"
    f"{i2}return {{\n"
    f"{i3}...row,\n"
    f"{i3}grossPay,\n"
    f"{i3}health: 0,\n"
    f"{i3}pension: 0,\n"
    f"{i3}nursing: 0,\n"
    f"{i3}childCare: 0,\n"
    f"{i3}employment,\n"
    f"{i3}incomeTax: null,\n"
    f'{i3}taxWarning: "標準報酬月額が未入力です",\n'
    f"{i3}isBlocking: true,\n"
    f"{i3}netPay: null,\n"
    f"{i3}socialTotal: null,\n"
    f"{i3}estStdAmount,\n"
    f"{i3}totalCustomDeds: null,\n"
    f"{i3}totalDeductions: null,\n"
    f"{i3}calcLog,\n"
    f"{i2}}};\n"
    f"{i1}}}"
)

if old in content:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    sys.stdout.buffer.write("OK: block replaced\n".encode("utf-8"))
else:
    sys.stdout.buffer.write("ERROR: old string not found\n".encode("utf-8"))
