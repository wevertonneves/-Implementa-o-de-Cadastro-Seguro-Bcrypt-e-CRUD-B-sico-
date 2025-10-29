// Carregar variáveis de ambiente PRIMEIRO
require('dotenv').config();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const userModel = require("./models/userModel");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_fallback_para_desenvolvimento_2024_gamby_trabalho_faculdade';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "file-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem, PDF e documentos são permitidos"));
    }
  },
});

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Token de acesso não fornecido",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Formato de token inválido. Use: Bearer <token>",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      });
    }
    
    return res.status(403).json({
      success: false,
      message: "Token inválido",
    });
  }
};

// Rota de cadastro de usuário
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log("Recebendo cadastro:", { username, email });

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios: username, email e password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "A senha deve ter no mínimo 6 caracteres",
      });
    }

    const newUser = await userModel.addUser({
      username,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: "Usuário cadastrado com sucesso!",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Erro no cadastro:", error.message);

    if (error.message === "Usuário ou email já existe") {
      return res.status(400).json({
        success: false,
        message: "Usuário ou email já está em uso",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Rota de login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("Tentativa de login:", { username });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username e password são obrigatórios",
      });
    }

    const user = await userModel.findByUsername(username);
    if (!user) {
      console.log("Usuário não encontrado:", username);
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
      });
    }

    const isPasswordValid = await userModel.verifyPassword(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      console.log("Senha inválida para usuário:", username);
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Login bem-sucedido:", username);
    console.log("Token JWT gerado com sucesso");

    res.status(200).json({
      success: true,
      message: "Login realizado com sucesso!",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error.message);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor: " + error.message,
    });
  }
});

// Rota de upload protegida
app.post("/upload", verificarToken, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo foi enviado",
      });
    }

    console.log(`Upload realizado pelo usuário ID: ${req.userId}, Username: ${req.username}`);

    res.status(200).json({
      success: true,
      message: "Arquivo enviado com sucesso!",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedBy: {
          userId: req.userId,
          username: req.username,
        },
      },
    });
  } catch (error) {
    console.error("Erro no upload:", error.message);
    res.status(500).json({
      success: false,
      message: "Erro ao processar upload do arquivo",
    });
  }
});

// Rota para verificar token
app.get("/verify-token", verificarToken, (req, res) => {
  res.json({
    success: true,
    message: "Token válido",
    user: {
      id: req.userId,
      username: req.username,
    },
  });
});

// Rota para obter perfil do usuário
app.get("/profile", verificarToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error.message);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await userModel.getAllUsersWithHash();
    res.json({
      success: true,
      message: "Lista completa de usuários com hash das senhas",
      total: users.length,
      users: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuários",
    });
  }
});

// Criar diretório de uploads se não existir
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("Diretório de uploads criado");
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;