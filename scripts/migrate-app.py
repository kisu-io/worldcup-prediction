#!/usr/bin/env python3
"""
One-shot migration: strip all client-side admin code from App.tsx
and wire handleResult to the Cloud Function.
"""
import shutil, sys

SRC = "/Users/oculus/Documents/Projects/worldcup-prediction/src/App.tsx"
BKP = "/tmp/App_pre_migration.tsx"
shutil.copy2(SRC, BKP)

with open(SRC, "r", encoding="utf-8") as f:
    lines = f.readlines()
N = len(lines)
print(f"Read {N} lines")

# ---- helpers ----
def delete_range(start_1, end_1):
    """Remove lines [start_1, end_1] inclusive (1-indexed)."""
    del lines[start_1-1:end_1]
    print(f"  Deleted lines {start_1}-{end_1}")

def replace_line(idx_1, new_text):
    lines[idx_1-1] = new_text + "\n"
    print(f"  Replaced line {idx_1}")

def insert_after(idx_1, new_text):
    lines.insert(idx_1, new_text + "\n")
    print(f"  Inserted after line {idx_1}")

# ============================================================
# PHASE 1: IMPORTS & TYPES (top-down, line-stable)
# ============================================================
print("\n=== PHASE 1: Imports & Types ===")

# 1a. shrink lucide import block
for i, l in enumerate(lines, 1):
    if l.strip() in ["Shield,", "ShieldCheck,", "LogOut,", "Trash2,", "RotateCcw,", "AlertTriangle,"]:
        lines[i-1] = ""
        print(f"  Removed icon at line {i}")

# 1b. remove PinModal import
for i, l in enumerate(lines, 1):
    if 'import { PinModal } from "./components/pin-modal";' in l:
        lines[i-1] = ""
        print(f"  Removed PinModal import at line {i}")

# 1c. swap admin.ts import
for i, l in enumerate(lines, 1):
    if 'import { isAdmin, logoutAdmin } from "./lib/admin";' in l:
        replace_line(i, 'import { callSubmitResult } from "./lib/admin";')
        break

# 1d. shrink ALL_TABS
for i, l in enumerate(lines, 1):
    if 'const ALL_TABS = ["predict", "result", "board", "admin"]' in l:
        replace_line(i, 'const ALL_TABS = ["predict", "board"] as const;')
        break

# ============================================================
# PHASE 2: STATE HOOKS
# ============================================================
print("\n=== PHASE 2: State Hooks ===")

# Find lines to remove
removals = []
for i, l in enumerate(lines, 1):
    if any(s in l for s in [
        'const [isAdminUser, setIsAdminUser]',
        'const [pinOpen, setPinOpen]',
        'const [confirmAction, setConfirmAction]',
    ]):
        removals.append(i)

for idx in sorted(removals, reverse=True):
    lines[idx-1] = ""
    print(f"  Cleared state hook at line {idx}")

# Add isSubmitting after toast state
for i, l in enumerate(lines, 1):
    if 'const [toast, setToast] = useState<Toast | null>(null);' in l:
        insert_after(i, "  const [isSubmitting, setIsSubmitting] = useState(false);")
        break

# ============================================================
# PHASE 3: USEEFFECT
# ============================================================
print("\n=== PHASE 3: useEffect ===")
for i, l in enumerate(lines, 1):
    if "// Check admin status on mount" in l:
        replace_line(i, "    // Admin managed server-side via Firebase custom claims")
        # next line has setIsAdminUser(isAdmin())
        if i < len(lines) and "setIsAdminUser" in lines[i]:
            lines[i] = ""
            print(f"  Cleared admin check at line {i+1}")
        break

# ============================================================
# PHASE 4: handleResult → async (CRITICAL)
# ============================================================
print("\n=== PHASE 4: handleResult migration ===")

start = None
for i, l in enumerate(lines, 1):
    if 'const handleResult = () => {' in l:
        start = i
        break

if start is None:
    print("ERROR: handleResult not found!")
    sys.exit(1)

# Find end: the line just before "const handleDeleteMatch"
end = None
for j in range(start+1, len(lines)+1):
    if lines[j-1].strip().startswith('const handleDeleteMatch'):
        end = j - 1
        break

print(f"  handleResult spans lines {start}-{end}")

