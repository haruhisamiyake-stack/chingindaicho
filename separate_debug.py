#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Separate result from debug in calculateMonthlyCore.
- buildMonthlyResult: remove _logData, remove extra params
- calculateMonthlyCore: all returns become { result, debug }
- calculateMonthlyResult: adapt to core.result / core.debug
"""

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "rb") as f:
    data = f.read()

original_size = len(data)
replacements = 0

# ---- 1. buildMonthlyResult: remove _logData and extra params ----
OLD1 = (
    b"const buildMonthlyResult = ({\r\n"
    b"  grossPay, ins, employment, socialTotal, estStdAmount,\r\n"
    b"  incomeTax, taxWarning, isBlocking, totalCustomDeds,\r\n"
    b"  allowanceAmounts, deductionAmounts, socialInsGross, employmentInsGross,\r\n"
    b"  stdAmount, hRate, pRate, nRate, cRate, eRate, gradeInfo, incomeTaxResultLog,\r\n"
    b"}) => {\r\n"
    b"  return {\r\n"
    b"    grossPay,\r\n"
    b"    health: ins.health,\r\n"
    b"    pension: ins.pension,\r\n"
    b"    nursing: ins.nursing,\r\n"
    b"    childCare: ins.childCare,\r\n"
    b"    employment,\r\n"
    b"    incomeTax: incomeTax,\r\n"
    b"    taxWarning: taxWarning,\r\n"
    b"    isBlocking: isBlocking || incomeTax === null,\r\n"
    b"    socialTotal,\r\n"
    b"    estStdAmount: estStdAmount,\r\n"
    b"    totalCustomDeds,\r\n"
    b"    calcSuccess: true,\r\n"
    b"    _logData: {\r\n"
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
NEW1 = (
    b"const buildMonthlyResult = ({\r\n"
    b"  grossPay, ins, employment, socialTotal, estStdAmount,\r\n"
    b"  incomeTax, taxWarning, isBlocking, totalCustomDeds,\r\n"
    b"}) => {\r\n"
    b"  return {\r\n"
    b"    grossPay,\r\n"
    b"    health: ins.health,\r\n"
    b"    pension: ins.pension,\r\n"
    b"    nursing: ins.nursing,\r\n"
    b"    childCare: ins.childCare,\r\n"
    b"    employment,\r\n"
    b"    incomeTax: incomeTax,\r\n"
    b"    taxWarning: taxWarning,\r\n"
    b"    isBlocking: isBlocking || incomeTax === null,\r\n"
    b"    socialTotal,\r\n"
    b"    estStdAmount: estStdAmount,\r\n"
    b"    totalCustomDeds,\r\n"
    b"    calcSuccess: true,\r\n"
    b"  };\r\n"
    b"};"
)
count1 = data.count(OLD1)
if count1 != 1:
    print(f"ERROR: buildMonthlyResult block found {count1} times (expected 1)")
    import sys; sys.exit(1)
data = data.replace(OLD1, NEW1, 1)
replacements += 1
print(f"[1] buildMonthlyResult: replaced (removed _logData and extra params)")

# ---- 2. calculateMonthlyCore stdAmountMissing return ----
# Japanese bytes for "標準報酬月額が未入力です"
STD_MSG = b"\xe6\xa8\x99\xe6\xba\x96\xe5\xa0\xb1\xe9\x85\xac\xe6\x9c\x88\xe9\xa1\x8d\xe3\x81\x8c\xe6\x9c\xaa\xe5\x85\xa5\xe5\x8a\x9b\xe3\x81\xa7\xe3\x81\x99"

OLD2 = (
    b"  if (stdAmountMissing) {\r\n"
    b"    return {\r\n"
    b"      grossPay,\r\n"
    b"      health: null,\r\n"
    b"      pension: null,\r\n"
    b"      nursing: null,\r\n"
    b"      childCare: null,\r\n"
    b"      employment: null,\r\n"
    b"      incomeTax: null,\r\n"
    b"      taxWarning: \"" + STD_MSG + b"\",\r\n"
    b"      isBlocking: true,\r\n"
    b"      netPay: null,\r\n"
    b"      socialTotal: null,\r\n"
    b"      estStdAmount,\r\n"
    b"      totalCustomDeds: null,\r\n"
    b"      totalDeductions: null,\r\n"
    b"      calcSuccess: false,\r\n"
    b"      _logData: {\r\n"
    b"        status: \"stdAmountMissing\",\r\n"
    b"        allowanceAmounts,\r\n"
    b"        socialInsGross,\r\n"
    b"        stdAmount,\r\n"
    b"        hRate, pRate, nRate, cRate, eRate,\r\n"
    b"      },\r\n"
    b"    };\r\n"
    b"  }"
)
NEW2 = (
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
count2 = data.count(OLD2)
if count2 != 1:
    print(f"ERROR: stdAmountMissing return found {count2} times (expected 1)")
    import sys; sys.exit(1)
data = data.replace(OLD2, NEW2, 1)
replacements += 1
print(f"[2] stdAmountMissing return: separated into result/debug")

# ---- 3. calculateMonthlyCore incomeTaxNull return ----
# Japanese bytes for "計算条件不足のため処理を中断しました"
TAX_MSG = b"\xe8\xa8\x88\xe7\xae\x97\xe6\x9d\xa1\xe4\xbb\xb6\xe4\xb8\x8d\xe8\xb6\xb3\xe3\x81\xae\xe3\x81\x9f\xe3\x82\x81\xe5\x87\xa6\xe7\x90\x86\xe3\x82\x92\xe4\xb8\xad\xe6\x96\xad\xe3\x81\x97\xe3\x81\xbe\xe3\x81\x97\xe3\x81\x9f"

OLD3 = (
    b"  if (incomeTax === null) {\r\n"
    b"    return {\r\n"
    b"      grossPay,\r\n"
    b"      health: null, pension: null, nursing: null, childCare: null,\r\n"
    b"      employment: null, socialTotal: null,\r\n"
    b"      incomeTax: null, totalDeductions: null, netPay: null,\r\n"
    b"      isBlocking: true,\r\n"
    b"      taxWarning: \"" + TAX_MSG + b"\",\r\n"
    b"      calcSuccess: false,\r\n"
    b"      _logData: {\r\n"
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
NEW3 = (
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
count3 = data.count(OLD3)
if count3 != 1:
    print(f"ERROR: incomeTaxNull return found {count3} times (expected 1)")
    import sys; sys.exit(1)
data = data.replace(OLD3, NEW3, 1)
replacements += 1
print(f"[3] incomeTaxNull return: separated into result/debug")

# ---- 4. calculateMonthlyCore success return ----
OLD4 = (
    b"  return buildMonthlyResult({\r\n"
    b"    grossPay, ins, employment, socialTotal, estStdAmount,\r\n"
    b"    incomeTax, taxWarning, isBlocking, totalCustomDeds,\r\n"
    b"    allowanceAmounts, deductionAmounts, socialInsGross, employmentInsGross,\r\n"
    b"    stdAmount, hRate, pRate, nRate, cRate, eRate, gradeInfo, incomeTaxResultLog,\r\n"
    b"  });\r\n"
    b"};"
)
NEW4 = (
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
count4 = data.count(OLD4)
if count4 != 1:
    print(f"ERROR: success return found {count4} times (expected 1)")
    import sys; sys.exit(1)
data = data.replace(OLD4, NEW4, 1)
replacements += 1
print(f"[4] success return: wrapped in result/debug")

# ---- 5. calculateMonthlyResult wrapper ----
# NBSP = \xc2\xa0
NB = b"\xc2\xa0"

OLD5 = (
    b"if (!core || !core._logData) return core ? { ...row, ...core } : {};\r\n"
    b"\r\n"
    + NB + b" const residentTax = Number(row.residentTax) || 0;\r\n"
    + NB + b" const totalDeductions = core.incomeTax === null\r\n"
    + NB + b" " + NB + b" ? null\r\n"
    + NB + b" " + NB + b" : (core.socialTotal ?? 0) + core.incomeTax + residentTax + (core.totalCustomDeds ?? 0);\r\n"
    + NB + b" const netPay = totalDeductions === null ? null : (core.grossPay ?? 0) - totalDeductions;\r\n"
    b"\r\n"
    + NB + b" const ageAlerts = (yearStr && master?.dob)\r\n"
    + NB + b" " + NB + b" ? getAgeAlerts(master.dob, yearStr, monthKey)\r\n"
    + NB + b" " + NB + b" : [];\r\n"
    b"\r\n"
    + NB + b" const { _logData, ...coreResult } = core;\r\n"
    + NB + b" const result = { ...row, ...coreResult, totalDeductions, netPay };\r\n"
    + NB + b" const logData = { ..._logData, ageAlerts };\r\n"
    + NB + b" const { status } = logData;"
)
NEW5 = (
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
count5 = data.count(OLD5)
if count5 != 1:
    print(f"ERROR: wrapper guard/destructure found {count5} times (expected 1)")
    import sys; sys.exit(1)
data = data.replace(OLD5, NEW5, 1)
replacements += 1
print(f"[5] calculateMonthlyResult wrapper: adapted to core.result/core.debug")

with open(TARGET, "wb") as f:
    f.write(data)

print(f"\nDone. {replacements} replacements applied.")
print(f"File size: {original_size} -> {len(data)} bytes (delta {len(data) - original_size:+d})")
