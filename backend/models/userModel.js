const bcrypt = require("bcryptjs");
const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "users.json");

const userModel = {
  async loadUsers() {
    try {
      const data = await fs.readFile(DATA_FILE, "utf8");
      return JSON.parse(data);
    } catch (error) {
      // Se o arquivo não existir, retorna array vazio
      return [];
    }
  },

  async saveUsers(users) {
    await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
  },

  async addUser(userData) {
    try {
      let users = await this.loadUsers();

      // Verifica se usuário já existe
      const existingUser =
        users.find((u) => u.username === userData.username) ||
        users.find((u) => u.email === userData.email);
      if (existingUser) {
        throw new Error("Usuário ou email já existe");
      }

      // Gera hash da senha
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Cria novo usuário
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
        username: userData.username,
        email: userData.email,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      await this.saveUsers(users);

      console.log(
        `✅ Usuário cadastrado: ${newUser.username} (ID: ${newUser.id})`
      );
      console.log(`💾 Dados salvos em: ${DATA_FILE}`);
      return newUser;
    } catch (error) {
      throw error;
    }
  },

  async findByUsername(username) {
    const users = await this.loadUsers();
    return users.find((user) => user.username === username);
  },

  async findByEmail(email) {
    const users = await this.loadUsers();
    return users.find((user) => user.email === email);
  },

  async findById(id) {
    const users = await this.loadUsers();
    return users.find((user) => user.id === id);
  },

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // REMOVI getAllUsers() pois não vamos mais usar

  async getAllUsersWithHash() {
    const users = await this.loadUsers();
    // Retorna TODOS os dados incluindo o hash
    return users.map((user) => {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash, // ← AQUI ESTÁ O HASH
        createdAt: user.createdAt,
      };
    });
  },

  async clearAll() {
    await this.saveUsers([]);
  },
};

module.exports = userModel;