new_handle = [
    "  const handleResult = async () => {\n",
    "    const trimmedResult = actualScore.trim();\n",
    "    if (!trimmedResult) {\n",
    '      showToast("Nhập tỉ số thật", "error");\n',
    "      return;\n",
    "    }\n",
    '    if (!/^\\d+\\s*[-–:]\\s*\\d+$/.test(trimmedResult)) {\n',
    '      showToast("Tỉ số không hợp lệ (VD: 2-1)", "error");\n',
    "      return;\n",
    "    }\n",
    "\n",
    "    setIsSubmitting(true);\n",
    '    showToast("⏳ Đang chốt trận...", "info");\n',
    "\n",
    "    const res = await callSubmitResult(matchKey, trimmedResult, round);\n",
    "    if (res.success) {\n",
    '      showToast("✅ Trận đã chốt!", "success");\n',
    '      setActualScore("");\n',
    "    } else {\n",
    '      showToast(res.error || "Chốt trận thất bại", "error");\n',
    "    }\n",
    "    setIsSubmitting(false);\n",
    "  };\n",
]

old_block = lines[start-1:end]
lines = lines[:start-1] + new_handle + lines[end:]
print("  Replaced (" + str(len(old_block)) + " old → " + str(len(new_handle)) + " new lines)")

# ============================================================
# PHASE 5: ADMIN FUNCTIONS DELETE
# ============================================================
print("\n=== PHASE 5: Admin functions removal ===")

# Remove from "// Admin actions" through handleLogoutAdmin inclusive
admin_start = None
for i, l in enumerate(lines, 1):
    if "// Admin actions" in l:
        admin_start = i
        break

admin_end = None
for j in range(admin_start or 0, len(lines)+1):
    if 'const handleLogoutAdmin = () => {' in lines[j-1]:
        # scan forward to the closing `  };`
        for k in range(j, min(j+30, len(lines)+1)):
            if lines[k-1].strip() == '};' and lines[k-2].strip().startswith('showToast'):
                admin_end = k
                break
        break

if admin_start and admin_end:
    delete_range(admin_start, admin_end)
else:
    print(f"WARNING: Could not bracket admin functions (start={admin_start}, end={admin_end})")

# ============================================================
# PHASE 6: visibleTabs → TABS
# ============================================================
print("\n=== PHASE 6: Tabs ===")

for i, l in enumerate(lines, 1):
    if 'const visibleTabs = [' in l:
        # find the closing ];
        close = None
        for j in range(i, min(i+10, len(lines)+1)):
            if '];' in lines[j-1]:
                close = j
                break
        if close:
            delete_range(i, close)
            # insert new static TABS
            lines[i-1:i-1] = [
                "  const TABS = [\n",
                '    { id: "predict" as const, label: "Dự đoán", icon: CircleDot },\n',
                '    { id: "board" as const, label: "BXH", icon: Trophy },\n',
                "  ];\n",
            ]
            print(f"  Replaced visibleTabs with TABS at line {i}")
        break

# Replace reference: visibleTabs.map → TABS.map
for i, l in enumerate(lines, 1):
    if 'visibleTabs.map' in l:
        lines[i-1] = l.replace('visibleTabs', 'TABS')
        print(f"  Fixed reference at line {i}")

# ============================================================
# PHASE 7: CONFIRM MODAL JSX
# ============================================================
print("\n=== PHASE 7: Confirm Modal ===")

for i, l in enumerate(lines, 1):
    if '{confirmAction && (' in l:
        # This spans until the matching `)}` on a line by itself at base indent
        # Find the line that has just `      )}`
        close = None
        for j in range(i+1, min(i+40, len(lines)+1)):
            if lines[j-1].strip() == ')}':
                # But we need to check this is the RIGHT one
                close = j
                break
        if close:
            delete_range(i, close)
            print(f"  Removed confirmAction JSX")
        break

# ============================================================
# PHASE 8: PINMODAL JSX
# ============================================================
print("\n=== PHASE 8: PinModal ===")

for i, l in enumerate(lines, 1):
    if '<PinModal' in l:
        close = None
        for j in range(i+1, min(i+20, len(lines)+1)):
            if '/>' in lines[j-1] and '<PinModal' not in lines[j-1]:
                close = j
                break
        if close:
            delete_range(i, close)
            print(f"  Removed PinModal JSX")
        break

# ============================================================
# PHASE 9: HEADER ADMIN BUTTON
# ============================================================
print("\n=== PHASE 9: Header ===")

