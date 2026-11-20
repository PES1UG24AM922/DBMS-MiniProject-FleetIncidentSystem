#!/usr/bin/env bash
# Runs constraint / trigger / procedure / RBAC tests against a freshly seeded transport_db.
# Usage: ADMIN="-uroot" ./tests/run_sql_tests.sh      (needs the CHANGE_ME_* demo passwords from rbac.sql)
ADMIN=${ADMIN:--uroot}
HERE="$(cd "$(dirname "$0")/.." && pwd)"
reset_db() { for f in schema procedures triggers views rbac seed; do mysql $ADMIN < "$HERE/db/$f.sql" || exit 1; done; }
# Procedures COMMIT their own transaction, so tests that call them leave rows behind: reset before and after.
echo "Resetting transport_db from db/*.sql ..."; reset_db
pass=0; fail=0
run() { # name  mysql-args  sql  expected-regex  (expected regex is matched against output+errors)
  local out; out=$(mysql $2 transport_db -e "$3" 2>&1)
  if echo "$out" | grep -Eqi "$4"; then printf 'PASS  %s\n' "$1"; pass=$((pass+1));
  else printf 'FAIL  %s\n      got: %s\n' "$1" "$(echo "$out" | head -3)"; fail=$((fail+1)); fi
}
DRV="-uapp_driver -pCHANGE_ME_driver"; MGR="-uapp_manager -pCHANGE_ME_manager"; AUTH="-uapp_auth -pCHANGE_ME_auth"
Q="2>&1"
echo "--- Integrity constraints (CHECK / UNIQUE / FK)"
run "T01 CHECK rejects invalid phone"        "$ADMIN" "INSERT INTO drivers(full_name,license_no,phone) VALUES('X','L1','12345');" "chk_driver_phone"
run "T02 CHECK rejects bus capacity 5"       "$ADMIN" "INSERT INTO buses(reg_number,model,capacity,purchase_date) VALUES('KA9','M',5,'2024-01-01');" "chk_bus_capacity"
run "T03 UNIQUE rejects duplicate reg_number" "$ADMIN" "INSERT INTO buses(reg_number,model,capacity,purchase_date) VALUES('KA01F1001','M',40,'2024-01-01');" "Duplicate entry"
run "T04 FK rejects unknown route in trip"   "$ADMIN" "INSERT INTO trips(route_id,bus_id,driver_id,scheduled_start,scheduled_end) VALUES(999,1,1,'2027-01-01 08:00','2027-01-01 09:00');" "foreign key constraint fails"
run "T05 CHECK rejects trip end before start" "$ADMIN" "INSERT INTO trips(route_id,bus_id,driver_id,scheduled_start,scheduled_end) VALUES(1,1,1,'2027-01-01 09:00','2027-01-01 08:00');" "chk_trip_sched"
run "T06 CHECK: DRIVER user needs driver_id" "$ADMIN" "INSERT INTO users(username,email,password_hash,role) VALUES('zz','zz@x.com','h','DRIVER');" "chk_users_driver_role"
echo "--- Triggers"
run "T07 Trigger blocks overlapping bus booking"    "$ADMIN" "INSERT INTO trips(route_id,bus_id,driver_id,scheduled_start,scheduled_end) VALUES(1,1,3,'2026-11-20 08:30','2026-11-20 09:00');" "overlapping trip"
run "T08 Trigger blocks overlapping driver booking" "$ADMIN" "INSERT INTO trips(route_id,bus_id,driver_id,scheduled_start,scheduled_end) VALUES(1,2,1,'2026-11-20 08:30','2026-11-20 09:00');" "Driver already assigned"
run "T09 Trigger blocks bus under maintenance" "$ADMIN" "START TRANSACTION; UPDATE buses SET status='MAINTENANCE' WHERE bus_id=2; INSERT INTO trips(route_id,bus_id,driver_id,scheduled_start,scheduled_end) VALUES(1,2,3,'2027-02-01 08:00','2027-02-01 09:00'); ROLLBACK;" "not available"
run "T10 Trigger rejects mismatched trip/bus/driver" "$ADMIN" "INSERT INTO incidents(trip_id,bus_id,driver_id,reported_by,incident_type,severity,location_desc,description) VALUES(1,2,2,3,'DELAY','LOW','x','mismatched bus and driver');" "does not match the trip"
run "T11 Trigger: CRITICAL needs 20+ char text"     "$ADMIN" "INSERT INTO incidents(trip_id,bus_id,driver_id,reported_by,incident_type,severity,location_desc,description) VALUES(1,1,1,3,'ACCIDENT','CRITICAL','x','too short');" "20\+ characters"
run "T12 Trigger: closed incident cannot reopen"    "$ADMIN" "START TRANSACTION; UPDATE incidents SET status='CLOSED' WHERE incident_id=1; UPDATE incidents SET status='REPORTED' WHERE incident_id=1; ROLLBACK;" "cannot be reopened"
run "T13 Trigger auto-flags bus on HIGH breakdown"  "$ADMIN" "CALL sp_report_incident(1,'BREAKDOWN','HIGH','Depot','Axle noise and vibration at speed',3,1,@o); SELECT status FROM buses WHERE bus_id=1;" "MAINTENANCE"
run "T14 Trigger auto-stamps resolved_at"           "$ADMIN" "CALL sp_report_incident(1,'DELAY','LOW','Hebbal','Delay due to a road closure',3,1,@o); UPDATE incidents SET status='RESOLVED' WHERE incident_id=@o; SELECT resolved_at IS NOT NULL AS stamped FROM incidents WHERE incident_id=@o;" "^1$"
echo "--- Procedures, functions, transactions"
run "T15 Driver cannot report on another driver's trip" "$ADMIN" "CALL sp_report_incident(2,'DELAY','LOW','x','Trip belongs to driver two',3,1,@o);" "own trips"
run "T16 Procedure rejects unknown trip"             "$ADMIN" "CALL sp_report_incident(9999,'DELAY','LOW','x','Trip does not exist at all',3,NULL,@o);" "Trip not found"
run "T17 Maintenance on resolved incident rolls back" "$ADMIN" "CALL sp_assign_maintenance(6,2,'should fail',100);" "already resolved"
run "T18 Rollback left no stray maintenance row"     "$ADMIN" "SELECT COUNT(*) AS n FROM maintenance_actions WHERE action_desc='should fail';" "^0$"
run "T19 fn_avg_resolution_hours returns a value"    "$ADMIN" "SELECT fn_avg_resolution_hours(1) AS hrs;" "^[0-9]"
echo "--- Advanced queries"
run "T20 Recursive CTE finds chain 2 > 3"  "$ADMIN" "WITH RECURSIVE c AS (SELECT incident_id, CAST(incident_id AS CHAR(50)) p FROM incidents WHERE parent_incident_id IS NULL UNION ALL SELECT i.incident_id, CONCAT(c.p,' > ',i.incident_id) FROM incidents i JOIN c ON i.parent_incident_id=c.incident_id) SELECT p FROM c WHERE p LIKE '%>%';" "2 > 3"
run "T21 Full-text search finds brake incidents" "$ADMIN" "SELECT incident_id FROM incidents WHERE MATCH(description,location_desc) AGAINST ('brake' IN NATURAL LANGUAGE MODE);" "incident_id"
run "T22 Correlated subquery runs"          "$ADMIN" "SELECT i.incident_id FROM incidents i JOIN trips t ON t.trip_id=i.trip_id WHERE i.resolved_at IS NOT NULL AND TIMESTAMPDIFF(MINUTE,i.reported_at,i.resolved_at) > (SELECT AVG(TIMESTAMPDIFF(MINUTE,i2.reported_at,i2.resolved_at)) FROM incidents i2 JOIN trips t2 ON t2.trip_id=i2.trip_id WHERE t2.route_id=t.route_id AND i2.resolved_at IS NOT NULL);" "incident_id"
echo "--- Role-based access control inside MySQL"
run "T23 DRIVER cannot SELECT incidents table" "$DRV" "SELECT * FROM incidents;" "denied"
run "T24 DRIVER cannot DELETE routes"          "$DRV" "DELETE FROM routes;" "denied"
run "T25 DRIVER can read own trips via procedure" "$DRV" "CALL sp_driver_trips(1);" "R101"
run "T26 MANAGER cannot read users table"      "$MGR" "SELECT * FROM users;" "denied"
run "T27 MANAGER cannot DELETE buses"          "$MGR" "DELETE FROM buses;" "denied"
run "T28 MANAGER can read dashboard view"      "$MGR" "SELECT * FROM v_route_performance;" "R101"
run "T29 AUTH account cannot read email column" "$AUTH" "SELECT email FROM users;" "denied"
run "T30 AUTH account can read login columns"  "$AUTH" "SELECT username, role FROM users WHERE username='admin';" "ADMIN"
echo; echo "Result: $pass passed, $fail failed"; reset_db >/dev/null 2>&1; [ $fail -eq 0 ]
