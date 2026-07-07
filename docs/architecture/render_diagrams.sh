#!/usr/bin/env bash
# Render all .mmd files in rendered/src/ to rendered/*.png
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$DIR/rendered/src"
OUT="$DIR/rendered"
mkdir -p "$SRC" "$OUT"
MMDC="npx -y @mermaid-js/mermaid-cli@11.4.0"

for f in "$SRC"/*.mmd; do
  [ -f "$f" ] || continue
  base=$(basename "$f" .mmd)
  echo "Rendering $base ..."
  $MMDC -i "$f" -o "$OUT/${base}.png" -b white -w 1400 -H 900 --scale 2 2>/dev/null || \
  $MMDC -i "$f" -o "$OUT/${base}.png" -b white
done
echo "Done."
