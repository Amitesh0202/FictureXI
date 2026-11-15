# FixtureXI

Tournament match-up and scorecard system (cricket, T20, single round-robin).
Given the teams registered in a tournament, the **database** generates the full fixture list (every team meets every other team once, in dated rounds). It also stores batting/bowling scorecards and squads, and gives reports (points table, run scorers, wicket leaders).

**Course:** DBMS project, BITS Pilani Hyderabad Campus - **Team:** group 3

## Team members

| Member | ID |
|---|---|
| Amitesh | 2024A3PS0413H |
| Arvind | 2024A3PS0398H |
| Harshil | 2024A3PS0364H |
| Tanuj | 2024A3PS0451H |
| Eshwar | 2024A3PS0439H |

## Tech stack

Browser (HTML / CSS / JavaScript) -> Node.js + Express REST API -> Oracle Database 19c+ (`node-oracledb`).
The API has no business rules: rules live in the database (CHECK / UNIQUE / FOREIGN KEY, triggers, procedures) and Oracle's error is passed back to the page.

## Repository layout

```
db/        01_schema.sql  02a_views_procs.sql  02b_triggers.sql  03_queries.sql  03b_queries_more.sql
           04_integrity_demo.sql  05_seed.sql  run_all.sql
tools/     generate_seed.py        (creates db/05_seed.sql)
backend/   server.js  db.js  routes/ (tournaments, masterdata, matches, integrity, reports)
frontend/  index, match, teams, reports, integrity pages (+ common.js, style.css)
docs/      FixtureXI_Design_Document_Final.pdf   (ER/EER, schema, normalization)
```

## Setup and run

1. **Database** - create an Oracle user/schema, then (SQL*Plus or SQLcl, inside `db/`):
   ```
   @run_all.sql
   ```
   This runs, in order: `01_schema.sql`, `02a_views_procs.sql`, `02b_triggers.sql`, `05_seed.sql` (946 sample rows).
   Run it on a **fresh** schema - the seed assumes identity ids start at 1.
2. **Backend** -
   ```
   cd backend
   npm install
   copy .env.example to .env and fill in DB_USER, DB_PASSWORD, DB_CONNECT
   npm start
   ```
3. Open **http://localhost:3000** (the Express server also serves the `frontend/` pages).

To regenerate the sample data: `python tools/generate_seed.py`.

## Application workflows

| # | Workflow | Database aspect |
|---|---|---|
| W1 | **Generate fixtures** - register teams, press *Generate fixtures* (Tournaments page; tournament 2 in the seed is ready for this) | stored procedure `GENERATE_FIXTURES`, row lock, many inserts in one transaction |
| W2 | **Record a scorecard** - open a scheduled match, enter both innings, save | transaction with `SAVEPOINT`/`ROLLBACK`, triggers, procedure `COMPLETE_MATCH`, view `V_TEAM_SCORE` |
| W3 | **Browse and report** - fixtures, scorecards, squads, player profile, points table, leaders | joins, GROUP BY, subqueries, CTEs, window functions (Q1-Q5) |
| W4 | **Integrity lab** - 8 invalid operations, each rejected by the database | CHECK, UNIQUE, composite FK, triggers, procedure errors |

## DBMS features used

Stored procedures (2), triggers (2), views (2), transactions (savepoint + rollback), indexes (5), CHECK / UNIQUE / PRIMARY KEY / FOREIGN KEY constraints, 5 non-trivial queries. Full explanation in `docs/FixtureXI_Design_Document_Final.pdf`.

## Member contributions

Every member did both database work and application work.

| Member | Database / design work | Application work |
|---|---|---|
| Amitesh [2024A3PS0413H] | Requirements, EER diagram, ER-to-relational mapping, normalization, design document (`docs/`); report queries Q1-Q3 (`db/03_queries.sql`) | `server.js`, tournaments route (`routes/tournaments.js`), Tournaments page (W1) |
| Arvind [2024A3PS0398H] | Schema DDL, keys, constraints and indexes (`db/01_schema.sql`) | Teams / players / venues API (`routes/masterdata.js`) and Teams & Players page: add, edit, delete, search, player profile |
| Harshil [2024A3PS0364H] | Views `V_TEAM_SCORE`, `V_FIXTURE_LIST`; procedures `GENERATE_FIXTURES`, `COMPLETE_MATCH` (`db/02a_views_procs.sql`) | Scorecard API with the savepoint transaction (`routes/matches.js`) and Scorecard page (W2) |
| Tanuj [2024A3PS0451H] | Triggers (`db/02b_triggers.sql`), integrity demo and constraint testing (`db/04_integrity_demo.sql`) | Database helper `db.js` (connection pool, transaction helper, readable Oracle error messages), shared page helpers (`common.js`, `style.css`), Integrity-lab API (`routes/integrity.js`) and Integrity Lab page (W4) |
| Eshwar [2024A3PS0439H] | Sample-data generator and seed (`tools/generate_seed.py`, `db/05_seed.sql`), report queries Q4-Q5 (`db/03b_queries_more.sql`), `db/run_all.sql` | Reports API (`routes/reports.js`), Reports page (W3), README |
