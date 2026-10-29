#!/usr/bin/env bash
# 整理统信商店应用目录；构建成功不代表目标系统真机兼容性验收。
set -euo pipefail
source_deb=${1:?需要源 DEB 路径}
output_dir=${2:?需要输出目录}
appid=site.daguojueqi.jiuji
version=1.1.0
arch=$(dpkg-deb -f "$source_deb" Architecture)
case "$arch" in amd64|arm64) ;; *) exit 1;; esac
scratch_dir=$(mktemp -d)
trap 'rm -rf "$scratch_dir"' EXIT
dpkg-deb -x "$source_deb" "$scratch_dir/source"
mapfile -t executables < <(find "$scratch_dir/source/usr/bin" -maxdepth 1 -type f -executable)
test "${#executables[@]}" -eq 1
binary=$(basename "${executables[0]}")
base="$scratch_dir/pack/opt/apps/$appid"
mkdir -p "$scratch_dir/pack/DEBIAN" "$base/files/bin" "$base/files/share/doc" "$base/entries/applications" "$base/entries/icons/hicolor/512x512/apps" "$output_dir"
install -m 755 "${executables[0]}" "$base/files/bin/$binary"
cp LICENSE "$base/files/share/doc/"
install -m 644 src-tauri/icons/icon.png "$base/entries/icons/hicolor/512x512/apps/$appid.png"
cat > "$base/entries/applications/$appid.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=九级
Name[en_US]=Jiuji
Comment=从荒野到星海的生存探索
Exec=/opt/apps/$appid/files/bin/$binary
Icon=$appid
Terminal=false
Categories=Game;AdventureGame;
StartupNotify=true
DESKTOP
python3 - "$base/info" "$appid" "$version" "$arch" <<'PY'
import json,sys
path,appid,version,arch=sys.argv[1:]
info={'appid':appid,'name':'九级','version':version,'arch':[arch],'permissions':{k:False for k in ['autostart','notification','trayicon','clipboard','account','bluetooth','camera','audio_record','installed_apps']},'support-plugins':[],'plugins':[]}
with open(path,'w') as f:json.dump(info,f,ensure_ascii=False,indent=2)
PY
depends=$(dpkg-deb -f "$source_deb" Depends)
cat > "$scratch_dir/pack/DEBIAN/control" <<CONTROL
Package: $appid
Version: $version
Architecture: $arch
Maintainer: 陈成 <15542389060@163.com>
Depends: $depends
Section: games
Priority: optional
Description: 九级原创荒野生存游戏
 采集、合成、建造，穿越虫洞探索新地图，从荒野成长到九级文明。
CONTROL
dpkg-deb -Zgzip --root-owner-group --build "$scratch_dir/pack" "$output_dir/${appid}_${version}_${arch}.deb"
sha256sum "$output_dir/${appid}_${version}_${arch}.deb" > "$output_dir/${appid}_${version}_${arch}.sha256"
dpkg-deb -f "$output_dir/${appid}_${version}_${arch}.deb" Package Version Architecture Depends
