#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Refactor calculateMonthlyCore to always return { result, error, debug }.
- error cases: result: null, error: "code"
- success:     result: <computed>, error: null
Also updates calculateMonthlyResult wrapper to adapt to new shape.
"""

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "rb") as f:
    data = f.read()

original_size = len(data)
NB = b"\xc2\xa0"  # UTF-8 NBSP

# Japanese bytes
STD_MSG = b"\xe6\xa8\x99\xe6\xba\x96\xe5\xa0\xb1\xe9\x85\xac\xe6\x9c\x88\xe9\xa1\x8d\xe3\x81\x8c\xe6\x9c\xaa\xe5\x85\xa5\xe5\x8a\x9b\xe3\x81\xa7\xe3\x81\x99"
TAX_MSG = b"\xe8\xa8\x88\xe7\xae\x97\xe6\x9d\xa1\xe4\xbb\xb6\xe4\xb8\x8d\xe8\xb6\xb3\xe3\x81\xae\xe3\x81\x9f\xe3\x82\x81\xe5\x87\xa6\xe7\x90\x86\xe3\x82\x92\xe4\xb8\xad\xe6\x96\xad\xe3\x81\x97\xe3\x81\xbe\xe3\x81\x97\xe3\x81\x9f"
GROSS  = b"\xe7\xb7\x8f\xe6\x94\xaf\xe7\xb5\xa6\xe9\xa1\x8d"  # 総支給額
EN     = b"\xe5\x86\x86"  # 円

replacements = 0

def replace_once(data, old, new, label):
    count = data.count(old)
    if count != 1:
        raise ValueError(f"{label}: found {count} times (expected 1)")
    return data.replace(old, new, 1)

# ---- 1. stdAmountMissing: { result: null, error: "stdAmountMissing", debug: {..., grossPay} } ----
OLD1 = (
    b"  if (stdAmountMissing) {\r\n"
    b"    return {\r\n"
    b"      result: {\r\n"
    b"        grossPay,\r\n"
    b"        health: null,\r\n"
    b"        pension: null,\r\n"
    b"        nursing: null,\r\n"
    b"        childCare: null,\r\n"
    b"        employment: null,\r\n"
    b"        incomeTax: null,\r\n"
    b"        taxWarning: \"" + STD_MSG + b"\",\r\n"
    b"        isBlocking: true,\r\n"
    b"        netPay: null,\r\n"
    b"        socialTotal: null,\r\n"
    b"        estStdAmount,\r\n"
    b"        totalCustomDeds: null,\r\n"
    b"        totalDeductions: null,\r\n"
    b"        calcSuccess: false,\r\n"
    b"      },\r\n"
    b"      debug: {\r\n"
    b"        status: \"stdAmountMissing\",\r\n"
    b"        allowanceAmounts,\r\n"
    b"        socialInsGross,\r\n"
    b"        stdAmount,\r\n"
    b"        hRate, pRate, nRate, cRate, eRate,\r\n"
    b"      },\r\n"
    b"    };\r\n"
    b"  }"
)
NEW1 = (
    b"  if (stdAmountMissing) {\r\n"
    b"    return {\r\n"
    b"      result: null,\r\n"
    b"      error: \"stdAmountMissing\",\r\n"
    b"      debug: {\r\n"
    b"        status: \"stdAmountMissing\",\r\n"
    b"        grossPay,\r\n"
    b"        allowanceAmounts,\r\n"
    b"        socialInsGross,\r\n"
    b"        stdAmount,\r\n"
    b"        hRate, pRate, nRate, cRate, eRate,\r\n"
    b"      },\r\n"
    b"    };\r\n"
    b"  }"
)
data = replace_once(data, OLD1, NEW1, "stdAmountMissing block")
replacements += 1
print("[1] stdAmountMissing: result:null, error:code")

# ---- 2. incomeTaxNull: { result: null, error: "incomeTaxNull", debug: {..., grossPay} } ----
OLD2 = (
    b"  if (incomeTax === null) {\r\n"
    b"    return {\r\n"
    b"      result: {\r\n"
    b"        grossPay,\r\n"
    b"        health: null, pension: null, nursing: null, childCare: null,\r\n"
    b"        employment: null, socialTotal: null,\r\n"
    b"        incomeTax: null, totalDeductions: null, netPay: null,\r\n"
    b"        isBlocking: true,\r\n"
    b"        taxWarning: \"" + TAX_MSG + b"\",\r\n"
    b"        calcSuccess: false,\r\n"
    b"      },\r\n"
    b"      debug: {\r\n"
    b"        status: \"incomeTaxNull\",\r\n"
    b"        allowanceAmounts,\r\n"
    b"        socialInsGross,\r\n"
    b"        employmentInsGross,\r\n"
    b"        stdAmount,\r\n"
    b"        hRate, pRate, nRate, cRate, eRate,\r\n"
    b"        ins, employment, socialTotal,\r\n"
    b"        gradeInfo,\r\n"
    b"        incomeTaxResultLog,\r\n"
    b"      },\r\n"
    b"    };\r\n"
    b"  }"
)
NEW2 = (
    b"  if (incomeTax === null) {\r\n"
    b"    return {\r\n"
    b"      result: null,\r\n"
    b"      error: \"incomeTaxNull\",\r\n"
    b"      debug: {\r\n"
    b"        status: \"incomeTaxNull\",\r\n"
    b"        grossPay,\r\n"
    b"        allowanceAmounts,\r\n"
    b"        socialInsGross,\r\n"
    b"        employmentInsGross,\r\n"
    b"        stdAmount,\r\n"
    b"        hRate, pRate, nRate, cRate, eRate,\r\n"
    b"        ins, employment, socialTotal,\r\n"
    b"        gradeInfo,\r\n"
    b"        incomeTaxResultLog,\r\n"
    b"      },\r\n"
    b"    };\r\n"
    b"  }"
)
data = replace_once(data, OLD2, NEW2, "incomeTaxNull block")
replacements += 1
print("[2] incomeTaxNull: result:null, error:code")

# ---- 3. success return: add error: null ----
OLD3 = (
    b"  return {\r\n"
    b"    result: buildMonthlyResult({\r\n"
    b"      grossPay, ins, employment, socialTotal, estStdAmount,\r\n"
    b"      incomeTax, taxWarning, isBlocking, totalCustomDeds,\r\n"
    b"    }),\r\n"
    b"    debug: {\r\n"
    b"      status: \"success\",\r\n"
    b"      allowanceAmounts,\r\n"
    b"      deductionAmounts,\r\n"
    b"      socialInsGross,\r\n"
    b"      employmentInsGross,\r\n"
    b"      stdAmount,\r\n"
    b"      hRate, pRate, nRate, cRate, eRate,\r\n"
    b"      ins, employment, socialTotal,\r\n"
    b"      gradeInfo,\r\n"
    b"      incomeTaxResultLog,\r\n"
    b"    },\r\n"
    b"  };\r\n"
    b"};"
)
NEW3 = (
    b"  return {\r\n"
    b"    result: buildMonthlyResult({\r\n"
    b"      grossPay, ins, employment, socialTotal, estStdAmount,\r\n"
    b"      incomeTax, taxWarning, isBlocking, totalCustomDeds,\r\n"
    b"    }),\r\n"
    b"    error: null,\r\n"
    b"    debug: {\r\n"
    b"      status: \"success\",\r\n"
    b"      allowanceAmounts,\r\n"
    b"      deductionAmounts,\r\n"
    b"      socialInsGross,\r\n"
    b"      employmentInsGross,\r\n"
    b"      stdAmount,\r\n"
    b"      hRate, pRate, nRate, cRate, eRate,\r\n"
    b"      ins, employment, socialTotal,\r\n"
    b"      gradeInfo,\r\n"
    b"      incomeTaxResultLog,\r\n"
    b"    },\r\n"
    b"  };\r\n"
    b"};"
)
data = replace_once(data, OLD3, NEW3, "success return")
replacements += 1
print("[3] success: added error:null")

# ---- 4. wrapper: guard + destructure + computations + result spread ----
OLD4 = (
    b"if (!core || !core.debug) return core ? { ...row, ...core.result } : {};\r\n"
    b"\r\n"
    + NB + b" const { result: coreResult, debug: _logData } = core;\r\n"
    + NB + b" const residentTax = Number(row.residentTax) || 0;\r\n"
    + NB + b" const totalDeductions = coreResult.incomeTax === null\r\n"
    + NB + b" " + NB + b" ? null\r\n"
    + NB + b" " + NB + b" : (coreResult.socialTotal ?? 0) + coreResult.incomeTax + residentTax + (coreResult.totalCustomDeds ?? 0);\r\n"
    + NB + b" const netPay = totalDeductions === null ? null : (coreResult.grossPay ?? 0) - totalDeductions;\r\n"
    b"\r\n"
    + NB + b" const ageAlerts = (yearStr && master?.dob)\r\n"
    + NB + b" " + NB + b" ? getAgeAlerts(master.dob, yearStr, monthKey)\r\n"
    + NB + b" " + NB + b" : [];\r\n"
    b"\r\n"
    + NB + b" const result = { ...row, ...coreResult, totalDeductions, netPay };\r\n"
    + NB + b" const logData = { ..._logData, ageAlerts };\r\n"
    + NB + b" const { status } = logData;"
)
NEW4 = (
    b"if (!core) return {};\r\n"
    b"\r\n"
    + NB + b" const { result: coreResult, debug: _logData, error } = core;\r\n"
    + NB + b" const residentTax = Number(row.residentTax) || 0;\r\n"
    + NB + b" const totalDeductions = coreResult !== null && coreResult.incomeTax !== null\r\n"
    + NB + b" " + NB + b" ? (coreResult.socialTotal ?? 0) + coreResult.incomeTax + residentTax + (coreResult.totalCustomDeds ?? 0)\r\n"
    + NB + b" " + NB + b" : null;\r\n"
    + NB + b" const netPay = totalDeductions === null ? null : (coreResult?.grossPay ?? 0) - totalDeductions;\r\n"
    b"\r\n"
    + NB + b" const ageAlerts = (yearStr && master?.dob)\r\n"
    + NB + b" " + NB + b" ? getAgeAlerts(master.dob, yearStr, monthKey)\r\n"
    + NB + b" " + NB + b" : [];\r\n"
    b"\r\n"
    + NB + b" const result = { ...row, ...(coreResult ?? {}), totalDeductions, netPay };\r\n"
    + NB + b" const logData = { ..._logData, ageAlerts };\r\n"
    + NB + b" const { status } = logData;"
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
