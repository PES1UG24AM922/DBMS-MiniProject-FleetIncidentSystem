USE transport_db;
INSERT INTO drivers (full_name, license_no, phone, experience_years) VALUES
 ('Ravi Kumar',   'KA0120230001', '9845012345', 8),
 ('Anita Sharma', 'KA0120230002', '9880123456', 5),
 ('Mohan Das',    'KA0120230003', '9741234567', 12);

INSERT INTO buses (reg_number, model, capacity, purchase_date) VALUES
 ('KA01F1001', 'Tata Starbus 12m',  50, '2021-03-10'),
 ('KA01F1002', 'Ashok Leyland 12m', 55, '2022-06-15'),
 ('KA01F1003', 'Volvo 9400',        45, '2023-01-20');

INSERT INTO routes (route_code, route_name, origin, destination, distance_km) VALUES
 ('R101', 'Majestic - Whitefield',       'Majestic',   'Whitefield',      24.5),
 ('R202', 'Silk Board - Electronic City','Silk Board', 'Electronic City', 14.0);

INSERT INTO stops (stop_name, latitude, longitude) VALUES
 ('Majestic',        12.977500, 77.572800),
 ('Indiranagar',     12.971900, 77.641200),
 ('Whitefield',      12.969800, 77.750000),
 ('Silk Board',      12.917000, 77.623000),
 ('Electronic City', 12.845200, 77.660300);

INSERT INTO route_stops VALUES (1,1,1),(1,2,2),(1,3,3),(2,4,1),(2,5,2);

-- Placeholder hashes: run `npm run seed:users` to set the demo password (Demo@1234)
INSERT INTO users (username, email, password_hash, role, driver_id) VALUES
 ('admin',    'admin@transit.test',   '$2b$10$REPLACE_WITH_BCRYPT_HASH', 'ADMIN',   NULL),
 ('manager1', 'manager@transit.test', '$2b$10$REPLACE_WITH_BCRYPT_HASH', 'MANAGER', NULL),
 ('ravi',     'ravi@transit.test',    '$2b$10$REPLACE_WITH_BCRYPT_HASH', 'DRIVER',  1),
 ('anita',    'anita@transit.test',   '$2b$10$REPLACE_WITH_BCRYPT_HASH', 'DRIVER',  2);

INSERT INTO trips (route_id, bus_id, driver_id, scheduled_start, scheduled_end, actual_start, actual_end, status) VALUES
 (1,1,1,'2026-10-20 08:00','2026-10-20 09:30','2026-10-20 08:02','2026-10-20 09:41','COMPLETED'),
 (1,2,2,'2026-10-21 08:00','2026-10-21 09:30','2026-10-21 08:00','2026-10-21 09:28','COMPLETED'),
 (2,1,1,'2026-10-22 10:00','2026-10-22 12:00','2026-10-22 10:00','2026-10-22 12:20','COMPLETED'),
 (2,3,3,'2026-10-23 10:00','2026-10-23 12:00','2026-10-23 10:05','2026-10-23 12:01','COMPLETED');
INSERT INTO trips (route_id, bus_id, driver_id, scheduled_start, scheduled_end) VALUES
 (1,1,1,'2026-11-20 08:00','2026-11-20 09:30');

INSERT INTO incidents (trip_id,bus_id,driver_id,reported_by,parent_incident_id,incident_type,severity,location_desc,description,status,reported_at,resolved_at) VALUES
 (1,1,1,3,NULL,'DELAY','MEDIUM','Hebbal flyover','Heavy traffic caused a 30 minute delay','RESOLVED','2026-10-20 08:40','2026-10-20 09:10'),
 (3,1,1,3,NULL,'BREAKDOWN','MEDIUM','Silk Board junction','Engine overheating, brake pad wear noticed','RESOLVED','2026-10-22 10:30','2026-10-22 14:30'),
 (3,1,1,3,2,'BREAKDOWN','MEDIUM','Silk Board depot','Recurring brake failure warning after repair','RESOLVED','2026-10-23 09:00','2026-10-23 12:00'),
 (2,2,2,4,NULL,'OVERCROWDING','LOW','Indiranagar stop','Standing passengers beyond capacity','RESOLVED','2026-10-21 08:20','2026-10-21 08:50'),
 (4,3,3,2,NULL,'COMPLAINT','LOW','Electronic City','Passenger complaint about rude conduct','RESOLVED','2026-10-23 11:00','2026-10-23 11:40');

-- Live workflow through procedures (HIGH breakdown on the upcoming trip 5)
CALL sp_report_incident(5, 'BREAKDOWN', 'HIGH', 'Whitefield depot',
     'Brake failure detected during pre-trip inspection', 3, 1, @new_inc);
CALL sp_assign_maintenance(@new_inc, 2, 'Replace brake pads and inspect hydraulics', 8500.00);
CALL sp_resolve_incident(@new_inc, 2);
