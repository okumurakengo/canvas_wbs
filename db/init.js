module.exports = db => {
  db.run(
    `CREATE TABLE IF NOT EXISTS work_tbl (
          work_id   INTEGER PRIMARY KEY AUTOINCREMENT,
          work_name VARCHAR(50) NOT NULL,
          created   DATETIME NOT NULL DEFAULT (DATETIME('now','+9 hours'))
        );`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS task_tbl (
          task_id   INTEGER PRIMARY KEY AUTOINCREMENT,
          work_id   INTEGER NOT NULL,
          task_name VARCHAR(255) NOT NULL,
          plan_time REAL NOT NULL,
          rate      INTEGER NOT NULL DEFAULT 0,
          created   DATETIME NOT NULL DEFAULT (DATETIME('now','+9 hours'))
        );`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS time_tbl (
          time_id   INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id   INTEGER NOT NULL,
          real_time REAL NOT NULL DEFAULT 0,
          created   DATETIME NOT NULL DEFAULT (DATETIME('now','+9 hours'))
        );`
  );
};
