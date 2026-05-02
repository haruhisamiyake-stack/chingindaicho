import sys

path = r"c:\Users\h-miy\OneDrive\デスクトップ\アプリ\chingindaicho\src\App.tsx"
with open(path, encoding="utf-8") as f:
    lines = f.readlines()

for i in range(1047, 1075):
    sys.stdout.buffer.write(f"line {i+1}: {repr(lines[i])}\n".encode("utf-8"))
