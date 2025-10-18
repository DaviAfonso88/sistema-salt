import express from "express";
import cors from "cors";
import pkg from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET || "minha_chave_secreta";

// ================== POOL ==================
let pool;
if (!global.pgPool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
  global.pgPool = pool;
} else {
  pool = global.pgPool;
}

// ================== CRIAÇÃO DE TABELAS ==================
async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        location TEXT CHECK (location IN ('finance','communication')) DEFAULT 'finance'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT,
        quantity INTEGER,
        category TEXT,
        unit TEXT,
        minStock INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS communications (
        id SERIAL PRIMARY KEY,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS financials (
        id SERIAL PRIMARY KEY,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        description TEXT,
        amount NUMERIC,
        type TEXT CHECK (type IN ('income','expense')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT,
        status TEXT CHECK (status IN ('a fazer','em andamento','concluido')) DEFAULT 'a fazer',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title TEXT,
        status TEXT CHECK (status IN ('a fazer','em andamento','concluido')) DEFAULT 'a fazer',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Tabelas criadas com sucesso!");
  } finally {
    client.release();
  }
}

createTables().catch((err) => console.error(err));

// ================== AUTENTICAÇÃO ==================
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      "INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, email, hashed, role || "user"]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, {
      expiresIn: "7d",
    });
    res.json({ user, token });
  } catch (err) {
    res.status(400).json({ error: "Email já existe" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Senha incorreta" });

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, {
    expiresIn: "7d",
  });
  res.json({ user, token });
});

// Middleware para validar token
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token não fornecido" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

// Middleware para checar se é autor ou admin
function isAuthorOrAdmin(table) {
  return async (req, res, next) => {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [id]);
    const record = result.rows[0];
    if (!record)
      return res.status(404).json({ error: "Registro não encontrado" });

    if (req.user.role === "admin" || record.author_id === req.user.id) {
      req.record = record;
      next();
    } else {
      res.status(403).json({ error: "Sem permissão" });
    }
  };
}

// ================== ROTAS USERS ==================
app.get("/users", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT id,name,email,role,created_at FROM users ORDER BY id"
  );
  res.json(result.rows);
});

// ================== ROTAS CATEGORIES ==================
app.get("/categories", auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

app.post("/categories", auth, async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name) return res.status(400).json({ error: "O nome é obrigatório" });
    if (location && !["finance", "communication"].includes(location))
      return res.status(400).json({ error: "Location inválido" });

    const result = await pool.query(
      "INSERT INTO categories (name, location) VALUES ($1, $2) RETURNING *",
      [name, location || "finance"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Categoria já existe ou erro ao criar" });
  }
});

app.put("/categories/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    if (!name && !location)
      return res
        .status(400)
        .json({ error: "Informe name ou location para atualizar" });
    if (location && !["finance", "communication"].includes(location))
      return res.status(400).json({ error: "Location inválido" });

    // Pega categoria existente
    const { rows: existing } = await pool.query(
      "SELECT * FROM categories WHERE id=$1",
      [id]
    );
    if (!existing.length)
      return res.status(404).json({ error: "Categoria não encontrada" });

    const updatedName = name || existing[0].name;
    const updatedLocation = location || existing[0].location;

    const result = await pool.query(
      "UPDATE categories SET name=$1, location=$2 WHERE id=$3 RETURNING *",
      [updatedName, updatedLocation, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

app.delete("/categories/:id", auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM categories WHERE id=$1",
      [req.params.id]
    );
    if (!rowCount)
      return res.status(404).json({ error: "Categoria não encontrada" });

    res.json({ message: "Categoria deletada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar categoria" });
  }
});

// ================== ROTAS PRODUCTS ==================
app.get("/products", auth, async (req, res) => {
  const result = await pool.query("SELECT * FROM products ORDER BY id");
  res.json(result.rows);
});

app.post("/products", auth, async (req, res) => {
  const { name, quantity, category, unit, minStock } = req.body;
  const result = await pool.query(
    "INSERT INTO products (name, quantity, category, unit, minStock) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [name, quantity, category, unit, minStock]
  );
  res.json(result.rows[0]);
});

