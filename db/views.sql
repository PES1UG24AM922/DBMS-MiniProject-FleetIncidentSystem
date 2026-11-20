USE transport_db;
CREATE OR REPLACE VIEW v_incident_details AS
SELECT i.incident_id, i.incident_type, i.severity, i.status, i.reported_at, i.resolved_at,
       TIMESTAMPDIFF(MINUTE, i.reported_at, i.resolved_at) AS resolution_minutes,
       b.reg_number, r.route_code, d.full_name AS driver_name, i.location_desc
FROM incidents i
JOIN buses   b ON b.bus_id    = i.bus_id
JOIN drivers d ON d.driver_id = i.driver_id
JOIN trips   t ON t.trip_id   = i.trip_id
JOIN routes  r ON r.route_id  = t.route_id;

CREATE OR REPLACE VIEW v_route_performance AS
SELECT r.route_id, r.route_code, r.route_name,
       COUNT(DISTINCT t.trip_id) AS total_trips,
       COUNT(i.incident_id)      AS total_incidents,
       ROUND(COUNT(i.incident_id) / NULLIF(COUNT(DISTINCT t.trip_id),0), 2) AS incidents_per_trip,
       ROUND(AVG(TIMESTAMPDIFF(MINUTE, i.reported_at, i.resolved_at))/60, 2) AS avg_resolution_hrs
FROM routes r
LEFT JOIN trips t     ON t.route_id = r.route_id
LEFT JOIN incidents i ON i.trip_id  = t.trip_id
GROUP BY r.route_id, r.route_code, r.route_name;

CREATE OR REPLACE VIEW v_fleet_utilization AS
SELECT b.bus_id, b.reg_number, b.status,
       (SELECT COUNT(*) FROM trips t WHERE t.bus_id = b.bus_id AND t.status='COMPLETED') AS completed_trips,
       (SELECT COUNT(*) FROM incidents i WHERE i.bus_id = b.bus_id) AS incident_count
FROM buses b;
