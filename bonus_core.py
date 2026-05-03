#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Insert calculateBonusStd, calculateBonusIns, calculateBonusTaxCore, calculateBonusCore
immediately before const calculateBonusResult = ({
All inserted code is pure ASCII (no Japanese strings).
"""

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "rb") as f:
    data = f.read()

ANCHOR = b"const calculateBonusResult = ({"
if data.count(ANCHOR) != 1:
    raise ValueError(f"anchor found {data.count(ANCHOR)} times")

INSERT = (
    b"const calculateBonusStd = ({ grossPay, priorHealthBonusStdTotal }) => {\r\n"
    b"  const bonusStdRaw = Math.floor(grossPay / 1000) * 1000;\r\n"
    b"  const healthBonusStd = Math.min(bonusStdRaw, Math.max(0, 5730000 - priorHealthBonusStdTotal));\r\n"
    b"  const pensionBonusStd = Math.min(bonusStdRaw, 1500000);\r\n"
    b"  return { bonusStdRaw, healthBonusStd, pensionBonusStd };\r\n"
    b"};\r\n"
    b"\r\n"
    b"const calculateBonusIns = ({\r\n"
    b"  healthBonusStd, pensionBonusStd, grossPay,\r\n"
    b"  hasHealth, hasPension, hasNursing, hasEmployment,\r\n"
    b"  hRate, pRate, nRate, cRate, eRate,\r\n"
    b"}) => {\r\n"
    b"  const health = hasHealth ? Math.floor(healthBonusStd * (hRate / 100)) : 0;\r\n"
    b"  const nursing = hasNursing ? Math.floor(healthBonusStd * (nRate / 100)) : 0;\r\n"
    b"  const pension = hasPension ? Math.floor(pensionBonusStd * (pRate / 100)) : 0;\r\n"
    b"  const childCare = hasPension ? Math.floor(pensionBonusStd * (cRate / 100)) : 0;\r\n"
    b"  const employment = hasEmployment ? Math.floor(grossPay * (eRate / 1000)) : 0;\r\n"
    b"  const socialTotal = health + pension + nursing + childCare + employment;\r\n"
    b"  return { health, pension, nursing, childCare, employment, socialTotal };\r\n"
    b"};\r\n"
    b"\r\n"
    b"const calculateBonusTaxCore = ({\r\n"
    b"  bonusAfterSocial, lastMonthSalaryAfterSocial, manualIncomeTax,\r\n"
    b"  master, settings, yearStr, taxTables,\r\n"
    b"}) => {\r\n"
    b"  const taxResult = calculateBonusIncomeTax(bonusAfterSocial, lastMonthSalaryAfterSocial, master, settings, yearStr, taxTables);\r\n"
    b"  const manualRequired = taxResult.manualRequired ?? false;\r\n"
    b"  const incomeTax = taxResult.tax === null ? null : (manualRequired ? manualIncomeTax : taxResult.tax);\r\n"
    b"  const taxWarning = taxResult.warning ?? null;\r\n"
    b"  const isBlocking = taxResult.isBlocking || incomeTax === null || false;\r\n"
    b"  const incomeTaxResultLog = taxResult.log ?? [];\r\n"
    b"  return { incomeTax, taxWarning, isBlocking, manualRequired, incomeTaxResultLog };\r\n"
    b"};\r\n"
    b"\r\n"
    b"const calculateBonusCore = ({\r\n"
    b"  basePay, allowanceAmounts, deductionAmounts, residentTax,\r\n"
    b"  rates: { health: hRate, pension: pRate, nursing: nRate, childCare: cRate, employment: eRate },\r\n"
    b"  flags: { hasHealth, hasPension, hasNursing, hasEmployment },\r\n"
    b"  tax: { manualIncomeTax, master, settings, yearStr, taxTables },\r\n"
    b"  ins: { priorHealthBonusStdTotal, lastMonthSalaryAfterSocial },\r\n"
    b"}) => {\r\n"
    b"  const { grossPay, taxableGross } = calculateGross({ basePay, allowanceAmounts, standardRewardTable: null });\r\n"
    b"  const { bonusStdRaw, healthBonusStd, pensionBonusStd } = calculateBonusStd({ grossPay, priorHealthBonusStdTotal });\r\n"
    b"  const { health, pension, nursing, childCare, employment, socialTotal } = calculateBonusIns({\r\n"
    b"    healthBonusStd, pensionBonusStd, grossPay,\r\n"
    b"    hasHealth, hasPension, hasNursing, hasEmployment,\r\n"
    b"    hRate, pRate, nRate, cRate, eRate,\r\n"
    b"  });\r\n"
    b"  const bonusAfterSocial = Math.max(0, taxableGross - socialTotal);\r\n"
    b"  const { incomeTax, taxWarning, isBlocking, manualRequired, incomeTaxResultLog } = calculateBonusTaxCore({\r\n"
    b"    bonusAfterSocial, lastMonthSalaryAfterSocial, manualIncomeTax,\r\n"
    b"    master, settings, yearStr, taxTables,\r\n"
    b"  });\r\n"
    b"  if (incomeTax === null) {\r\n"
    b"    return {\r\n"
    b"      result: null,\r\n"
    b"      error: \"incomeTaxNull\",\r\n"
    b"      debug: { status: \"incomeTaxNull\", grossPay, taxableGross, bonusStdRaw, healthBonusStd, pensionBonusStd, health, pension, nursing, childCare, employment, socialTotal, bonusAfterSocial, incomeTaxResultLog, taxWarning, manualRequired },\r\n"
    b"    };\r\n"
    b"  }\r\n"
    b"  let totalCustomDeds = 0;\r\n"
    b"  deductionAmounts.forEach(({ amount }) => { totalCustomDeds += amount; });\r\n"
    b"  const totalDeductions = socialTotal + incomeTax + residentTax + totalCustomDeds;\r\n"
    b"  const netPay = grossPay - totalDeductions;\r\n"
    b"  return {\r\n"
    b"    result: { grossPay, taxableGross, health, pension, nursing, childCare, employment, socialTotal, incomeTax, taxWarning, isBlocking, manualRequired, residentTax, totalCustomDeds, totalDeductions, netPay, calcSuccess: true },\r\n"
    b"    error: null,\r\n"
    b"    debug: { status: \"success\", grossPay, taxableGross, bonusStdRaw, healthBonusStd, pensionBonusStd, health, pension, nursing, childCare, employment, socialTotal, bonusAfterSocial, incomeTaxResultLog, manualRequired },\r\n"
    b"  };\r\n"
    b"};\r\n"
    b"\r\n"
)

data = data.replace(ANCHOR, INSERT + ANCHOR, 1)

with open(TARGET, "wb") as f:
    f.write(data)

print(f"Done. Inserted {len(INSERT)} bytes before calculateBonusResult.")
