// server.ts
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

// 1. 初始化数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. 创建 Express 应用
const app = express();
app.use(cors());
app.use(express.json());

// 3. 定义类型辅助 (为 req.user 做类型扩展)
interface JwtPayload {
  userId: number;
}
interface AuthRequest extends Request {
  user?: JwtPayload;
}

// 4. 鉴权中间件
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded as JwtPayload;
    next();
  });
}

// 5. 用户注册
app.post('/auth/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 写入数据库
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Register error:', err);
    // 若违反唯一约束等，可能在 err.detail 里
    res.status(500).json({ message: err.detail || 'Registration failed' });
  }
});

// 6. 用户登录
app.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    // 查询用户
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 比对密码
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 生成 JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || '', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// 7. 获取任务列表 (GET /tasks)
app.get('/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.user!;
    const result = await pool.query('SELECT * FROM tasks WHERE "userId" = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// 8. 创建新任务 (POST /tasks)
app.post('/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, description } = req.body;
  try {
    const { userId } = req.user!;
    const result = await pool.query(
      'INSERT INTO tasks (title, description, "userId") VALUES ($1, $2, $3) RETURNING *',
      [title, description || null, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// 9. 更新任务 (PUT /tasks/:id)
app.put('/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, isComplete } = req.body;
  try {
    const { userId } = req.user!;
    // 检查是否属于该用户
    const check = await pool.query('SELECT * FROM tasks WHERE id = $1 AND "userId" = $2', [id, userId]);
    if (check.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const result = await pool.query(
      'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), "isComplete" = COALESCE($3, "isComplete") WHERE id = $4 RETURNING *',
      [title, description, isComplete, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// 10. 删除任务 (DELETE /tasks/:id)
app.delete('/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const { userId } = req.user!;
    // 检查是否属于该用户
    const check = await pool.query('SELECT * FROM tasks WHERE id = $1 AND "userId" = $2', [id, userId]);
    if (check.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// 11. 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
