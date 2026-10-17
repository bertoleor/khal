#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# Config above: SCAN_DIRS = ["apps/web", "apps/admin", "packages/ui"], BASELINE = scripts/design-qa/baseline.json
SCAN_DIRS = ["apps/web", "apps/admin", "packages/ui"]
BASELINE = Path("scripts/design-qa/baseline.json")

def run_validator(directory):
    """Run the node validator on a directory and return the violation count."""
    cmd = ["node", "scripts/design-qa/validate-tokens.cjs", "--dir", directory]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
    except FileNotFoundError:
        print("::error::Node not found or validate-tokens.cjs missing", file=sys.stderr)
        sys.exit(2)
    
    # The validator prints emoji and may have output in cp1252 on Windows, but we use errors='replace'
    stdout = result.stdout
    stderr = result.stderr
    
    if result.returncode not in (0, 1):
        print(f"::error::Validator crashed with exit code {result.returncode}", file=sys.stderr)
        if stderr:
            print(f"::error::{stderr}", file=sys.stderr)
        sys.exit(2)
    
    # Parse the total from stdout: look for "Found X potential token violations" or "No token violations found"
    match = re.search(r"Found (\d+) potential token violations", stdout)
    if match:
        return int(match.group(1))
    if "No token violations found" in stdout:
        return 0
    # If we can't parse, assume 0? But better to fail.
    print(f"::error::Could not parse validator output: {stdout}", file=sys.stderr)
    sys.exit(2)

def load_baseline():
    if not BASELINE.exists():
        print(f"::error::Baseline not found at {BASELINE}", file=sys.stderr)
        sys.exit(2)
    try:
        with open(BASELINE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"::error::Invalid JSON in baseline: {e}", file=sys.stderr)
        sys.exit(2)

def save_baseline(data):
    BASELINE.parent.mkdir(parents=True, exist_ok=True)
    with open(BASELINE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def selftest():
    """Create a fixture with a known violation and ensure the validator catches it."""
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        fixture_path = Path(tmpdir) / "test.css"
        fixture_path.write_text("color: #ff0000; padding: 12px\n", encoding='utf-8')
        # Run validator on the temp directory
        cmd = ["node", "scripts/design-qa/validate-tokens.cjs", "--dir", tmpdir]
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
        except FileNotFoundError:
            print("::error::Node not found or validate-tokens.cjs missing", file=sys.stderr)
            sys.exit(2)
        if result.returncode == 1:
            print("Gate OK: el fixture malo falló como corresponde")
            sys.exit(0)
        else:
            print(f"::error::El gate NO está mordiendo (exit code {result.returncode})", file=sys.stderr)
            if result.stdout:
                print(f"::error::{result.stdout}", file=sys.stderr)
            sys.exit(1)

def check():
    """Check the scan directories against the baseline."""
    baseline = load_baseline()
    total_violations = 0
    per_dir = {}
    for directory in SCAN_DIRS:
        if not os.path.isdir(directory):
            print(f"::error::Scan directory not found: {directory}", file=sys.stderr)
            sys.exit(2)
        count = run_validator(directory)
        total_violations += count
        per_dir[directory] = count
    
    baseline_total = baseline.get("total", 0)
    if total_violations > baseline_total:
        print(f"::error::Token violations increased from {baseline_total} to {total_violations}", file=sys.stderr)
        print("::error::Per-dir violations:", file=sys.stderr)
        for dir, count in per_dir.items():
            print(f"::error::  {dir}: {count}", file=sys.stderr)
        sys.exit(1)
    elif total_violations < baseline_total:
        print(f"::warning::Token violations decreased from {baseline_total} to {total_violations}", file=sys.stderr)
        print("::warning::Consider lowering the ratchet.", file=sys.stderr)
        sys.exit(0)
    else:
        # equal
        sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: gate.py <selftest|check>", file=sys.stderr)
        sys.exit(2)
    mode = sys.argv[1]
    if mode == "selftest":
        selftest()
    elif mode == "check":
        check()
    else:
        print(f"::error::Unknown mode: {mode}", file=sys.stderr)
        sys.exit(2)
