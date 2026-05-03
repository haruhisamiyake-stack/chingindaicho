#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "r", encoding="utf-8") as f:
    src = f.read()

# --- old block to replace ---
OLD_START = "const calculateMonthlyCore = ({"
OLD_END = "};\n\nconst calculateMonthlyResult"

idx_start = src.find(OLD_START)
idx_end = src.find(OLD_END, idx_start)
if idx_start < 0 or idx_end < 0:
    print("ERROR: markers not found", idx_start, idx_end)
    sys.exit(1)

old_block = src[idx_start : idx_end + len("};\n\n")]
print(f"Found block: chars {idx_start}-{idx_end + len(OLD_END)}, length {len(old_block)}")

# --- new block ---
# Japanese strings as unicode escapes to avoid encoding issues:
#   標準報酔月額が未入力です
#   = 標準報酬月額が未入力です
#   計算条件不足のため処理を中断しました
#   = 計算条件不足のため処理を中断しました
MSG_STD  = "標準報酔月額が未入力です"
MSG_TAX  = "計算条件不足のため処理を中断しました"

new_block = f'''const calculateGross = ({{ basePay, allowanceAmounts, standardRewardTable }}) => {{
  let totalAllowances = 0;
  let totalTaxableAllowances = 0;
  let totalSocialInsAllowances = 0;
  let totalEmploymentInsAllowances = 0;

  allowanceAmounts.forEach(({{ amount, isTaxable, isSocialIns, isEmploymentIns }}) => {{
    totalAllowances += amount;
    if (isTaxable) totalTaxableAllowances += amount;
    if (isSocialIns) totalSocialInsAllowances += amount;
    if (isEmploymentIns) totalEmploymentInsAllowances += amount;
  }});

  const grossPay = basePay + totalAllowances;
  const taxableGross = basePay + totalTaxableAllowances;
  const socialInsGross = basePay + totalSocialInsAllowances;
  const employmentInsGross = basePay + totalEmploymentInsAllowances;

  const stdBase = socialInsGross;
  const estStdAmount =
    standardRewardTable?.length > 0
      ? getStandardRewardAmount(standardRewardTable, stdBase)
      : stdBase;

  return {{ grossPay, taxableGross, socialInsGross, employmentInsGross, estStdAmount }};
}};

const calculateMonthlyIns = ({{
  stdAmount, standardRewardTable, estStdAmount,
  employmentInsGross,
  hRate, pRate, nRate, cRate, eRate,
  hasHealth, hasPension, hasNursing, hasEmployment, isDoubleSocialIns,
}}) => {{
  let gradeInfo = null;
  if (stdAmount !== null && stdAmount > 0 && estStdAmount > 0 && stdAmount !== estStdAmount) {{
    const tbl = standardRewardTable?.length > 0 ? standardRewardTable : DEFAULT_STD_REWARD_TABLE;
    const getGrade = (amt) => {{ const r = tbl.find(tr => amt >= Number(tr.min) && amt < Number(tr.max)); return r ? Number(r.grade) : null; }};
    const sGrade = getGrade(stdAmount);
    const eGrade = getGrade(estStdAmount);
    if (sGrade !== null && eGrade !== null) {{
      gradeInfo = {{ sGrade, eGrade, gDiff: Math.abs(sGrade - eGrade), stdAmount, estStdAmount }};
    }}
  }}

  const insMultiplier = isDoubleSocialIns ? 2 : 1;

  const ins = calculateSocialIns(
    stdAmount ?? 0,
    1,
    hRate,
    pRate,
    nRate,
    cRate,
    hasNursing
  );

  if (!hasHealth || stdAmount == null || stdAmount === 0) {{
    ins.health = 0;
    ins.nursing = 0;
  }} else {{
    ins.health *= insMultiplier;
    ins.nursing *= insMultiplier;
  }}

  if (!hasPension || stdAmount == null || stdAmount === 0) {{
    ins.pension = 0;
    ins.childCare = 0;
  }} else {{
    ins.pension *= insMultiplier;
    ins.childCare *= insMultiplier;
  }}

  const employment = hasEmployment
    ? Math.floor(employmentInsGross * (eRate / 1000))
    : 0;

  const socialTotal =
    ins.health + ins.pension + ins.nursing + ins.childCare + employment;

  return {{ ins, employment, socialTotal, gradeInfo }};
}};

const calculateIncomeTaxCore = ({{ taxableGross, socialTotal, dependents, isOtsu, taxCalcMethod, taxTables, yearStr }}) => {{
  const incomeTaxResult = calculateIncomeTax(
    Math.max(0, taxableGross - socialTotal),
    dependents,
    isOtsu,
    false,
    null,
    {{ taxCalcMethod }},
    yearStr,
    taxTables
  );
  const incomeTax =
    typeof incomeTaxResult === "object" &&
    incomeTaxResult !== null &&
    incomeTaxResult.tax !== undefined
      ? incomeTaxResult.tax
      : incomeTaxResult;

  const taxWarning =
    typeof incomeTaxResult === "object" &&
    incomeTaxResult !== null &&
    incomeTaxResult.warning !== undefined
      ? incomeTaxResult.warning
      : null;

  const isBlocking =
    typeof incomeTaxResult === "object" &&
    incomeTaxResult !== null &&
    incomeTaxResult.isBlocking !== undefined
      ? incomeTaxResult.isBlocking
      : false;

  const incomeTaxResultLog =
    typeof incomeTaxResult === "object" &&
    incomeTaxResult !== null &&
    incomeTaxResult.log
      ? incomeTaxResult.log
      : [];

  return {{ incomeTax, taxWarning, isBlocking, incomeTaxResultLog }};
}};

const calculateDeductions = ({{ deductionAmounts }}) => {{
  let totalCustomDeds = 0;
  deductionAmounts.forEach(({{ amount }}) => {{
    totalCustomDeds += amount;
  }});
  return {{ totalCustomDeds }};
}};

const buildMonthlyResult = ({{
  grossPay, ins, employment, socialTotal, estStdAmount,
  incomeTax, taxWarning, isBlocking, totalCustomDeds,
  allowanceAmounts, deductionAmounts, socialInsGross, employmentInsGross,
  stdAmount, hRate, pRate, nRate, cRate, eRate, gradeInfo, incomeTaxResultLog,
}}) => {{
  return {{
    grossPay,
    health: ins.health,
    pension: ins.pension,
    nursing: ins.nursing,
    childCare: ins.childCare,
    employment,
    incomeTax: incomeTax,
    taxWarning: taxWarning,
    isBlocking: isBlocking || incomeTax === null,
    socialTotal,
    estStdAmount: estStdAmount,
    totalCustomDeds,
    calcSuccess: true,
    _logData: {{
      status: "success",
      allowanceAmounts,
      deductionAmounts,
      socialInsGross,
      employmentInsGross,
      stdAmount,
      hRate, pRate, nRate, cRate, eRate,
      ins, employment, socialTotal,
      gradeInfo,
      incomeTaxResultLog,
    }},
  }};
}};

const calculateMonthlyCore = ({{
  basePay,
  allowanceAmounts,
  deductionAmounts,
  rates: {{ health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate }},
  flags: {{ hasHealth, hasPension, hasEmployment, hasNursing, isDoubleSocialIns }},
  tax: {{ dependents, isOtsu, taxCalcMethod, taxTables, yearStr }},
  std: {{ stdAmount, standardRewardTable }},
}}) => {{
  const {{ grossPay, taxableGross, socialInsGross, employmentInsGross, estStdAmount }} = calculateGross({{
    basePay, allowanceAmounts, standardRewardTable,
  }});

  const stdAmountMissing = (hasHealth || hasPension) && stdAmount === null;
  if (stdAmountMissing) {{
    return {{
      grossPay,
      health: null,
      pension: null,
      nursing: null,
      childCare: null,
      employment: null,
      incomeTax: null,
      taxWarning: "{MSG_STD}",
      isBlocking: true,
      netPay: null,
      socialTotal: null,
      estStdAmount,
      totalCustomDeds: null,
      totalDeductions: null,
      calcSuccess: false,
      _logData: {{
        status: "stdAmountMissing",
        allowanceAmounts,
        socialInsGross,
        stdAmount,
        hRate, pRate, nRate, cRate, eRate,
      }},
    }};
  }}

  const {{ ins, employment, socialTotal, gradeInfo }} = calculateMonthlyIns({{
    stdAmount, standardRewardTable, estStdAmount,
    employmentInsGross,
    hRate, pRate, nRate, cRate, eRate,
    hasHealth, hasPension, hasNursing, hasEmployment, isDoubleSocialIns,
  }});

  const {{ incomeTax, taxWarning, isBlocking, incomeTaxResultLog }} = calculateIncomeTaxCore({{
    taxableGross, socialTotal, dependents, isOtsu, taxCalcMethod, taxTables, yearStr,
  }});

  if (incomeTax === null) {{
    return {{
      grossPay,
      health: null, pension: null, nursing: null, childCare: null,
      employment: null, socialTotal: null,
      incomeTax: null, totalDeductions: null, netPay: null,
      isBlocking: true,
      taxWarning: "{MSG_TAX}",
      calcSuccess: false,
      _logData: {{
        status: "incomeTaxNull",
        allowanceAmounts,
        socialInsGross,
        employmentInsGross,
        stdAmount,
        hRate, pRate, nRate, cRate, eRate,
        ins, employment, socialTotal,
        gradeInfo,
        incomeTaxResultLog,
      }},
    }};
  }}

  const {{ totalCustomDeds }} = calculateDeductions({{ deductionAmounts }});

  return buildMonthlyResult({{
    grossPay, ins, employment, socialTotal, estStdAmount,
    incomeTax, taxWarning, isBlocking, totalCustomDeds,
    allowanceAmounts, deductionAmounts, socialInsGross, employmentInsGross,
    stdAmount, hRate, pRate, nRate, cRate, eRate, gradeInfo, incomeTaxResultLog,
  }});
}};

'''

new_src = src[:idx_start] + new_block + src[idx_end + len("};\n\n"):]

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(new_src)

print("Done. Wrote", len(new_src), "chars")
print("Old block length:", len(old_block))
print("New block length:", len(new_block))
