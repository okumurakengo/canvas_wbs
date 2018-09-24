const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const fs = require("fs");
const sqlite3 = require("sqlite3");
const dbInit = require("./db/init");

const server = require("ws").Server;
const s = new server({ port: 5000 });

s.on("connection", ws => {
  ws.on("message", message => {
    console.log("Received: " + message);

    s.clients.forEach(client => {
      client.send(message + " : " + new Date());
    });
  });

  ws.on("close", () => {
    console.log("I lost a client");
  });
});

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const db = new sqlite3.Database(__dirname + "/db/db.sqlite3");

if (!fs.existsSync(__dirname + "/db/db.sqlite3")) {
  // 初期化処理
  dbInit(db);
}

app.get("/api/list/:id?", (req, res) => {
  new Promise(resolve => {
    db.all(
      `SELECT a.*, IFNULL(b.real_time, 0) real_time
       FROM task_tbl a
       LEFT JOIN (SELECT task_id, SUM(real_time) real_time FROM time_tbl GROUP BY task_id) b
       ON a.task_id = b.task_id
       WHERE a.work_id = ?`,
      [req.params.id],
      (err, rows) => {
        resolve(rows);
      }
    );
  }).then(rows => {
    res.json({ data: rows });
  });
});

app.get("/api/max/:id?", (req, res) => {
  new Promise(resolve => {
    db.get(
      `SELECT SUM(a.plan_time) plan_time_sum, 
              SUM(IFNULL(b.real_time, 0)) real_time_sum,
              AVG(IFNULL(a.rate, 0)) rate
       FROM task_tbl a
       LEFT JOIN (SELECT task_id, SUM(real_time) real_time FROM time_tbl GROUP BY task_id) b
       ON a.task_id = b.task_id
       WHERE a.work_id = ?`,
      [req.params.id],
      (err, rows) => {
        resolve(rows);
      }
    );
  }).then(rows => {
    res.json({ data: rows });
  });
});

app.get("/api/:target/:belongs_id?", (req, res) => {
  new Promise(resolve => {
    switch (req.params.target) {
      case "work":
        db.all(
          "SELECT work_id id, work_name name FROM work_tbl ORDER BY created DESC",
          (err, rows) => resolve(rows)
        );
        break;
      case "task":
        db.all(
          `SELECT task_id id, task_name name, plan_time, rate
           FROM task_tbl WHERE work_id = ${req.params.belongs_id ||
             "(SELECT work_id FROM work_tbl ORDER BY created DESC LIMIT 1)"}
           ORDER BY created`,
          (err, rows) => {
            resolve(rows);
          }
        );
        break;
      case "time":
        db.all(
          `SELECT a.time_id id, a.real_time, a.created, b.task_name name
           FROM time_tbl a
           LEFT JOIN task_tbl b ON a.task_id = b.task_id
           WHERE a.task_id = ${req.params.belongs_id ||
             "(SELECT task_id FROM task_tbl ORDER BY created DESC LIMIT 1)"}
           ORDER BY a.created DESC`,
          (err, rows) => {
            resolve(rows);
          }
        );
        break;
    }
  }).then(rows => {
    res.json({ data: rows });
  });
});

app.post("/api", (req, res) => {
  switch (req.body.type) {
    case "work":
      db.prepare("INSERT INTO work_tbl (work_name) VALUES (?)").run([
        req.body.work_name,
      ]);
      break;
    case "task":
      db.prepare(
        "INSERT INTO task_tbl (work_id,task_name,plan_time,rate) VALUES (?,?,?,?)"
      ).run([
        req.body.work_id,
        req.body.task_name,
        req.body.plan_time,
        req.body.rate,
      ]);
      break;
    case "time":
      db.prepare("INSERT INTO time_tbl (task_id,real_time) VALUES (?,?)").run([
        req.body.task_id,
        req.body.real_time,
      ]);
      break;
  }
  res.json({ status: "success" });
});

app.put("/api", (req, res) => {
  switch (req.body.type) {
    case "work":
      db.prepare("UPDATE work_tbl SET work_name = ? WHERE work_id = ?").run([
        req.body.value,
        req.body.id,
      ]);
      break;
    case "task":
      db.prepare(
        `UPDATE task_tbl SET ${
          req.body.item === "name" ? "task_name" : req.body.item
        } = ? WHERE task_id = ?`
      ).run([req.body.value, req.body.id]);
      break;
    case "time":
      db.prepare(`UPDATE time_tbl SET real_time = ? WHERE time_id = ?`).run([
        req.body.value,
        req.body.id,
      ]);
      break;
  }
  res.json({ status: "success" });
});

app.delete("/api", (req, res) => {
  switch (req.body.type) {
    case "work":
      db.prepare("DELETE from work_tbl WHERE work_id = ?").run([req.body.id]);
      break;
    case "task":
      db.prepare("DELETE from task_tbl WHERE task_id = ?").run([req.body.id]);
      break;
    case "time":
      db.prepare("DELETE from time_tbl WHERE time_id = ?").run([req.body.id]);
      break;
  }
  res.json({ status: "success" });
});

app.listen(3000);
console.log("server starting");
