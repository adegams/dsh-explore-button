#!/usr/bin/env bash
# =============================================================================
# DSH — Floating Directory Explorer Button — Installer
# =============================================================================
# Installs the explore-button plugin into a DSH web profile (default: web).
#
# Usage:
#   ./install.sh                 # install into the default "web" profile
#   PROFILE=web ./install.sh     # explicit profile name
#
# What it does:
#   1. Copies explore-button.js into  <profile>/plugins/
#   2. Ensures <profile>/plugins/package.json has "type":"module"
#   3. Adds the Cordis insert entry to <profile>/cordis.patch.yml (idempotent)
#
# Then RESTART the DSH server (or rely on HMR) to load the plugin.
# =============================================================================
set -euo pipefail

PROFILE="${PROFILE:-web}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"
PLUGINS_DIR="$PROFILE_DIR/plugins"
PLUGIN_SRC="$(cd "$(dirname "$0")" && pwd)/explore-button.js"

# Entry id / module name used in cordis.patch.yml
ENTRY_ID="fs-browser"
MODULE_NAME="./plugins/explore-button.js?ver=$(date +%s)"

if [ ! -f "$PLUGIN_SRC" ]; then
  echo "ERROR: plugin file not found: $PLUGIN_SRC" >&2
  exit 1
fi

if [ ! -d "$PROFILE_DIR" ]; then
  echo "ERROR: DSH profile not found: $PROFILE_DIR" >&2
  echo "  Available profiles:" >&2
  ls "$DSH_HOME/profiles" 2>/dev/null >&2 || true
  exit 1
fi

echo "==> Installing dsh-explore-button into profile '$PROFILE'"

# 1. Copy plugin file
mkdir -p "$PLUGINS_DIR"
install -m 0644 "$PLUGIN_SRC" "$PLUGINS_DIR/explore-button.js"
echo "    plugin      -> $PLUGINS_DIR/explore-button.js"

# 2. Ensure ESM package.json exists in plugins dir
if [ ! -f "$PLUGINS_DIR/package.json" ]; then
  printf '{"type":"module"}\n' > "$PLUGINS_DIR/package.json"
  echo "    created     -> $PLUGINS_DIR/package.json (type: module)"
else
  echo "    package.json present (ensure it contains \"type\":\"module\")"
fi

# 3. Patch cordis.patch.yml with the insert entry (idempotent)
PATCH_FILE="$PROFILE_DIR/cordis.patch.yml"
if grep -q "id: $ENTRY_ID" "$PATCH_FILE" 2>/dev/null; then
  echo "    patch       -> entry '$ENTRY_ID' already present, skipping"
else
  cat >> "$PATCH_FILE" <<EOF

# ── dsh-explore-button (floating directory explorer) ─────────────────────────
- insert:
    - id: $ENTRY_ID
      name: '$MODULE_NAME'
EOF
  echo "    patch       -> appended entry '$ENTRY_ID' to $PATCH_FILE"
fi

echo ""
echo "==> Done. Restart the DSH server to load the plugin:"
echo "      pkill -f 'dsh web'  &&  dsh web"
echo ""
echo "    The floating bar appears at the top-right (aligned with Chat/Trajectory)."