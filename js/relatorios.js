// ===== RELATÓRIOS =====
const Relatorios = {
  init() {
    const el = document.getElementById('relatorios-content');
    el.innerHTML = `
      <div class="card" style="margin-bottom:var(--s3)">
        <h3 style="margin-bottom:var(--s4)">Relatório Diário</h3>
        <div class="input-group">
          <label class="input-label">Data</label>
          <input type="date" id="rel-data" class="input" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <button class="btn btn-primary btn-full" onclick="Relatorios.gerarDiario()">Gerar Relatório</button>
      </div>
      <div class="card">
        <h3 style="margin-bottom:var(--s4)">Relatório Semanal</h3>
        <div class="input-group">
          <label class="input-label">Semana</label>
          <input type="number" id="rel-semana" class="input" placeholder="Ex: 16" min="1" max="52">
        </div>
        <button class="btn btn-primary btn-full" onclick="Relatorios.gerarSemanal()">Gerar Relatório</button>
      </div>
      <div id="rel-resultado" style="margin-top:var(--s3)"></div>`;
  },

  async gerarDiario() {
    const data = document.getElementById('rel-data').value;
    const el = document.getElementById('rel-resultado');
    el.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
    try {
      const d = await API.getRelatorioDiario(data);
      this.renderTexto(d.texto);
    } catch { el.innerHTML = '<div class="empty"><div class="empty-title">Erro</div></div>'; }
  },

  async gerarSemanal() {
    const sem = document.getElementById('rel-semana').value;
    const el = document.getElementById('rel-resultado');
    el.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
    try {
      const d = await API.getRelatorioSemanal(sem);
      this.renderTexto(d.texto);
    } catch { el.innerHTML = '<div class="empty"><div class="empty-title">Erro</div></div>'; }
  },

  renderTexto(texto) {
    const el = document.getElementById('rel-resultado');
    el.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--s4)">
          <h3>Resultado</h3>
          <button class="btn btn-sm btn-secondary" onclick="Relatorios.copiar()">Copiar</button>
        </div>
        <pre id="rel-texto" style="font-family:var(--font-mono);font-size:12px;color:var(--text-2);white-space:pre-wrap;line-height:1.6">${texto}</pre>
      </div>`;
    this._texto = texto;
  },

  copiar() {
    if (!this._texto) return;
    navigator.clipboard?.writeText(this._texto).then(() => Utils.toast('Copiado!', 'success'));
  }
};
