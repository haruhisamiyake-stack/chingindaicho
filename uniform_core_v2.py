#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unify calculateMonthlyCore return structure to { result, error, debug }.
Corrected version with proper NBSP indentation bytes.
"""

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "rb") as f:
    data = f.read()

original_size = len(data)

NB = b"\xc2\xa0"   # NBSP (2 bytes)
SP = b" "
I1 = NB + SP
I2 = NB + SP + NB + SP
I3 = NB + SP + NB + SP + NB + SP
I4 = NB + SP + NB + SP + NB + SP + NB + SP

STD_MSG = b"\xe6\xa8\x99\xe6\xba\x96\xe5\xa0\xb1\xe9\x85\xac\xe6\x9c\x88\xe9\xa1\x8d\xe3\x81\x8c\xe6\x9c\xaa\xe5\x85\xa5\xe5\x8a\x9b\xe3\x81\xa7\xe3\x81\x99"
TAX_MSG = b"\xe8\xa8\x88\xe7\xae\x97\xe6\x9d\xa1\xe4\xbb\xb6\xe4\xb8\x8d\xe8\xb6\xb3\xe3\x81\xae\xe3\x81\x9f\xe3\x82\x81\xe5\x87\xa6\xe7\x90\x86\xe3\x82\x92\xe4\xb8\xad\xe6\x96\xad\xe3\x81\x97\xe3\x81\xbe\xe3\x81\x97\xe3\x81\x9f"
GROSS = b"\xe7\xb7\x8f\xe6\x94\xaf\xe7\xb5\xa6\xe9\xa1\x8d"
EN    = b"\xe5\x86\x86"

replacements = 0

def replace_once(data, old, new, label):
    count = data.count(old)
    if count != 1:
        raise ValueError(f"{label}: found {count} times (expected 1)")
    return data.replace(old, new, 1)

# ---- 1. stdAmountMissing: { result: null, error, debug } ----
OLD1 = (
    I1 + b"if (stdAmountMissing) {\r\n"
    + I2 + b"return {\r\n"
    + I3 + b"grossPay,\r\n"
    + I3 + b"health: null,\r\n"
    + I3 + b"pension: null,\r\n"
    + I3 + b"nursing: null,\r\n"
    + I3 + b"childCare: null,\r\n"
    + I3 + b"employment: null,\r\n"
    + I3 + b"incomeTax: null,\r\n"
    + I3 + b"taxWarning: \"" + STD_MSG + b"\",\r\n"
    + I3 + b"isBlocking: true,\r\n"
    + I3 + b"netPay: null,\r\n"
    + I3 + b"socialTotal: null,\r\n"
    + I3 + b"estStdAmount,\r\n"
    + I3 + b"totalCustomDeds: null,\r\n"
    + I3 + b"totalDeductions: null,\r\n"
    + I3 + b"calcSuccess: false,\r\n"
    + I3 + b"_logData: {\r\n"
    + I4 + b"status: \"stdAmountMissing\",\r\n"
    + I4 + b"allowanceAmounts,\r\n"
    + I4 + b"socialInsGross,\r\n"
    + I4 + b"stdAmount,\r\n"
    + I4 + b"hRate, pRate, nRate, cRate, eRate,\r\n"
    + I3 + b"},\r\n"
    + I2 + b"};\r\n"
    + I1 + b"}"
)
NEW1 = (
    I1 + b"if (stdAmountMissing) {\r\n"
    + I2 + b"return {\r\n"
    + I3 + b"result: null,\r\n"
    + I3 + b"error: \"stdAmountMissing\",\r\n"
    + I3 + b"debug: {\r\n"
    + I4 + b"status: \"stdAmountMissing\",\r\n"
    + I4 + b"grossPay,\r\n"
    + I4 + b"allowanceAmounts,\r\n"
    + I4 + b"socialInsGross,\r\n"
    + I4 + b"stdAmount,\r\n"
    + I4 + b"hRate, pRate, nRate, cRate, eRate,\r\n"
    + I3 + b"},\r\n"
    + I2 + b"};\r\n"
    + I1 + b"}"
)
data = replace_once(data, OLD1, NEW1, "stdAmountMissing block")
replacements += 1
print("[1] stdAmountMissing: result:null, error:code")

# ---- 2. incomeTaxNull: { result: null, error, debug } ----
OLD2 = (
    I2 + b"return {\r\n"
    + I3 + b"grossPay,\r\n"
    + I3 + b"health: null, pension: null, nursing: null, childCare: null,\r\n"
    + I3 + b"employment: null, socialTotal: null,\r\n"
    + I3 + b"incomeTax: null, totalDeductions: null, netPay: null,\r\n"
    + I3 + b"isBlocking: true,\r\n"
    + I3 + b"taxWarning: \"" + TAX_MSG + b"\",\r\n"
    + I3 + b"calcSuccess: false,\r\n"
    + I3 + b"_logData: {\r\n"
    + I4 + b"status: \"incomeTaxNull\",\r\n"
    + I4 + b"allowanceAmounts,\r\n"
    + I4 + b"socialInsGross,\r\n"
    + I4 + b"employmentInsGross,\r\n"
    + I4 + b"stdAmount,\r\n"
    + I4 + b"hRate, pRate, nRate, cRate, eRate,\r\n"
    + I4 + b"ins, employment, socialTotal,\r\n"
    + I4 + b"gradeInfo,\r\n"
    + I4 + b"incomeTaxResultLog,\r\n"
    + I3 + b"},\r\n"
    + I2 + b"};\r\n"
    + I1 + b"}"
)
NEW2 = (
    I2 + b"return {\r\n"
    + I3 + b"result: null,\r\n"
    + I3 + b"error: \"incomeTaxNull\",\r\n"
    + I3 + b"debug: {\r\n"
    + I4 + b"status: \"incomeTaxNull\",\r\n"
    + I4 + b"grossPay,\r\n"
    + I4 + b"allowanceAmounts,\r\n"
    + I4 + b"socialInsGross,\r\n"
    + I4 + b"employmentInsGross,\r\n"
    + I4 + b"stdAmount,\r\n"
    + I4 + b"hRate, pRate, nRate, cRate, eRate,\r\n"
    + I4 + b"ins, employment, socialTotal,\r\n"
    + I4 + b"gradeInfo,\r\n"
    + I4 + b"incomeTaxResultLog,\r\n"
    + I3 + b"},\r\n"
    + I2 + b"};\r\n"
    + I1 + b"}"
)
data = replace_once(data, OLD2, NEW2, "incomeTaxNull block")
replacements += 1
print("[2] incomeTaxNull: result:null, error:code")

# ---- 3. success return: add result wrapper + error: null ----
OLD3 = (
    b"\r\n" + I1 + b"return {\r\n"
    + I2 + b"grossPay,\r\n"
    + I2 + b"health: ins.health,\r\n"
    + I2 + b"pension: ins.pension,\r\n"
    + I2 + b"nursing: ins.nursing,\r\n"
    + I2 + b"childCare: ins.childCare,\r\n"
    + I2 + b"employment,\r\n"
    + I2 + b"incomeTax: incomeTax,\r\n"
    + I2 + b"taxWarning: taxWarning,\r\n"
    + I2 + b"isBlocking: isBlocking || incomeTax === null,\r\n"
    + I2 + b"socialTotal,\r\n"
    + I2 + b"estStdAmount: estStdAmount,\r\n"
    + I2 + b"totalCustomDeds,\r\n"
    + I2 + b"calcSuccess: true,\r\n"
    + I2 + b"_logData: {\r\n"
    + I3 + b"status: \"success\",\r\n"
    + I3 + b"allowanceAmounts,\r\n"
    + I3 + b"deductionAmounts,\r\n"
    + I3 + b"socialInsGross,\r\n"
    + I3 + b"employmentInsGross,\r\n"
    + I3 + b"stdAmount,\r\n"
    + I3 + b"hRate, pRate, nRate, cRate, eRate,\r\n"
    + I3 + b"ins, employment, socialTotal,\r\n"
    + I3 + b"gradeInfo,\r\n"
    + I3 + b"incomeTaxResultLog,\r\n"
    + I2 + b"},\r\n"
    + I1 + b"};\r\n"
    + b"};"
)
NEW3 = (
    b"\r\n" + I1 + b"return {\r\n"
    + I2 + b"result: {\r\n"
    + I3 + b"grossPay,\r\n"
    + I3 + b"health: ins.health,\r\n"
    + I3 + b"pension: ins.pension,\r\n"
    + I3 + b"nursing: ins.nursing,\r\n"
    + I3 + b"childCare: ins.childCare,\r\n"
    + I3 + b"employment,\r\n"
    + I3 + b"incomeTax: incomeTax,\r\n"
    + I3 + b"taxWarning: taxWarning,\r\n"
    + I3 + b"isBlocking: isBlocking || incomeTax === null,\r\n"
    + I3 + b"socialTotal,\r\n"
    + I3 + b"estStdAmount: estStdAmount,\r\n"
    + I3 + b"totalCustomDeds,\r\n"
    + I3 + b"calcSuccess: true,\r\n"
    + I2 + b"},\r\n"
    + I2 + b"error: null,\r\n"
    + I2 + b"debug: {\r\n"
    + I3 + b"status: \"success\",\r\n"
    + I3 + b"allowanceAmounts,\r\n"
    + I3 + b"deductionAmounts,\r\n"
    + I3 + b"socialInsGross,\r\n"
    + I3 + b"employmentInsGross,\r\n"
    + I3 + b"stdAmount,\r\n"
    + I3 + b"hRate, pRate, nRate, cRate, eRate,\r\n"
    + I3 + b"ins, employment, socialTotal,\r\n"
    + I3 + b"gradeInfo,\r\n"
    + I3 + b"incomeTaxResultLog,\r\n"
    + I2 + b"},\r\n"
    + I1 + b"};\r\n"
    + b"};"
)
data = replace_once(data, OLD3, NEW3, "success return")
replacements += 1
print("[3] success: wrapped in result, added error:null")

# ---- 4. wrapper: guard + destructure + computations ----
OLD4 = (
    I1 + b"if (!core || !core._logData) return core ? { ...row, ...core } : {};\r\n"
    + b"\r\n"
    + I1 + b"const residentTax = Number(row.residentTax) || 0;\r\n"
    + I1 + b"const totalDeductions = core.incomeTax === null\r\n"
    + I2 + b"? null\r\n"
    + I2 + b": (core.socialTotal ?? 0) + core.incomeTax + residentTax + (core.totalCustomDeds ?? 0);\r\n"
    + I1 + b"const netPay = totalDeductions === null ? null : (core.grossPay ?? 0) - totalDeductions;\r\n"
    + b"\r\n"
    + I1 + b"const ageAlerts = (yearStr && master?.dob)\r\n"
    + I2 + b"? getAgeAlerts(master.dob, yearStr, monthKey)\r\n"
    + I2 + b": [];\r\n"
    + b"\r\n"
    + I1 + b"const { _logData, ...coreResult } = core;\r\n"
    + I1 + b"const result = { ...row, ...coreResult, totalDeductions, netPay };\r\n"
    + I1 + b"const logData = { ..._logData, ageAlerts };\r\n"
    + I1 + b"const { status } = logData;"
)
NEW4 = (
    I1 + b"if (!core) return {};\r\n"
    + b"\r\n"
    + I1 + b"const { result: coreResult, debug: _logData, error } = core;\r\n"
    + I1 + b"const residentTax = Number(row.residentTax) || 0;\r\n"
    + I1 + b"const totalDeductions = coreResult !== null && coreResult.incomeTax !== null\r\n"
    + I2 + b"? (coreResult.socialTotal ?? 0) + coreResult.incomeTax + residentTax + (coreResult.totalCustomDeds ?? 0)\r\n"
    + I2 + b": null;\r\n"
    + I1 + b"const netPay = totalDeductions === null ? null : (coreResult?.grossPay ?? 0) - totalDeductions;\r\n"
    + b"\r\n"
    + I1 + b"const ageAlerts = (yearStr && master?.dob)\r\n"
    + I2 + b"? getAgeAlerts(master.dob, yearStr, monthKey)\r\n"
    + I2 + b": [];\r\n"
    + b"\r\n"
    + I1 + b"const result = { ...row, ...(coreResult ?? {}), totalDeductions, netPay };\r\n"
    + I1 + b"const logData = { ..._logData, ageAlerts };\r\n"
    + I1 + b"const { status } = logData;"
)
data = replace_once(data, OLD4, NEW4, "wrapper guard/destructure/computations")
replacements += 1
print("[4] wrapper: guard, destructure, computations, result spread updated")

# ---- 5. calcLog grossPay: result.grossPay -> coreResult?.grossPay ?? logData.grossPay ----
OLD5 = (
    b"calcLog.push(`- " + GROSS + b": ${formatCurrency(result.grossPay)}" + EN + b"`);"
)
NEW5 = (
    b"calcLog.push(`- " + GROSS + b": ${formatCurrency(coreResult?.grossPay ?? logData.grossPay)}" + EN + b"`);"
)
data = replace_once(data, OLD5, NEW5, "calcLog grossPay")
replacements += 1
print("[5] calcLog: grossPay source updated")

with open(TARGET, "wb") as f:
    f.write(data)

print(f"\nDone. {replacements} replacements applied.")
print(f"File size: {original_size} -> {len(data)} bytes (delta {len(data) - original_size:+d})")