# The header has a conditional button: {!isAdminUser ? (...) : (...)}
# It sits inside <div className="flex ... gap-2 mb-2"> ... </div>
# We'll find the ternary and replace the whole div content
for i, l in enumerate(lines, 1):
    if '{!isAdminUser ? (' in l:
        # Go up to find the <div className="flex items-center justify-center gap-2 mb-2">
        div_start = None
        for k in range(i, max(i-20, 0), -1):
            if '<div className="flex items-center justify-center gap-2 mb-2">' in lines[k-1]:
                div_start = k
                break
        # Go down to find the closing </div> for THAT div
        div_end = None
        if div_start:
            depth = 1
            for k in range(div_start+1, len(lines)+1):
                if '<div' in lines[k-1]:
                    depth += 1
                if '</div>' in lines[k-1]:
                    depth -= 1
                    if depth == 0:
                        div_end = k
                        break
        if div_start and div_end:
            delete_range(div_start, div_end)
            # Insert clean div
            lines[div_start-1:div_start-1] = [
                '        <div className="flex items-center justify-center gap-2 mb-2">\n',
                '          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold tracking-wider uppercase">\n',
                '            <Flame size={12} />\n',
                '            Live World Cup 2026\n',
                '          </div>\n',
                '        </div>\n',
            ]
            print(f"  Replaced header admin button")
        break

# ============================================================
# PHASE 10: TAB "result" BLOCK
# ============================================================
print("\n=== PHASE 10: Result tab ===")

for i, l in enumerate(lines, 1):
    if 'tab === "result"' in l:
        # Find the motion.div key="result" that wraps it
        # Since it's inside AnimatePresence mode="wait", result tab is one motion.div
        motion_start = None
        for k in range(i, max(i-30, 0), -1):
            if '<motion.div key="result"' in lines[k-1]:
                motion_start = k
                break
        if motion_start:
            # Find the closing </motion.div>
            depth = 1
            motion_end = None
            for k in range(motion_start+1, len(lines)+1):
                if '<motion.div' in lines[k-1]:
                    depth += 1
                if '</motion.div>' in lines[k-1]:
                    depth -= 1
                    if depth == 0:
                        motion_end = k
                        break
            if motion_end:
                delete_range(motion_start, motion_end)
                print(f"  Removed result tab ({motion_start}-{motion_end})")
        break

# ============================================================
# PHASE 11: TAB "admin" BLOCK
# ============================================================
print("\n=== PHASE 11: Admin tab ===")

for i, l in enumerate(lines, 1):
    if 'tab === "admin"' in l:
        motion_start = None
        for k in range(i, max(i-30, 0), -1):
            if '<motion.div key="admin"' in lines[k-1]:
                motion_start = k
                break
        if motion_start:
            depth = 1
            motion_end = None
            for k in range(motion_start+1, len(lines)+1):
                if '<motion.div' in lines[k-1]:
                    depth += 1
                if '</motion.div>' in lines[k-1]:
                    depth -= 1
                    if depth == 0:
                        motion_end = k
                        break
            # Also remove the closing </AnimatePresence> that wraps ALL tabs
            if motion_end:
                # The next line after motion_end should be </AnimatePresence>
                next_line = lines[motion_end] if motion_end < len(lines) else ""
                if '</AnimatePresence>' in next_line:
                    motion_end += 1
                delete_range(motion_start, motion_end)
                print(f"  Removed admin tab ({motion_start}-{motion_end})")
        break

# ============================================================
# PHASE 12: FIX handleResult button in JSX
# ============================================================
print("\n=== PHASE 12: Result button ===")

for i, l in enumerate(lines, 1):
    if 'onClick={handleResult}' in l:
        lines[i-1] = l.replace('onClick={handleResult}', 'onClick={handleResult} disabled={isSubmitting}')
        print("  Added disabled at line " + str(i))
        break

# ============================================================
# WRITE & VERIFY
# ============================================================
with open(SRC, "w", encoding="utf-8") as f:
    f.writelines(lines)

print(f"\n=== WROTE {len(lines)} lines ===")

# Verification
stale = ['isAdminUser', 'pinOpen', 'setPinOpen', 'setIsAdminUser', 'confirmAction',
         'handleDeleteMatch', 'handleResetFund', 'handleResetAll', 'handleLogoutAdmin',
         'visibleTabs', 'PinModal', 'ShieldCheck', 'LogOut', 'Trash2', 'RotateCcw', 'AlertTriangle']

found = []
for s in stale:
    for i, l in enumerate(lines, 1):
        if s in l and '//' not in l and 'admin' not in l.lower():
            found.append((s, i))
            break

if found:
    print("\n⚠ STALE REFERENCES REMAIN:")
    for ref, line in found:
        print(f"  {ref} at line {line}")
else:
    print("\n✅ NO stale references found")

# Check critical pieces
assert 'callSubmitResult' in ''.join(lines), "Missing callSubmitResult import"
assert 'const handleResult = async () => {' in ''.join(lines), "handleResult not async"
assert 'isSubmitting' in ''.join(lines), "Missing isSubmitting"
print("✅ Critical assertions passed")
