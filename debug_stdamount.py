import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    lines = f.readlines()

# Find stdAmountMissing block
for i, line in enumerate(lines):
    if 'health: 0,' in line or 'pension: 0,' in line or 'employment,' in line:
        if i > 1000 and i < 1200:
            sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))

sys.stdout.buffer.write(b"\n=== stdAmountMissing surrounding context ===\n")
for i, line in enumerate(lines):
    if 'stdAmountMissing' in line and i < 1200:
        for j in range(max(0, i-1), min(len(lines), i+25)):
            sys.stdout.buffer.write(f"line {j+1}: {repr(lines[j])}\n".encode("utf-8"))
        break

# Also find createInitialYearData stdAmount
sys.stdout.buffer.write(b"\n=== createInitialYearData stdAmount ===\n")
for i, line in enumerate(lines):
    if 'stdAmount' in line and ('createInitialYearData' in ''.join(lines[max(0,i-30):i]) or 'stdAmount: 0' in line):
        sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))
