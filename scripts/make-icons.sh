#!/usr/bin/env bash
# Renders every app icon and splash image from scripts/logo.svg (needs rsvg-convert and ImageMagick).
# Usage: scripts/make-icons.sh web | native
set -euo pipefail
cd "$(dirname "$0")/.."
BRAND_CREAM="#FBF6EE"   # icon background (matches the website)
APP_CREAM="#fff3e3"     # splash background (matches capacitor.config.ts)

# icon OUT SIZE BG BOX [round] [flat]
#   BOX = logo box as a fraction of the canvas (the kangaroo fills about 90% of its box)
#   BG "none" = transparent; round = circle crop; flat = no alpha channel (App Store icon)
icon() {
  local out=$1 size=$2 bg=$3 box=$4 shape=${5:-} flat=${6:-}
  local px; px=$(python3 -c "print(round($size*$box))")
  rsvg-convert -w "$px" -h "$px" scripts/logo.svg -o /tmp/logo-$$.png
  convert -size "${size}x${size}" "xc:$bg" /tmp/logo-$$.png -gravity center -composite /tmp/base-$$.png
  if [ "$shape" = round ]; then
    convert /tmp/base-$$.png \( -size "${size}x${size}" xc:none -fill white -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \) -compose DstIn -composite /tmp/base-$$.png
  fi
  if [ "$flat" = flat ]; then convert /tmp/base-$$.png -alpha off "PNG24:$out"; else convert /tmp/base-$$.png "PNG32:$out"; fi
  rm -f /tmp/logo-$$.png /tmp/base-$$.png
}

# splash OUT WIDTH HEIGHT: cream with the logo at 22% of the shorter side
splash() {
  local out=$1 w=$2 h=$3
  local short=$(( w < h ? w : h )) px
  px=$(python3 -c "print(round($short*0.22))")
  rsvg-convert -w "$px" -h "$px" scripts/logo.svg -o /tmp/logo-$$.png
  convert -size "${w}x${h}" "xc:$APP_CREAM" /tmp/logo-$$.png -gravity center -composite "PNG24:$out"
  rm -f /tmp/logo-$$.png
}

case "${1:-}" in
  web)
    icon public/icons/favicon-32.png 32 "$BRAND_CREAM" 0.92 "" flat
    icon public/icons/apple-touch-icon.png 180 "$BRAND_CREAM" 0.84 "" flat
    icon public/icons/icon-192.png 192 "$BRAND_CREAM" 0.84 "" flat
    icon public/icons/icon-512.png 512 "$BRAND_CREAM" 0.84 "" flat
    icon public/icons/icon-maskable-192.png 192 "$BRAND_CREAM" 0.62 "" flat
    icon public/icons/icon-maskable-512.png 512 "$BRAND_CREAM" 0.62 "" flat
    ;;
  native)
    icon ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png 1024 "$BRAND_CREAM" 0.84 "" flat
    for f in ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732*.png; do splash "$f" 2732 2732; done
    declare -A LEGACY=( [mdpi]=48 [hdpi]=72 [xhdpi]=96 [xxhdpi]=144 [xxxhdpi]=192 )
    declare -A FG=( [mdpi]=108 [hdpi]=162 [xhdpi]=216 [xxhdpi]=324 [xxxhdpi]=432 )
    for d in "${!LEGACY[@]}"; do
      r=android/app/src/main/res/mipmap-$d
      icon "$r/ic_launcher.png" "${LEGACY[$d]}" "$BRAND_CREAM" 0.84
      icon "$r/ic_launcher_round.png" "${LEGACY[$d]}" "$BRAND_CREAM" 0.72 round
      icon "$r/ic_launcher_foreground.png" "${FG[$d]}" none 0.56
    done
    sed -i 's|<color name="ic_launcher_background">[^<]*</color>|<color name="ic_launcher_background">#FBF6EE</color>|' android/app/src/main/res/values/ic_launcher_background.xml
    while IFS= read -r f; do
      dims=$(identify -format '%w %h' "$f"); splash "$f" ${dims}
    done < <(find android/app/src/main/res -name splash.png)
    ;;
  *) echo "Usage: $0 web|native" >&2; exit 1 ;;
esac
