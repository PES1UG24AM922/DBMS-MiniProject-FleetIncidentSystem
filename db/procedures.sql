USE transport_db;
DELIMITER $$

CREATE PROCEDURE sp_report_incident (
  IN p_trip_id INT, IN p_type VARCHAR(20), IN p_severity VARCHAR(10),
  IN p_location VARCHAR(150), IN p_desc TEXT, IN p_user_id INT,
  IN p_driver_scope INT, OUT p_incident_id INT)
BEGIN
  DECLARE v_bus INT DEFAULT NULL;
  DECLARE v_drv INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT bus_id, driver_id INTO v_bus, v_drv FROM trips WHERE trip_id = p_trip_id FOR UPDATE;
  IF v_bus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trip not found';
  END IF;
  IF p_driver_scope IS NOT NULL AND p_driver_scope <> v_drv THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Drivers may only report incidents on their own trips';
  END IF;
  SET @app_user_id = p_user_id;
  INSERT INTO incidents (trip_id, bus_id, driver_id, reported_by, incident_type, severity, location_desc, description)
  VALUES (p_trip_id, v_bus, v_drv, p_user_id, p_type, p_severity, p_location, p_desc);
  SET p_incident_id = LAST_INSERT_ID();
  COMMIT;
END$$

CREATE PROCEDURE sp_assign_maintenance (
  IN p_incident_id INT, IN p_user_id INT, IN p_desc VARCHAR(255), IN p_cost DECIMAL(10,2))
BEGIN
  DECLARE v_bus INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT bus_id INTO v_bus FROM incidents
   WHERE incident_id = p_incident_id AND status IN ('REPORTED','IN_PROGRESS') FOR UPDATE;
  IF v_bus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Incident not found or already resolved';
  END IF;
  SET @app_user_id = p_user_id;
  INSERT INTO maintenance_actions (incident_id, bus_id, assigned_to, action_desc, cost)
  VALUES (p_incident_id, v_bus, p_user_id, p_desc, p_cost);
  UPDATE incidents SET status = 'IN_PROGRESS' WHERE incident_id = p_incident_id;
  UPDATE buses SET status = 'MAINTENANCE' WHERE bus_id = v_bus;
  COMMIT;
END$$

CREATE PROCEDURE sp_resolve_incident (IN p_incident_id INT, IN p_user_id INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SET @app_user_id = p_user_id;
  UPDATE maintenance_actions SET status = 'COMPLETED', completed_at = NOW()
   WHERE incident_id = p_incident_id AND status = 'OPEN';
  UPDATE incidents SET status = 'RESOLVED'
   WHERE incident_id = p_incident_id AND status IN ('REPORTED','IN_PROGRESS');
  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Incident not found or not open';
  END IF;
  COMMIT;
END$$

CREATE PROCEDURE sp_driver_incidents (IN p_driver_id INT)
BEGIN
  SELECT incident_id, incident_type, severity, status, location_desc, reported_at, resolved_at
  FROM incidents WHERE driver_id = p_driver_id ORDER BY reported_at DESC;
END$$

CREATE PROCEDURE sp_driver_trips (IN p_driver_id INT)
BEGIN
  SELECT t.trip_id, r.route_code, r.route_name, b.reg_number, t.scheduled_start, t.scheduled_end, t.status
  FROM trips t JOIN routes r ON r.route_id = t.route_id JOIN buses b ON b.bus_id = t.bus_id
  WHERE t.driver_id = p_driver_id ORDER BY t.scheduled_start DESC;
END$$

CREATE FUNCTION fn_avg_resolution_hours (p_route_id INT) RETURNS DECIMAL(8,2)
READS SQL DATA
BEGIN
  DECLARE v DECIMAL(8,2);
  SELECT AVG(TIMESTAMPDIFF(MINUTE, i.reported_at, i.resolved_at)) / 60 INTO v
  FROM incidents i JOIN trips t ON t.trip_id = i.trip_id
  WHERE t.route_id = p_route_id AND i.resolved_at IS NOT NULL;
  RETURN IFNULL(v, 0);
END$$

CREATE FUNCTION fn_bus_incident_count (p_bus_id INT, p_days INT) RETURNS INT
READS SQL DATA
BEGIN
  DECLARE n INT;
  SELECT COUNT(*) INTO n FROM incidents
  WHERE bus_id = p_bus_id AND reported_at >= NOW() - INTERVAL p_days DAY;
  RETURN n;
END$$

DELIMITER ;
