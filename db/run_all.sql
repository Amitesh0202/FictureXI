-- FixtureXI : build the whole database on a FRESH schema.
-- In SQL*Plus / SQLcl, from inside the db folder:   @run_all.sql
-- (In SQL Developer, open and run each file below in this order.)

@01_schema.sql
@02a_views_procs.sql
@02b_triggers.sql
@05_seed.sql

-- Optional demos (run any time after the seed):
--   @03_queries.sql          report queries Q1-Q3 (set :tid first)
--   @03b_queries_more.sql    report queries Q4-Q5
--   @04_integrity_demo.sql   eight rejected operations
