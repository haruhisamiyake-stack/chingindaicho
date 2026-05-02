import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    lines = f.readlines()

sys.stdout.buffer.write(b"=== monthly insertion area (lines 1166-1180) ===\n")
for i in range(1165, 1180):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))

sys.stdout.buffer.write(b"\n=== bonus insertion area (lines 1402-1415) ===\n")
for i in range(1401, 1415):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))

sys.stdout.buffer.write(b"\n=== lock button lines 4326-4335 ===\n")
for i in range(4325, 4335):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))
