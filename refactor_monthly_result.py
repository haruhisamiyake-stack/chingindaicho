#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Refactor calculateMonthlyResult internals:
1. debug: _logData -> debug in destructuring
2. Remove logData merge line
3. const { status } = logData -> debug
4. logData.ageAlerts -> ageAlerts (within scope)
5. logData. -> debug. (scoped to calculateMonthlyResult only)
"""

TARGET = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"

with open(TARGET, "rb") as f:
    data = f.read()

original_size = len(data)
NB = b"\xc2\xa0"  # NBSP (2 bytes)
SP = b" "

def replace_once(data, old, new, label):
    count = data.count(old)
    if count != 1:
        raise ValueError(f"{label}: found {count} times (expected 1)")
    return data.replace(old, new, 1)

# 1. Fix destructuring: debug: _logData -> debug
data = replace_once(
    data,
    b"debug: _logData, error } = core;",
    b"debug, error } = core;",
    "destructuring"
)
print("[1] destructuring: debug: _logData -> debug")

# 2. Remove logData merge line (NBSP+SP indent)
data = replace_once(
    data,
    b"\r\n" + NB + SP + b"const logData = { ..._logData, ageAlerts };",
    b"",
    "logData merge line"
)
print("[2] logData merge line removed")

# 3. Fix status destructuring (unique in file)
data = replace_once(
    data,
    b"const { status } = logData;",
    b"const { status } = debug;",
    "status from debug"
)
print("[3] const { status } = debug")

# 4-5. Scoped within calculateMonthlyResult
# Start: "if (!core) return {};"
# End:   "};\r\n\r\nconst calculateBonusStd"  (function close + blank + next function)
SCOPE_START = b"if (!core) return {};\r\n"
SCOPE_END   = b"\r\n};\r\n\r\nconst calculateBonusStd"

si = data.find(SCOPE_START)
if si == -1:
    raise ValueError("SCOPE_START not found")
ei = data.find(SCOPE_END, si)
if ei == -1:
    raise ValueError("SCOPE_END not found")

section = data[si : ei + len(SCOPE_END)]

# 4. logData.ageAlerts -> ageAlerts (BEFORE generic replacement)
n4 = section.count(b"logData.ageAlerts")
section = section.replace(b"logData.ageAlerts", b"ageAlerts")
print(f"[4] logData.ageAlerts -> ageAlerts ({n4} occurrences)")

# 5. logData. -> debug. (all remaining)
n5 = section.count(b"logData.")
section = section.replace(b"logData.", b"debug.")
print(f"[5] logData. -> debug. ({n5} occurrences)")

data = data[:si] + section + data[ei + len(SCOPE_END):]

with open(TARGET, "wb") as f:
    f.write(data)

print(f"\nDone.")
print(f"File size: {original_size} -> {len(data)} bytes (delta {len(data) - original_size:+d})")
