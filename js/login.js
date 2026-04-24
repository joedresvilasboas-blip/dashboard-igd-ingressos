// ===== LOGIN =====
document.addEventListener('DOMContentLoaded', () => {
  // Esconde loading screen
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) ls.style.display = 'none';
  }, 800);

  const btnLogin = document.getElementById('btn-login');
  const inputSenha = document.getElementById('login-senha');
  const erro = document.getElementById('login-erro');

  async function tentarLogin() {
    const senha = inputSenha.value.trim();
    if (!senha) return;

    Utils.btnLoading(btnLogin, true);
    erro.style.display = 'none';

    const role = await AUTH.login(senha);

    if (role) {
      App.role = role;
      App.setupNav();
      document.getElementById('main-nav').style.display = 'flex';
      App.showScreen('dashboard');
    } else {
      erro.style.display = 'block';
      inputSenha.value = '';
      inputSenha.focus();
      Utils.btnLoading(btnLogin, false);
    }
  }

  btnLogin.addEventListener('click', tentarLogin);
  inputSenha.addEventListener('keydown', e => { if (e.key === 'Enter') tentarLogin(); });

  // Se já logado, mostra nav e vai para dashboard
  if (AUTH.check()) {
    document.getElementById('main-nav').style.display = 'flex';
  }
});