app.put("/products/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { name, quantity, category, unit, minStock } = req.body;
  const result = await pool.query(
    "UPDATE products SET name=$1, quantity=$2, category=$3, unit=$4, minStock=$5 WHERE id=$6 RETURNING *",
    [name, quantity, category, unit, minStock, id]
  );
  res.json(result.rows[0]);
});

app.delete("/products/:id", auth, async (req, res) => {
  await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
  res.sendStatus(204);
});

// ================== ROTAS COMMUNICATIONS ==================
app.get("/communications", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM communications ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.post("/communications", auth, async (req, res) => {
  const { title, content } = req.body;
  const result = await pool.query(
    "INSERT INTO communications (author_id,title,content) VALUES ($1,$2,$3) RETURNING *",
    [req.user.id, title, content]
  );
  res.json(result.rows[0]);
});

app.put(
  "/communications/:id",
  auth,
  isAuthorOrAdmin("communications"),
  async (req, res) => {
    const { title, content } = req.body;
    const result = await pool.query(
      "UPDATE communications SET title=$1, content=$2 WHERE id=$3 RETURNING *",
      [title, content, req.params.id]
    );
    res.json(result.rows[0]);
  }
);

app.delete(
  "/communications/:id",
  auth,
  isAuthorOrAdmin("communications"),
  async (req, res) => {
    await pool.query("DELETE FROM communications WHERE id=$1", [req.params.id]);
    res.sendStatus(204);
  }
);

// ================== ROTAS FINANCIALS ==================
app.get("/financials", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM financials ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.post("/financials", auth, async (req, res) => {
  const { description, amount, type } = req.body;
  const result = await pool.query(
    "INSERT INTO financials (author_id,description,amount,type) VALUES ($1,$2,$3,$4) RETURNING *",
    [req.user.id, description, amount, type]
  );
  res.json(result.rows[0]);
});

app.put(
  "/financials/:id",
  auth,
  isAuthorOrAdmin("financials"),
  async (req, res) => {
    const { description, amount, type } = req.body;
    const result = await pool.query(
      "UPDATE financials SET description=$1, amount=$2, type=$3 WHERE id=$4 RETURNING *",
      [description, amount, type, req.params.id]
    );
    res.json(result.rows[0]);
  }
);

app.delete(
  "/financials/:id",
  auth,
  isAuthorOrAdmin("financials"),
  async (req, res) => {
    await pool.query("DELETE FROM financials WHERE id=$1", [req.params.id]);
    res.sendStatus(204);
  }
);

// ================== ROTAS PROJECTS ==================
app.get("/projects", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM projects ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.post("/projects", auth, async (req, res) => {
  const { name, status } = req.body;
  const result = await pool.query(
    "INSERT INTO projects (name,status) VALUES ($1,$2) RETURNING *",
    [name, status || "a fazer"]
  );
  res.json(result.rows[0]);
});

app.put("/projects/:id", auth, async (req, res) => {
  const { name, status } = req.body;
  const result = await pool.query(
    "UPDATE projects SET name=$1,status=$2 WHERE id=$3 RETURNING *",
    [name, status, req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete("/projects/:id", auth, async (req, res) => {
  await pool.query("DELETE FROM projects WHERE id=$1", [req.params.id]);
  res.sendStatus(204);
});

// ================== ROTAS TASKS ==================
app.get("/tasks", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM tasks ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.post("/tasks", auth, async (req, res) => {
  const { title, project_id, status } = req.body;
  const result = await pool.query(
    "INSERT INTO tasks (title, project_id, author_id, status) VALUES ($1,$2,$3,$4) RETURNING *",
    [title, project_id, req.user.id, status || "a fazer"]
  );
  res.json(result.rows[0]);
});

app.put("/tasks/:id", auth, isAuthorOrAdmin("tasks"), async (req, res) => {
  const { title, status } = req.body;
  const result = await pool.query(
    "UPDATE tasks SET title=$1,status=$2 WHERE id=$3 RETURNING *",
    [title, status, req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete("/tasks/:id", auth, isAuthorOrAdmin("tasks"), async (req, res) => {
  await pool.query("DELETE FROM tasks WHERE id=$1", [req.params.id]);
  res.sendStatus(204);
});

export default app;
