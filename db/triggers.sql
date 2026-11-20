USE transport_db;
DELIMITER $$

CREATE TRIGGER trg_trip_bi BEFORE INSERT ON trips FOR EACH ROW
BEGIN
  IF (SELECT status FROM buses WHERE bus_id = NEW.bus_id) IN ('MAINTENANCE','RETIRED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bus is not available for scheduling';
  END IF;
  IF (SELECT status FROM drivers WHERE driver_id = NEW.driver_id) <> 'ACTIVE' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Driver is not active';
  END IF;
  IF EXISTS (SELECT 1 FROM trips
             WHERE bus_id = NEW.bus_id AND status IN ('SCHEDULED','IN_PROGRESS')
               AND NEW.scheduled_start < scheduled_end AND NEW.scheduled_end > scheduled_start) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bus already assigned to an overlapping trip';
  END IF;
  IF EXISTS (SELECT 1 FROM trips
             WHERE driver_id = NEW.driver_id AND status IN ('SCHEDULED','IN_PROGRESS')
               AND NEW.scheduled_start < scheduled_end AND NEW.scheduled_end > scheduled_start) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Driver already assigned to an overlapping trip';
  END IF;
END$$

CREATE TRIGGER trg_incident_bi BEFORE INSERT ON incidents FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM trips WHERE trip_id = NEW.trip_id
                 AND bus_id = NEW.bus_id AND driver_id = NEW.driver_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Incident bus/driver does not match the trip';
  END IF;
  IF NEW.severity = 'CRITICAL' AND CHAR_LENGTH(NEW.description) < 20 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Critical incidents need a description of 20+ characters';
  END IF;
END$$

CREATE TRIGGER trg_incident_ai AFTER INSERT ON incidents FOR EACH ROW
BEGIN
  INSERT INTO incident_status_log (incident_id, old_status, new_status, changed_by)
  VALUES (NEW.incident_id, NULL, NEW.status, NEW.reported_by);
  IF NEW.incident_type IN ('BREAKDOWN','ACCIDENT') AND NEW.severity IN ('HIGH','CRITICAL')
     AND NEW.status = 'REPORTED' THEN
    UPDATE buses SET status = 'MAINTENANCE' WHERE bus_id = NEW.bus_id;
  END IF;
END$$

CREATE TRIGGER trg_incident_bu BEFORE UPDATE ON incidents FOR EACH ROW
BEGIN
  IF OLD.status = 'CLOSED' AND NEW.status <> 'CLOSED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Closed incidents cannot be reopened';
  END IF;
  IF NEW.status IN ('RESOLVED','CLOSED') AND NEW.resolved_at IS NULL THEN
    SET NEW.resolved_at = NOW();
  END IF;
END$$

CREATE TRIGGER trg_incident_au AFTER UPDATE ON incidents FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO incident_status_log (incident_id, old_status, new_status, changed_by)
    VALUES (NEW.incident_id, OLD.status, NEW.status, COALESCE(@app_user_id, NEW.reported_by));
  END IF;
END$$

CREATE TRIGGER trg_maint_au AFTER UPDATE ON maintenance_actions FOR EACH ROW
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status <> 'COMPLETED' THEN
    IF NOT EXISTS (SELECT 1 FROM maintenance_actions
                   WHERE bus_id = NEW.bus_id AND status <> 'COMPLETED' AND action_id <> NEW.action_id) THEN
      UPDATE buses SET status = 'AVAILABLE', last_service_date = CURDATE()
      WHERE bus_id = NEW.bus_id AND status = 'MAINTENANCE';
    END IF;
  END IF;
END$$

DELIMITER ;
