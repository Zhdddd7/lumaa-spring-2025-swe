"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
// 1. 初始化数据库连接池
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
// 2. 创建 Express 应用
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 4. 鉴权中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}
// 5. 用户注册
app.post('/auth/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        // 哈希密码
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // 写入数据库
        const result = yield pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username', [username, hashedPassword]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Register error:', err);
        // 若违反唯一约束等，可能在 err.detail 里
        res.status(500).json({ message: err.detail || 'Registration failed' });
    }
}));
// 6. 用户登录
app.post('/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        // 查询用户
        const userResult = yield pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // 比对密码
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // 生成 JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || '', { expiresIn: '1h' });
        res.json({ token });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed' });
    }
}));
// 7. 获取任务列表 (GET /tasks)
app.get('/tasks', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.user;
        const result = yield pool.query('SELECT * FROM tasks WHERE "userId" = $1', [userId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get tasks error:', err);
        res.status(500).json({ message: 'Failed to fetch tasks' });
    }
}));
// 8. 创建新任务 (POST /tasks)
app.post('/tasks', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description } = req.body;
    try {
        const { userId } = req.user;
        const result = yield pool.query('INSERT INTO tasks (title, description, "userId") VALUES ($1, $2, $3) RETURNING *', [title, description || null, userId]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Create task error:', err);
        res.status(500).json({ message: 'Failed to create task' });
    }
}));
// 9. 更新任务 (PUT /tasks/:id)
app.put('/tasks/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, description, isComplete } = req.body;
    try {
        const { userId } = req.user;
        // 检查是否属于该用户
        const check = yield pool.query('SELECT * FROM tasks WHERE id = $1 AND "userId" = $2', [id, userId]);
        if (check.rowCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const result = yield pool.query('UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), "isComplete" = COALESCE($3, "isComplete") WHERE id = $4 RETURNING *', [title, description, isComplete, id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Update task error:', err);
        res.status(500).json({ message: 'Failed to update task' });
    }
}));
// 10. 删除任务 (DELETE /tasks/:id)
app.delete('/tasks/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const { userId } = req.user;
        // 检查是否属于该用户
        const check = yield pool.query('SELECT * FROM tasks WHERE id = $1 AND "userId" = $2', [id, userId]);
        if (check.rowCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        yield pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ message: 'Task deleted successfully' });
    }
    catch (err) {
        console.error('Delete task error:', err);
        res.status(500).json({ message: 'Failed to delete task' });
    }
}));
// 11. 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
