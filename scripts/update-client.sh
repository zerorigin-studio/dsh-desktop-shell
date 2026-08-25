#!/usr/bin/env bash
# 从 dsh-desktop-shell-client 仓库同步最新构建的桌面客户端 exe 到本插件包 bin/
# 用法: bash scripts/update-client.sh [exe路径]
set -euo pipefail

SRC="${1:-D:/WorkSpaces/DeepSeekHerness/dsh-desktop-shell-client/bin/dsh-desktop-shell-client.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DST="$ROOT/bin/dsh-desktop-shell-client.exe"

if [ ! -f "$SRC" ]; then
  echo "错误: 找不到客户端 exe: $SRC（先在客户端仓库执行 wails3 build）" >&2
  exit 1
fi

mkdir -p "$(dirname "$DST")"
cp "$SRC" "$DST"
echo "OK: $SRC -> $DST ($(du -h "$DST" | cut -f1))"
