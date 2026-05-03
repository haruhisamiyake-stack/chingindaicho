#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Replace calculateBonusResult body.
Extracts Japanese strings from old body; constructs all calcLog lines explicitly.
"""

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "r", encoding="utf-8", newline="") as f:
    text = f.read()

NB = " "  # non-breaking space
I1 = NB + " "
I2 = NB + " " + NB + " "
I3 = NB + " " + NB + " " + NB + " "
NL = "\r\n"

# ── locate old body ──────────────────────────────────────────────────────────
OPEN_MARK = "}) => {\r\n" + I1 + "if (!master || !bonusRow || !yearData) return {};"
CLOSE_MARK = "\r\n\r\nconst createInitialYearData"

start = text.find(OPEN_MARK)
assert start != -1, "OPEN_MARK not found"
end = text.find(CLOSE_MARK, start)
assert end != -1, "CLOSE_MARK not found"

old = text[start:end]
print(f"Old body: {len(old)} chars")

# ── helpers to extract Japanese template-literal content ─────────────────────
def get_template(fragment):
    """Get the content between backticks of the calcLog.push that contains fragment."""
    idx = old.find(fragment)
    assert idx != -1, f"MISSING: {fragment!r}"
    bt0 = old.rfind("`", 0, idx) + 1
    bt1 = old.find("`", idx)
    return old[bt0:bt1]

def get_str_value(fragment):
    """Get the content between double-quotes containing fragment."""
    idx = old.find(fragment)
    assert idx != -1, f"MISSING: {fragment!r}"
    q0 = old.rfind('"', 0, idx) + 1
    q1 = old.find('"', idx)
    return old[q0:q1]

def get_array_str(fragment):
    """Get content of first string in array literal containing fragment."""
    idx = old.find(fragment)
    assert idx != -1, f"MISSING: {fragment!r}"
    q0 = old.rfind('"', 0, idx) + 1
    q1 = old.find('"', idx)
    return old[q0:q1]

def sub(s):
    """Apply variable renaming substitutions."""
    return (s
        .replace("(bonusStdRaw)",     "(logData.bonusStdRaw)")
        .replace("(healthBonusStd)",  "(logData.healthBonusStd)")
        .replace("(pensionBonusStd)", "(logData.pensionBonusStd)")
        .replace("(bHealth)",         "(logData.health)")
        .replace("(bNursing)",        "(logData.nursing)")
        .replace("(bPension)",        "(logData.pension)")
        .replace("(bChildCare)",      "(logData.childCare)")
        .replace("(bEmp)",            "(logData.employment)")
        .replace("(bSocialTotal)",    "(logData.socialTotal)")
        .replace("(bGross)",          "(logData.grossPay)")
        .replace("(bIncomeTax)",      "(coreResult.incomeTax)")
        .replace("(bResidentTax)",    "(coreResult.residentTax)")
        .replace("bTotalDeductions === null", "coreResult.totalDeductions === null")
        .replace("(bTotalDeductions)", "(coreResult.totalDeductions)")
        .replace("bNetPay === null",  "coreResult.netPay === null")
        .replace("(bNetPay)",         "(coreResult.netPay)")
    )

def push(indent, fragment):
    """Build a calcLog.push line using the template content from old body."""
    return indent + "calcLog.push(`" + sub(get_template(fragment)) + "`);"

# ── extract lock block (verbatim) ─────────────────────────────────────────────
lock_s = old.find(I1 + "if (monthlyLocks")
lock_e = old.find(NL + I1 + "const b = bonusRow")
lock_block = old[lock_s:lock_e]

# ── extract rate block (rename bhRate→hRate etc) ──────────────────────────────
rate_s = old.find(I1 + "const lastMonthRow")
rate_e = old.find(NL + I1 + "const hasHealth")
rate_block = (old[rate_s:rate_e]
    .replace("const bhRate", "const hRate")
    .replace("const bpRate", "const pRate")
    .replace("const bnRate", "const nRate")
    .replace("const bcRate", "const cRate")
    .replace("const beRate", "const eRate")
)

# ── extract flags block (hasHealth/hasPension/hasEmployment/hasNursing only) ──
flags_s = old.find(I1 + "const hasHealth")
# stop right at end of the hasNursing line
has_nursing_pos = old.find(I1 + "const hasNursing", flags_s)
flags_e = old.find(NL, has_nursing_pos) + 1  # include the line but not what follows
flags_block = old[flags_s:flags_e].rstrip(NL)

# ── extract prevMonth block ───────────────────────────────────────────────────
prev_s = old.find(I1 + "let prevMonthKey")
prev_e = old.find(NL + I1 + "if (!prevMonthResult")
prev_block = old[prev_s:prev_e]

# ── individual Japanese strings ───────────────────────────────────────────────
S_calclog_hdr    = get_array_str("【賞与 計算ログ】")
S_lock_msg       = get_str_value("この月は全体ロック済です")
S_lock_skip      = get_array_str("スキップ")
S_bonus_base_tpl = get_template("賞与基本額")
S_allowance_tpl  = get_template("手当(${def.name})")
S_gross_tpl      = sub(get_template("賞与総支給額"))
S_soc_hdr_tpl    = get_template("社会保険料（累計上限判定）")
S_std_raw_tpl    = sub(get_template("賞与額(千円未満切捨)"))
S_manual_prior   = get_template("他月分(手入力)")
S_b1std          = get_template("同一年度内")
S_prior_total    = get_template("適用前の標準賞与額累計")
S_health_std     = sub(get_template("上限残枠判定結果"))   # 健保 上限残枠判定結果
S_pension_std    = sub(get_template("150万円上限判定結果"))  # 厚年 150万円上限判定結果
S_hlth_ins       = sub(get_template("健康保険料"))
S_pens_ins       = sub(get_template("厚生年金料"))
S_nurs_ins       = sub(get_template("介護保険料"))
S_child_care     = sub(get_template("子ども・"))
S_emp_ins        = sub(get_template("雇用保険料"))
S_soc_total      = sub(get_template("社会保険料合計"))
S_prev_warn      = get_str_value("⚠")
S_taxwarn_prev   = get_str_value("前月給与の社保")
S_manual_used    = sub(get_template("手入力値"))
S_res_tax        = sub(get_template("住民税"))
S_ded_item       = get_template("控除(${def.name})")
S_result_hdr     = sub(get_template("【支給結果】"))
S_ded_total      = sub(get_template("控除合計"))
S_net_pay        = sub(get_template("差引支給額"))

def clog(indent, s):
    return indent + 'calcLog.push(`' + s + '`);'

# ── build new body ────────────────────────────────────────────────────────────
lines = []
A = lines.append
def ln(indent, code): A(indent + code)

A("}) => {")
ln(I1, "if (!master || !bonusRow || !yearData) return {};")
ln(I1, "const _lockYear = normalizeYear(yearStr);")
A(lock_block)
ln(I1, "const b = bonusRow;")
ln(I1, 'const calcLog = ["' + S_calclog_hdr + '"];')
ln(I1, "const bAllowances = {};")
ln(I1, "const bDeductions = {};")
A("")
A(clog(I1, S_bonus_base_tpl))
ln(I1, "const allowanceAmounts = [];")
ln(I1, "allowanceDefs.forEach((def) => {")
ln(I2, "const amt = Number(b.allowanceAmounts?.[def.id]) || 0;")
ln(I2, "bAllowances[def.id] = amt;")
ln(I2, "allowanceAmounts.push({ amount: amt, isTaxable: def.isTaxable, isSocialIns: true, isEmploymentIns: true });")
ln(I2, "if (amt > 0) " + 'calcLog.push(`' + S_allowance_tpl + '`);')
ln(I1, "});")
A("")
ln(I1, "const deductionAmounts = [];")
ln(I1, "deductionDefs.forEach((def) => {")
ln(I2, "const amt = Number(b.deductionAmounts?.[def.id]) || 0;")
ln(I2, "bDeductions[def.id] = amt;")
ln(I2, "deductionAmounts.push({ amount: amt });")
ln(I1, "});")
A("")
A(rate_block)
A("")
A(flags_block)
A("")
ln(I1, "const manualPriorStd = Number(b.manualPriorHealthStd) || 0;")
ln(I1, "let priorHealthBonusStdTotal = manualPriorStd;")
ln(I1, "let b1Std = 0;")
ln(I1, 'if (bonusKey === "bonus2" && yearData.bonus) {')
ln(I2, "let b1TotalAllowances = 0;")
ln(I2, "allowanceDefs.forEach((def) => {")
ln(I3, "b1TotalAllowances += Number(yearData.bonus.allowanceAmounts?.[def.id]) || 0;")
ln(I2, "});")
ln(I2, "const b1Gross = (Number(yearData.bonus.basePay) || 0) + b1TotalAllowances;")
ln(I2, "b1Std = Math.min(Math.floor(b1Gross / 1000) * 1000, 5730000);")
ln(I2, "priorHealthBonusStdTotal += b1Std;")
ln(I1, "}")
A("")
A(prev_block)
ln(I1, "if (!prevMonthResult || prevMonthResult.calcSuccess !== true) {")
ln(I2, 'calcLog.push("' + S_prev_warn + '");')
ln(I2, "const bGross = (Number(b.basePay) || 0) + allowanceAmounts.reduce((s, a) => s + a.amount, 0);")
ln(I2, "return {")
ln(I3, "basePay: Number(b.basePay) || 0,")
ln(I3, "grossPay: bGross,")
ln(I3, "health: null, pension: null, nursing: null, childCare: null,")
ln(I3, "employment: null, socialTotal: null,")
ln(I3, "incomeTax: null, totalDeductions: null, netPay: null,")
ln(I3, "isBlocking: true,")
ln(I3, 'taxWarning: "' + S_taxwarn_prev + '",')
ln(I3, "calcLog,")
ln(I2, "};")
ln(I1, "}")
ln(I1, "const lastMonthSalaryAfterSocial = Math.max(0, prevTaxableGross - prevMonthResult.socialTotal);")
A("")
ln(I1, "const bResidentTax = Number(b.residentTax) || 0;")
ln(I1, "const core = calculateBonusCore({")
ln(I2, "basePay: Number(b.basePay) || 0,")
ln(I2, "allowanceAmounts,")
ln(I2, "deductionAmounts,")
ln(I2, "residentTax: bResidentTax,")
ln(I2, "rates: { health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate },")
ln(I2, "flags: { hasHealth, hasPension, hasNursing, hasEmployment },")
ln(I2, "tax: { manualIncomeTax: Number(b.incomeTax) || 0, master, settings, yearStr, taxTables },")
ln(I2, "ins: { priorHealthBonusStdTotal, lastMonthSalaryAfterSocial },")
ln(I1, "});")
A("")
ln(I1, "const { result: coreResult, debug: logData, error } = core;")
A("")
ln(I1, "const buildStdLog = () => {")
A(clog(I2, S_soc_hdr_tpl))
A(clog(I2, S_std_raw_tpl))
ln(I2, "if (manualPriorStd > 0)")
A(clog(I3, S_manual_prior))
ln(I2, "if (b1Std > 0)")
A(clog(I3, S_b1std))
ln(I2, "if (priorHealthBonusStdTotal > 0)")
A(clog(I3, S_prior_total))
A(clog(I2, S_health_std))
A(clog(I2, S_pension_std))
A(clog(I2, S_hlth_ins))
A(clog(I2, S_pens_ins))
ln(I2, "if (logData.nursing > 0)")
A(clog(I3, S_nurs_ins))
ln(I2, "if (logData.childCare > 0)")
A(clog(I3, S_child_care))
A(clog(I2, S_emp_ins))
A(clog(I2, S_soc_total))
ln(I1, "};")
A("")
A(clog(I1, S_gross_tpl))
ln(I1, "buildStdLog();")
ln(I1, "if (logData.incomeTaxResultLog) calcLog.push(...logData.incomeTaxResultLog);")
A("")
ln(I1, 'if (error === "incomeTaxNull") {')
ln(I2, "return {")
ln(I3, "basePay: Number(b.basePay) || 0,")
ln(I3, "grossPay: logData.grossPay,")
ln(I3, "health: null, pension: null, nursing: null, childCare: null,")
ln(I3, "employment: null, socialTotal: null,")
ln(I3, "incomeTax: null, totalDeductions: null, netPay: null,")
ln(I3, "isBlocking: true,")
ln(I3, "taxWarning: logData.taxWarning,")
ln(I3, "calcLog,")
ln(I2, "};")
ln(I1, "}")
A("")
ln(I1, "if (logData.manualRequired && coreResult.incomeTax !== null)")
A(clog(I2, S_manual_used))
ln(I1, "if (coreResult.residentTax > 0)")
A(clog(I2, S_res_tax))
ln(I1, "deductionDefs.forEach((def) => {")
ln(I2, "const amt = bDeductions[def.id];")
ln(I2, "if (amt > 0) " + 'calcLog.push(`' + S_ded_item + '`);')
ln(I1, "});")
A(clog(I1, S_result_hdr))
A(clog(I1, S_ded_total))
A(clog(I1, S_net_pay))
A("")
ln(I1, "return {")
ln(I2, "basePay: Number(b.basePay) || 0,")
ln(I2, "...coreResult,")
ln(I2, "allowances: bAllowances,")
ln(I2, "deductions: bDeductions,")
ln(I2, "calcLog,")
ln(I1, "};")
A("};")

new_body = NL.join(lines)
print(f"New body: {len(new_body)} chars")

# Verify old body appears exactly once
if text.count(old) != 1:
    raise ValueError(f"old body appears {text.count(old)} times")

new_text = text.replace(old, new_body, 1)

with open(TARGET, "w", encoding="utf-8", newline="") as f:
    f.write(new_text)

print("Done.")
