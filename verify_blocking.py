import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    lines = f.readlines()

# Monthly result block (was ~1184)
sys.stdout.buffer.write(b"=== calculateMonthlyResult: totalDeductions/netPay ===\n")
for i in range(1183, 1196):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))

# Monthly return isBlocking (was ~1228)
sys.stdout.buffer.write(b"\n=== monthly return isBlocking ===\n")
for i in range(1225, 1237):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))

# Bonus isBlocking const (was ~1405)
sys.stdout.buffer.write(b"\n=== bonus isBlocking const ===\n")
for i in range(1403, 1407):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))

# Bonus block (was ~1421)
sys.stdout.buffer.write(b"\n=== calculateBonusResult: bTotalDeductions/bNetPay ===\n")
for i in range(1420, 1432):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))

# Lock button (was ~4326)
sys.stdout.buffer.write(b"\n=== lock button ===\n")
for i in range(4325, 4337):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))
