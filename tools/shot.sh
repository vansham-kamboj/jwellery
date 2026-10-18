#!/bin/sh
# Full-page screenshot with headless Edge.  usage: tools/shot.sh <url> <out.png> [width] [height]
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
OUT=$(cygpath -w "$2")
PROF=$(cygpath -w "${TMPDIR:-/tmp}")\\avya-edge-$$
timeout 60 "$E" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$PROF" \
  --run-all-compositor-stages-before-draw --virtual-time-budget=20000 --window-size="${3:-1280},${4:-4000}" --screenshot="$OUT" "$1" >/dev/null 2>&1
