-- Public Transport Incident and Fleet Management System : schema (DDL)
DROP DATABASE IF EXISTS transport_db;
CREATE DATABASE transport_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transport_db;

CREATE TABLE drivers (
  driver_id        INT AUTO_INCREMENT PRIMARY KEY,
  full_name        VARCHAR(100) NOT NULL,
  license_no       VARCHAR(20)  NOT NULL UNIQUE,
  phone            CHAR(10)     NOT NULL,
  experience_years TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status           ENUM('ACTIVE','ON_LEAVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_driver_phone CHECK (phone REGEXP '^[6-9][0-9]{9}$'),
  CONSTRAINT chk_driver_exp   CHECK (experience_years <= 50)
) ENGINE=InnoDB;

CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('ADMIN','MANAGER','DRIVER') NOT NULL,
  driver_id     INT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_driver FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
  CONSTRAINT chk_users_email CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT chk_users_driver_role CHECK (role <> 'DRIVER' OR driver_id IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE buses (
  bus_id            INT AUTO_INCREMENT PRIMARY KEY,
  reg_number        VARCHAR(15) NOT NULL UNIQUE,
  model             VARCHAR(60) NOT NULL,
  capacity          SMALLINT UNSIGNED NOT NULL,
  status            ENUM('AVAILABLE','ON_TRIP','MAINTENANCE','RETIRED') NOT NULL DEFAULT 'AVAILABLE',
  purchase_date     DATE NOT NULL,
  last_service_date DATE NULL,
  CONSTRAINT chk_bus_capacity CHECK (capacity BETWEEN 10 AND 120),
  CONSTRAINT chk_bus_dates CHECK (last_service_date IS NULL OR last_service_date >= purchase_date)
) ENGINE=InnoDB;

CREATE TABLE routes (
  route_id    INT AUTO_INCREMENT PRIMARY KEY,
  route_code  VARCHAR(10)  NOT NULL UNIQUE,
  route_name  VARCHAR(100) NOT NULL,
  origin      VARCHAR(80)  NOT NULL,
  destination VARCHAR(80)  NOT NULL,
  distance_km DECIMAL(6,2) NOT NULL,
  CONSTRAINT chk_route_distance CHECK (distance_km > 0),
  CONSTRAINT chk_route_ends CHECK (origin <> destination)
) ENGINE=InnoDB;

CREATE TABLE stops (
  stop_id   INT AUTO_INCREMENT PRIMARY KEY,
  stop_name VARCHAR(100) NOT NULL UNIQUE,
  latitude  DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  CONSTRAINT chk_stop_lat CHECK (latitude  BETWEEN -90  AND 90),
  CONSTRAINT chk_stop_lng CHECK (longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB;

CREATE TABLE route_stops (
  route_id      INT NOT NULL,
  stop_id       INT NOT NULL,
  stop_sequence SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (route_id, stop_id),
  UNIQUE KEY uq_route_seq (route_id, stop_sequence),
  CONSTRAINT fk_rs_route FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
  CONSTRAINT fk_rs_stop  FOREIGN KEY (stop_id)  REFERENCES stops(stop_id)
) ENGINE=InnoDB;

CREATE TABLE trips (
  trip_id         INT AUTO_INCREMENT PRIMARY KEY,
  route_id        INT NOT NULL,
  bus_id          INT NOT NULL,
  driver_id       INT NOT NULL,
  scheduled_start DATETIME NOT NULL,
  scheduled_end   DATETIME NOT NULL,
  actual_start    DATETIME NULL,
  actual_end      DATETIME NULL,
  status ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  CONSTRAINT fk_trip_route  FOREIGN KEY (route_id)  REFERENCES routes(route_id),
  CONSTRAINT fk_trip_bus    FOREIGN KEY (bus_id)    REFERENCES buses(bus_id),
  CONSTRAINT fk_trip_driver FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
  CONSTRAINT chk_trip_sched CHECK (scheduled_end > scheduled_start),
  CONSTRAINT chk_trip_actual CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start)
) ENGINE=InnoDB;

CREATE TABLE incidents (
  incident_id        INT AUTO_INCREMENT PRIMARY KEY,
  trip_id            INT NOT NULL,
  bus_id             INT NOT NULL,
  driver_id          INT NOT NULL,
  reported_by        INT NOT NULL,
  parent_incident_id INT NULL,
  incident_type ENUM('BREAKDOWN','ACCIDENT','DELAY','OVERCROWDING','COMPLAINT') NOT NULL,
  severity      ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
  location_desc VARCHAR(150) NOT NULL,
  description   TEXT NOT NULL,
  status        ENUM('REPORTED','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'REPORTED',
  reported_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at   DATETIME NULL,
  CONSTRAINT fk_inc_trip   FOREIGN KEY (trip_id)     REFERENCES trips(trip_id),
  CONSTRAINT fk_inc_bus    FOREIGN KEY (bus_id)      REFERENCES buses(bus_id),
  CONSTRAINT fk_inc_driver FOREIGN KEY (driver_id)   REFERENCES drivers(driver_id),
  CONSTRAINT fk_inc_user   FOREIGN KEY (reported_by) REFERENCES users(user_id),
  CONSTRAINT fk_inc_parent FOREIGN KEY (parent_incident_id) REFERENCES incidents(incident_id) ON DELETE SET NULL,
  CONSTRAINT chk_inc_desc  CHECK (CHAR_LENGTH(description) >= 5),
  CONSTRAINT chk_inc_resolved CHECK (resolved_at IS NULL OR resolved_at >= reported_at),
  FULLTEXT KEY ft_inc_description (description, location_desc)
) ENGINE=InnoDB;

CREATE TABLE maintenance_actions (
  action_id    INT AUTO_INCREMENT PRIMARY KEY,
  incident_id  INT NOT NULL,
  bus_id       INT NOT NULL,
  assigned_to  INT NOT NULL,
  action_desc  VARCHAR(255) NOT NULL,
  cost         DECIMAL(10,2) NOT NULL DEFAULT 0,
  status       ENUM('OPEN','COMPLETED') NOT NULL DEFAULT 'OPEN',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_ma_incident FOREIGN KEY (incident_id) REFERENCES incidents(incident_id),
  CONSTRAINT fk_ma_bus      FOREIGN KEY (bus_id)      REFERENCES buses(bus_id),
  CONSTRAINT fk_ma_user     FOREIGN KEY (assigned_to) REFERENCES users(user_id),
  CONSTRAINT chk_ma_cost    CHECK (cost >= 0)
) ENGINE=InnoDB;

CREATE TABLE incident_status_log (
  log_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT NOT NULL,
  old_status  VARCHAR(15) NULL,
  new_status  VARCHAR(15) NOT NULL,
  changed_by  INT NOT NULL,
  changed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_inc  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE,
  CONSTRAINT fk_log_user FOREIGN KEY (changed_by)  REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Indexes
CREATE INDEX idx_inc_bus_time    ON incidents (bus_id, reported_at);
CREATE INDEX idx_inc_trip        ON incidents (trip_id);
CREATE INDEX idx_inc_status_sev  ON incidents (status, severity);
CREATE INDEX idx_trip_route_time ON trips (route_id, scheduled_start);
CREATE INDEX idx_trip_bus_time   ON trips (bus_id, scheduled_start, scheduled_end);
CREATE INDEX idx_trip_driver_time ON trips (driver_id, scheduled_start, scheduled_end);

-- ALTER / DROP demonstrations
ALTER TABLE buses   ADD COLUMN fuel_type ENUM('DIESEL','CNG','ELECTRIC') NOT NULL DEFAULT 'DIESEL';
ALTER TABLE drivers ADD COLUMN joined_on DATE NULL;
ALTER TABLE routes  MODIFY route_name VARCHAR(150) NOT NULL;
ALTER TABLE drivers DROP COLUMN joined_on;
CREATE INDEX idx_tmp ON buses (model);
DROP INDEX idx_tmp ON buses;
