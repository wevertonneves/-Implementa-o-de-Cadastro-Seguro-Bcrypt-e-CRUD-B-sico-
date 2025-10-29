const BACKEND_URL = "http://localhost:3000";
let currentToken = null;
let currentUser = null;

// Navegação entre seções
function showSection(sectionName) {
  // Esconder todas as seções
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remover active de todas as tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Mostrar seção selecionada
  document.getElementById(sectionName + '-section').classList.add('active');
  
  // Ativar tab selecionada
  event.target.classList.add('active');

  // Atualizar informações do usuário na seção de upload
  if (sectionName === 'upload' && currentUser) {
    updateUserInfo();
  }
}

// Atualizar informações do usuário
function updateUserInfo() {
  if (currentUser) {
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `
      <strong>Usuário Logado:</strong> ${currentUser.username}<br>
      <strong>Email:</strong> ${currentUser.email}<br>
      <strong>ID:</strong> ${currentUser.id}
    `;
    userInfo.style.display = 'block';
  }
}

// Cadastro de usuário
document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const button = this.querySelector("button");
  const originalText = button.textContent;
  button.textContent = "Cadastrando...";
  button.disabled = true;

  try {
    const response = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    const messageDiv = document.getElementById("message");
    messageDiv.className = "message";
    messageDiv.textContent = result.message;

    if (result.success) {
      messageDiv.classList.add("success");
      document.getElementById("registerForm").reset();
      document.getElementById("strengthBar").className = "strength-bar";
    } else {
      messageDiv.classList.add("error");
    }

    messageDiv.style.display = "block";
  } catch (error) {
    console.error("Erro:", error);
    const messageDiv = document.getElementById("message");
    messageDiv.className = "message error";
    messageDiv.textContent = "Erro de conexão com o backend";
    messageDiv.style.display = "block";
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
});

// Login de usuário
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const button = this.querySelector("button");
  const originalText = button.textContent;
  button.textContent = "Entrando...";
  button.disabled = true;

  try {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    const messageDiv = document.getElementById("message");
    messageDiv.className = "message";
    messageDiv.textContent = result.message;

    if (result.success) {
      messageDiv.classList.add("success");
      currentToken = result.token;
      currentUser = result.user;
      
      // Mostrar token
      const tokenDisplay = document.getElementById("tokenDisplay");
      tokenDisplay.innerHTML = `<strong>Token JWT:</strong><br>${currentToken}`;
      tokenDisplay.style.display = "block";
      
      document.getElementById("loginForm").reset();
      
      // Atualizar informações do usuário
      updateUserInfo();
    } else {
      messageDiv.classList.add("error");
    }

    messageDiv.style.display = "block";
  } catch (error) {
    console.error("Erro:", error);
    const messageDiv = document.getElementById("message");
    messageDiv.className = "message error";
    messageDiv.textContent = "Erro de conexão com o backend";
    messageDiv.style.display = "block";
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
});

// Upload de arquivo
document.getElementById("uploadForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!currentToken) {
    const messageDiv = document.getElementById("message");
    messageDiv.className = "message error";
    messageDiv.textContent = "Você precisa fazer login primeiro!";
    messageDiv.style.display = "block";
    return;
  }

  const formData = new FormData(this);
  const button = this.querySelector("button");
  const originalText = button.textContent;
  button.textContent = "Enviando...";
  button.disabled = true;

  try {
    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    const messageDiv = document.getElementById("message");
    messageDiv.className = "message";
    messageDiv.textContent = result.message;

    if (result.success) {
      messageDiv.classList.add("success");
      document.getElementById("uploadForm").reset();
    } else {
      messageDiv.classList.add("error");
    }

    messageDiv.style.display = "block";
  } catch (error) {
    console.error("Erro:", error);
    const messageDiv = document.getElementById("message");
    messageDiv.className = "message error";
    messageDiv.textContent = "Erro de conexão com o backend";
    messageDiv.style.display = "block";
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
});

// Validador de força da senha
document.getElementById("password").addEventListener("input", function (e) {
  const password = e.target.value;
  const strengthBar = document.getElementById("strengthBar");
  
  let strength = 0;
  if (password.length >= 6) strength += 1;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
  if (password.match(/\d/)) strength += 1;
  if (password.match(/[^a-zA-Z\d]/)) strength += 1;
  
  strengthBar.className = "strength-bar";
  if (password.length > 0) {
    if (strength <= 1) {
      strengthBar.classList.add("weak");
    } else if (strength <= 2) {
      strengthBar.classList.add("medium");
    } else {
      strengthBar.classList.add("strong");
    }
  }
});