# FixtureXI

Tournament match-up and scorecard system. Given the teams registered in a tournament, the database generates the full round-robin fixture list; it also stores batting/bowling scorecards, squads and reports.

**Team:** group 3

## Tech stack
Browser web app (HTML/CSS/JS) - Node.js + Express REST API - Oracle Database 19c+ (node-oracledb).

## Setup (database)
Run in this order (SQL*Plus / SQLcl / SQL Developer, on a fresh schema):
1. `db/01_schema.sql`  - tables, keys, constraints, indexes
2. `db/02_views_procs_triggers.sql` - views, GENERATE_FIXTURES, COMPLETE_MATCH, triggers
3. `db/05_seed.sql`  - sample data (946 rows; regenerate with `python tools/generate_seed.py`)
4. `db/03_queries.sql` - five report queries; `db/04_integrity_demo.sql` - eight rejected operations

Backend / frontend setup: _to be added when the application layer is committed._

## Workflows
1. **Generate fixtures** - register teams, call GENERATE_FIXTURES (tournament 2 in the seed data is ready for this).
2. **Record a scorecard** - insert batting/bowling rows and call COMPLETE_MATCH in one transaction.
3. **Browse and report** - fixtures, scorecards, squads, player profiles, points table, leaders.
4. **Integrity demo** - invalid operations rejected by constraints, triggers and procedures.

## Progress
Database layer written (schema, procedures, triggers, views, queries, seed). Backend and frontend to be added later.

## Member contributions
Application-layer (backend / frontend) tasks will be assigned later.

| Member | Contribution |
|---|---|
| Member 1 [Amitesh - 2024A3PS0413H] | Requirements, EER diagram, relational mapping, normalization, design document |
| Member 2 [Arvind - 2024A3PS0398H] | Schema DDL, constraints and indexes (`01_schema.sql`) |
| Member 3 [Harshil - 2024A3PS0364H] | Views, GENERATE_FIXTURES and COMPLETE_MATCH (`02_views_procs_triggers.sql`) |
| Member 4 [Tanuj - 2024A3PS0451H] | Triggers (`02_views_procs_triggers.sql`), integrity demo and constraint testing (`04_integrity_demo.sql`) |
| Member 5 [Eshwar - 2024A3PS0439H] | Sample-data generator and seed (`05_seed.sql`), report queries Q1-Q5 (`03_queries.sql`), README |
