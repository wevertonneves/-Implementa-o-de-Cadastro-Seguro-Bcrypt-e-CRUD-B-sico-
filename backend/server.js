const express = require("express");
const bcrypt = require("bcryptjs");
const userModel = require("./models/userModel");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rota de cadastro de usuário
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log("📨 Recebendo cadastro:", { username, email });

    // Validação dos campos
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

    // Adiciona o usuário
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
// Inicia o servidor
app.listen(PORT, () => {
  console.log(` Backend rodando em http://localhost:${PORT}`);
  console.log(` Cadastro: POST http://localhost:${PORT}/register`);
  console.log(` Usuários COM HASH: GET http://localhost:${PORT}/users`);
});

module.exports = app;
