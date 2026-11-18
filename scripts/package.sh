#!/bin/sh
# Prepares bricotheque-build.zip, the archive to upload to o2switch:
# production build, empty tmp/ folder, normalised permissions (755 folders,
# 644 files), without node_modules, .env or macOS ._ files.
#
# The project sits on an exFAT disk, where chmod has no effect (every file
# shows as owner-only, which causes 403 errors on the server): the build is
# copied to a temporary folder of the internal disk, fixed and zipped there.
set -e
cd "$(dirname "$0")/.."
PROJECT="$(pwd)"

npm run build

STAGE="$(mktemp -d)/bricotheque"
mkdir -p "$STAGE"
rsync -a --exclude node_modules --exclude .env --exclude '._*' build/ "$STAGE/"
mkdir -p "$STAGE/tmp"
touch "$STAGE/tmp/.gitkeep"
# Passenger startup file (see server.cjs)
cp server.cjs "$STAGE/server.cjs"
find "$STAGE" -type d -exec chmod 755 {} \;
find "$STAGE" -type f -exec chmod 644 {} \;

rm -f "$PROJECT/bricotheque-build.zip"
(cd "$STAGE" && COPYFILE_DISABLE=1 zip -rqX "$PROJECT/bricotheque-build.zip" .)
rm -rf "$(dirname "$STAGE")"
echo "bricotheque-build.zip prêt ($(du -h bricotheque-build.zip | cut -f1))"
