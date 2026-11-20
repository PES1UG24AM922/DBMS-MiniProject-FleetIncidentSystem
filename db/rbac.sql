USE transport_db;
CREATE ROLE IF NOT EXISTS 'role_admin', 'role_manager', 'role_driver';

GRANT ALL PRIVILEGES ON transport_db.* TO 'role_admin';

GRANT SELECT ON transport_db.drivers             TO 'role_manager';
GRANT SELECT ON transport_db.incident_status_log TO 'role_manager';
GRANT SELECT, INSERT, UPDATE ON transport_db.buses               TO 'role_manager';
GRANT SELECT, INSERT, UPDATE ON transport_db.routes              TO 'role_manager';
GRANT SELECT, INSERT, UPDATE ON transport_db.stops               TO 'role_manager';
GRANT SELECT, INSERT, UPDATE ON transport_db.route_stops         TO 'role_manager';
GRANT SELECT, INSERT, UPDATE ON transport_db.trips               TO 'role_manager';
GRANT SELECT, UPDATE         ON transport_db.incidents           TO 'role_manager';
GRANT SELECT, INSERT, UPDATE ON transport_db.maintenance_actions TO 'role_manager';
GRANT SELECT ON transport_db.v_incident_details   TO 'role_manager';
GRANT SELECT ON transport_db.v_route_performance  TO 'role_manager';
GRANT SELECT ON transport_db.v_fleet_utilization  TO 'role_manager';
GRANT EXECUTE ON PROCEDURE transport_db.sp_report_incident    TO 'role_manager';
GRANT EXECUTE ON PROCEDURE transport_db.sp_assign_maintenance TO 'role_manager';
GRANT EXECUTE ON PROCEDURE transport_db.sp_resolve_incident   TO 'role_manager';
GRANT EXECUTE ON FUNCTION  transport_db.fn_avg_resolution_hours TO 'role_manager';
GRANT EXECUTE ON FUNCTION  transport_db.fn_bus_incident_count   TO 'role_manager';

GRANT SELECT ON transport_db.routes      TO 'role_driver';
GRANT SELECT ON transport_db.stops       TO 'role_driver';
GRANT SELECT ON transport_db.route_stops TO 'role_driver';
GRANT EXECUTE ON PROCEDURE transport_db.sp_report_incident  TO 'role_driver';
GRANT EXECUTE ON PROCEDURE transport_db.sp_driver_incidents TO 'role_driver';
GRANT EXECUTE ON PROCEDURE transport_db.sp_driver_trips     TO 'role_driver';

-- Change these passwords for any real deployment and mirror them in .env.local
CREATE USER IF NOT EXISTS 'app_auth'@'%'    IDENTIFIED BY 'CHANGE_ME_auth';
GRANT SELECT (user_id, username, password_hash, role, driver_id, is_active)
  ON transport_db.users TO 'app_auth'@'%';
CREATE USER IF NOT EXISTS 'app_admin'@'%'   IDENTIFIED BY 'CHANGE_ME_admin';
CREATE USER IF NOT EXISTS 'app_manager'@'%' IDENTIFIED BY 'CHANGE_ME_manager';
CREATE USER IF NOT EXISTS 'app_driver'@'%'  IDENTIFIED BY 'CHANGE_ME_driver';
GRANT 'role_admin'   TO 'app_admin'@'%';
GRANT 'role_manager' TO 'app_manager'@'%';
GRANT 'role_driver'  TO 'app_driver'@'%';
SET DEFAULT ROLE ALL TO 'app_admin'@'%', 'app_manager'@'%', 'app_driver'@'%';
FLUSH PRIVILEGES;
