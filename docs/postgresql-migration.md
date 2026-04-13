# PostgreSQL migration

Switch the Prisma datasource to PostgreSQL, replace the SQLite FTS5 strategy with PostgreSQL text search, and update worker job-claim logic to use transactional locking for multiple workers.
