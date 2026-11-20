USE transport_db;
-- Q1 JOIN: incident register
SELECT i.incident_id, i.incident_type, i.severity, i.status, b.reg_number, r.route_code, d.full_name AS driver, i.reported_at
FROM incidents i JOIN buses b ON b.bus_id=i.bus_id JOIN drivers d ON d.driver_id=i.driver_id
JOIN trips t ON t.trip_id=i.trip_id JOIN routes r ON r.route_id=t.route_id ORDER BY i.reported_at DESC;
-- Q2 GROUP BY / HAVING: buses with repeated breakdowns
SELECT b.reg_number, COUNT(*) AS breakdowns, MAX(i.reported_at) AS last_seen
FROM incidents i JOIN buses b ON b.bus_id=i.bus_id WHERE i.incident_type='BREAKDOWN'
GROUP BY b.bus_id, b.reg_number HAVING COUNT(*) >= 2 ORDER BY breakdowns DESC;
-- Q3 NESTED: routes above the average incident count
SELECT r.route_code, COUNT(*) AS incidents
FROM incidents i JOIN trips t ON t.trip_id=i.trip_id JOIN routes r ON r.route_id=t.route_id
GROUP BY r.route_id, r.route_code
HAVING COUNT(*) > (SELECT AVG(c) FROM (SELECT COUNT(*) AS c FROM incidents i2 JOIN trips t2 ON t2.trip_id=i2.trip_id GROUP BY t2.route_id) x);
-- Q4 CORRELATED: incidents slower than their own route's average resolution
SELECT i.incident_id, i.incident_type, t.route_id, TIMESTAMPDIFF(MINUTE, i.reported_at, i.resolved_at) AS minutes_taken
FROM incidents i JOIN trips t ON t.trip_id=i.trip_id
WHERE i.resolved_at IS NOT NULL AND TIMESTAMPDIFF(MINUTE, i.reported_at, i.resolved_at) >
  (SELECT AVG(TIMESTAMPDIFF(MINUTE, i2.reported_at, i2.resolved_at)) FROM incidents i2
   JOIN trips t2 ON t2.trip_id=i2.trip_id WHERE t2.route_id=t.route_id AND i2.resolved_at IS NOT NULL);
-- Q5 RECURSIVE CTE: follow-up chains of recurring incidents
WITH RECURSIVE chain AS (
  SELECT incident_id, parent_incident_id, incident_type, reported_at, 1 AS depth, CAST(incident_id AS CHAR(200)) AS path
  FROM incidents WHERE parent_incident_id IS NULL
  UNION ALL
  SELECT c.incident_id, c.parent_incident_id, c.incident_type, c.reported_at, ch.depth+1, CONCAT(ch.path,' > ',c.incident_id)
  FROM incidents c JOIN chain ch ON c.parent_incident_id = ch.incident_id)
SELECT path, depth, incident_type, reported_at FROM chain WHERE depth > 1 ORDER BY path;
-- Q6 CTE + window function: bus risk ranking
WITH bus_stats AS (
  SELECT b.bus_id, b.reg_number,
    (SELECT COUNT(*) FROM incidents i WHERE i.bus_id=b.bus_id) AS incidents,
    (SELECT COUNT(*) FROM trips t WHERE t.bus_id=b.bus_id AND t.status='COMPLETED') AS trips_done
  FROM buses b)
SELECT reg_number, incidents, trips_done, ROUND(incidents/NULLIF(trips_done,0),2) AS incidents_per_trip,
       RANK() OVER (ORDER BY incidents DESC) AS risk_rank FROM bus_stats;
-- Q7 Function and view usage
SELECT route_code, fn_avg_resolution_hours(route_id) AS avg_hrs FROM routes;
SELECT * FROM v_route_performance ORDER BY total_incidents DESC;
-- Q8 Full-text search
SELECT incident_id, incident_type, description,
  MATCH(description, location_desc) AGAINST ('brake failure' IN NATURAL LANGUAGE MODE) AS score
FROM incidents WHERE MATCH(description, location_desc) AGAINST ('brake failure' IN NATURAL LANGUAGE MODE) ORDER BY score DESC;
-- Q9 Monthly trend
SELECT DATE_FORMAT(reported_at,'%Y-%m') AS month, incident_type, COUNT(*) AS n FROM incidents GROUP BY month, incident_type ORDER BY month, n DESC;
-- DML UPDATE / DELETE examples
UPDATE drivers SET experience_years = experience_years + 1 WHERE driver_id = 2;
UPDATE trips SET status = 'CANCELLED' WHERE trip_id = 5 AND status = 'SCHEDULED';
DELETE FROM incident_status_log WHERE changed_at < NOW() - INTERVAL 2 YEAR;
