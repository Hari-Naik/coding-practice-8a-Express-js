const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (reqQuery) => {
  return reqQuery.status !== undefined;
};

const hasPriorityProperty = (reqQuery) => {
  return reqQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (reqQuery) => {
  return reqQuery.status !== undefined && reqQuery.priority !== undefined;
};

app.get("/todos/", async (req, res) => {
  let getTodosQuery = "";
  const { search_q, priority, status } = req.query;
  switch (true) {
    case hasStatusProperty(req.query):
      getTodosQuery = `SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%' AND
          status=${status};`;
      break;
    case hasPriorityProperty(req.query):
      getTodosQuery = `SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%' AND
          priority=${priority};`;
      break;
    case hasPriorityAndStatusProperty(req.query):
      getTodosQuery = `SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%' AND
          priority=${priority} AND 
          status=${status};`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  let data = await db.all(getTodosQuery);
  res.send(data);
});

//API 2

app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;

  const getTodoQuery = `SELECT * FORM todo WHERE id = ${todoId}`;

  const data = db.get(getTodoQuery);
  res.send(data);
});

//API 3

app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status } = req.body;
  const createTodoQuery = `INSERT INTO todo (id, todo, priority, status)
    VALUES (id, todo, priority, status);`;

  db.run(createTodoQuery);
  res.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  let updateColumn = "";
  const requestBody = req.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = req.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  res.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});

module.exports = app;
