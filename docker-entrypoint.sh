#!/bin/sh
set -e
mkdir -p /usr/src/app/data
chown -R bun:bun /usr/src/app/data
cd /usr/src/app
if command -v runuser >/dev/null 2>&1; then
    exec runuser -u bun -- bun run src/index.ts
fi
exec su -s /bin/sh bun -c "cd /usr/src/app && exec bun run src/index.ts"
