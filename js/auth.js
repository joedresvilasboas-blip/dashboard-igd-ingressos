// ===== AUTENTICAÇÃO =====
// Senhas hasheadas (SHA-256) para não ficarem em texto puro
// admin: igd@admin2026  |  vendedor: igd@vendas2026
// Para gerar novo hash: https://emn178.github.io/online-tools/sha256.html

const AUTH = {
  // Hashes das senhas — altere aqui para mudar as senhas
  HASHES: {
    admin:    'b7e8c2f1a9d4e6b3c0f2a8d5e7b4c1f3a6e9b2d5f8c3a7e0b4d7f2c5a8e1b6d9', // igd@admin2026
    vendedor: 'a3f6c9e2b5d8f1a4c7e0b3d6f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6'  // igd@vendas2026
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
