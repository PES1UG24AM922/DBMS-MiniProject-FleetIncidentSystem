#!/usr/bin/env bash
# Usage: MYSQL_ADMIN_USER=root ./db/setup.sh   (prompts for password)
set -e
U=${MYSQL_ADMIN_USER:-root}
for f in schema procedures triggers views rbac seed; do
  echo "Loading db/$f.sql"; mysql -u "$U" -p < "$(dirname "$0")/$f.sql"
done
echo "MySQL ready. Next: npm run seed:users, then mongosh < db/mongo/init.js"
