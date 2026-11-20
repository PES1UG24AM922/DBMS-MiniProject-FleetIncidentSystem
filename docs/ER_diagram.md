# ER Diagram

The [PNG export](ER_diagram.png) shows the foreign-key map. The editable Mermaid diagram below includes cardinalities and key attributes.

```mermaid
erDiagram
    DRIVERS o|--o| USERS : "has login"
    DRIVERS ||--o{ TRIPS : drives
    BUSES ||--o{ TRIPS : "assigned to"
    ROUTES ||--o{ TRIPS : "scheduled on"
    ROUTES ||--o{ ROUTE_STOPS : has
    STOPS ||--o{ ROUTE_STOPS : "served by"
    TRIPS ||--o{ INCIDENTS : "has"
    BUSES ||--o{ INCIDENTS : involves
    DRIVERS ||--o{ INCIDENTS : involves
    USERS ||--o{ INCIDENTS : reports
    INCIDENTS o|--o{ INCIDENTS : "follow-up of"
    INCIDENTS ||--o{ MAINTENANCE_ACTIONS : "fixed by"
    BUSES ||--o{ MAINTENANCE_ACTIONS : "serviced in"
    USERS ||--o{ MAINTENANCE_ACTIONS : "assigned to"
    INCIDENTS ||--o{ INCIDENT_STATUS_LOG : audited
    USERS ||--o{ INCIDENT_STATUS_LOG : "changed by"

    DRIVERS {
        int driver_id PK
        string license_no UK
        string phone
        string status
    }
    USERS {
        int user_id PK
        string username UK
        string email UK
        string role
        int driver_id FK,UK
    }
    BUSES {
        int bus_id PK
        string reg_number UK
        int capacity
        string status
    }
    ROUTES {
        int route_id PK
        string route_code UK
        decimal distance_km
    }
    STOPS {
        int stop_id PK
        string stop_name UK
        decimal latitude
        decimal longitude
    }
    ROUTE_STOPS {
        int route_id PK,FK
        int stop_id PK,FK
        int stop_sequence
    }
    TRIPS {
        int trip_id PK
        int route_id FK
        int bus_id FK
        int driver_id FK
        datetime scheduled_start
        string status
    }
    INCIDENTS {
        int incident_id PK
        int trip_id FK
        int bus_id FK
        int driver_id FK
        int reported_by FK
        int parent_incident_id FK
        string incident_type
        string severity
        string status
    }
    MAINTENANCE_ACTIONS {
        int action_id PK
        int incident_id FK
        int bus_id FK
        int assigned_to FK
        decimal cost
        string status
    }
    INCIDENT_STATUS_LOG {
        bigint log_id PK
        int incident_id FK
        string old_status
        string new_status
        int changed_by FK
    }
```

**Cardinalities.** Routes and stops are many-to-many through `ROUTE_STOPS`. A trip uses one route, one bus and one driver. An incident belongs to one trip and may follow up an earlier incident (self reference, used for recurring-issue chains). One incident can lead to several maintenance actions. Every status change is logged.

**NoSQL link.** MongoDB `incident_reports.incident_id` equals `INCIDENTS.incident_id`; `bus_telemetry.bus_id` equals `BUSES.bus_id`.
