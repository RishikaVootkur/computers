# Entity Relationship Diagram — Rishika Computers Platform

## What is this file?
This file describes the database design — meaning, what data we store
and how different pieces of data are connected to each other.

---

## Enum reference
(These are the fixed options for certain fields)

| Field | Allowed values |
|---|---|
| user.role | OWNER, STAFF, CUSTOMER |
| service_job.device_type | LAPTOP, DESKTOP, PRINTER, MONITOR, UPS, OTHER |
| service_job.status | RECEIVED, DIAGNOSED, IN_PROGRESS, WAITING_FOR_PARTS, COMPLETED, DELIVERED, CANCELLED |
| attendance.status | PRESENT, ABSENT, HALF_DAY |
| salary_record.payment_status | PENDING, PARTIAL, PAID |
| salary_payment.payment_mode | CASH, PHONEPE |

---

## Key design decisions

- Every table has a `shop_id` column — this is what allows the app to
  later support multiple shops (SaaS). Every piece of data belongs to a shop.
- `USER` = anyone who logs into the system.
- `STAFF` = a user who also has salary and attendance records.
- `JOB_STATUS_LOG` = a full history of every status change on a service job.
  Tells us who changed what and when. Full accountability.
- `SALARY_RECORD` = one record per staff member per month.
- `SALARY_PAYMENT` = multiple payment entries against one salary record.
  This handles partial payments (advance + balance).

---

## Diagram
```mermaid
erDiagram
  SHOP {
    uuid id PK
    string name
    string address
    string phone
    string email
    timestamp created_at
  }

  USER {
    uuid id PK
    uuid shop_id FK
    string name
    string email
    string phone
    enum role
    boolean is_active
    timestamp created_at
  }

  CUSTOMER {
    uuid id PK
    uuid shop_id FK
    string name
    string phone
    string email
    timestamp created_at
  }

  SERVICE_JOB {
    uuid id PK
    uuid shop_id FK
    uuid customer_id FK
    uuid assigned_to FK
    string job_number
    enum device_type
    string problem_notes
    string remarks
    decimal estimated_amount
    decimal final_amount
    enum status
    timestamp created_at
    timestamp updated_at
    timestamp completed_at
  }

  JOB_STATUS_LOG {
    uuid id PK
    uuid job_id FK
    uuid changed_by FK
    enum old_status
    enum new_status
    string notes
    timestamp changed_at
  }

  STAFF {
    uuid id PK
    uuid user_id FK
    uuid shop_id FK
    decimal monthly_salary
    date joined_on
    boolean is_active
  }

  ATTENDANCE {
    uuid id PK
    uuid staff_id FK
    date date
    enum status
    string notes
  }

  SALARY_RECORD {
    uuid id PK
    uuid staff_id FK
    int month
    int year
    decimal days_present
    decimal per_day_rate
    decimal total_earned
    decimal total_paid
    enum payment_status
  }

  SALARY_PAYMENT {
    uuid id PK
    uuid salary_record_id FK
    decimal amount
    enum payment_mode
    date paid_on
    string reference
    string notes
  }

  SHOP ||--o{ USER : "has"
  SHOP ||--o{ CUSTOMER : "has"
  SHOP ||--o{ SERVICE_JOB : "has"
  SHOP ||--o{ STAFF : "has"
  CUSTOMER ||--o{ SERVICE_JOB : "raises"
  USER ||--o{ SERVICE_JOB : "assigned to"
  SERVICE_JOB ||--o{ JOB_STATUS_LOG : "tracks"
  USER ||--o{ JOB_STATUS_LOG : "logs"
  USER ||--|| STAFF : "is"
  STAFF ||--o{ ATTENDANCE : "has"
  STAFF ||--o{ SALARY_RECORD : "has"
  SALARY_RECORD ||--o{ SALARY_PAYMENT : "has"
```