// ===== AUTENTICAÇÃO =====
// Senhas hasheadas (SHA-256) para não ficarem em texto puro
// admin: igd@admin2026  |  vendedor: igd@vendas2026
// Para gerar novo hash: https://emn178.github.io/online-tools/sha256.html

const AUTH = {
  // Hashes das senhas — altere aqui para mudar as senhas
  HASHES: {
    admin:    'cc55999d698829b0c690b0aacdaf8e6d5585457504aa8a3b0214259f31274112', // igd@admin2026
    vendedor: 'd998dd8b4b9668f856fcf3823a0f0a4015d5ad26e3edf4c5464339ceee418e80'  // igd@vendas2026
  },

  SESSION_KEY: 'igd_session',
  SESSION_HOURS: 12,

  // Verifica se está logado
  check() {
    const s = localStorage.getItem(this.SESSION_KEY);
    if (!s) return null;
    try {
      const { role, expires } = JSON.parse(s);
      if (Date.now() > expires) { this.logout(); return null; }
      return role;
    } catch { return null; }
  },

  // Login com senha
  async login(password) {
    const hash = await this._hash(password);
    if (hash === this.HASHES.admin) {
      this._saveSession('admin');
      return 'admin';
    }
    if (hash === this.HASHES.vendedor) {
      this._saveSession('vendedor');
      return 'vendedor';
    }
    return null;
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  _saveSession(role) {
    const expires = Date.now() + this.SESSION_HOURS * 3600 * 1000;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({ role, expires }));
  },

  async _hash(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  isAdmin() { return this.check() === 'admin'; },
  isVendedor() { return this.check() === 'vendedor'; }
};
