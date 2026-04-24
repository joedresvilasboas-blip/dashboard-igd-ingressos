// ===== UPLOAD CSV =====
const Upload = {
  linhas: [],

  init() {
    const el = document.getElementById('upload-content');
    el.innerHTML = `
      <div class="card" style="margin-bottom:var(--s3)">
        <h3 style="margin-bottom:var(--s2)">Importar CSV da Central</h3>
        <p style="margin-bottom:var(--s5)">Selecione o arquivo CSV exportado da Central de Vendas</p>

        <div id="upload-dropzone" style="
          border:2px dashed var(--border-2);border-radius:var(--r3);
          padding:var(--s10) var(--s5);text-align:center;cursor:pointer;
          transition:border-color var(--t1);margin-bottom:var(--s4)"
          onclick="document.getElementById('upload-file').click()"
          ondragover="Upload.onDragOver(event)"
          ondrop="Upload.onDrop(event)">
          <div style="font-size:32px;margin-bottom:var(--s3)">📂</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:var(--s2)">Toque para selecionar</div>
          <div style="font-size:12px;color:var(--text-3)">ou arraste o arquivo CSV aqui</div>
        </div>
        <input type="file" id="upload-file" accept=".csv" style="display:none" onchange="Upload.onFile(this)">
      </div>

      <div id="upload-preview" style="display:none">
        <div class="card" style="margin-bottom:var(--s3)">
          <div class="flex items-center justify-between" style="margin-bottom:var(--s4)">
            <h3 id="upload-count"></h3>
            <button class="btn btn-sm btn-secondary" onclick="Upload.limpar()">Limpar</button>
          </div>
          <div id="upload-erros" style="margin-bottom:var(--s4)"></div>
          <button class="btn btn-primary btn-full" id="btn-importar" onclick="Upload.importar()">
            Importar Vendas
          </button>
        </div>
        <div id="upload-linhas" style="font-size:12px;color:var(--text-3)"></div>
      </div>`;
  },

  onDragOver(e) {
    e.preventDefault();
    document.getElementById('upload-dropzone').style.borderColor = 'var(--accent)';
  },

  onDrop(e) {
    e.preventDefault();
    document.getElementById('upload-dropzone').style.borderColor = 'var(--border-2)';
    const file = e.dataTransfer.files[0];
    if (file) this.processarArquivo(file);
  },

  onFile(input) {
    const file = input.files[0];
    if (file) this.processarArquivo(file);
  },

  processarArquivo(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = e.target.result;
      this.parsearCSV(texto);
    };
    reader.readAsText(file, 'utf-8');
  },

  parsearCSV(texto) {
    const linhas = texto.split('\n').filter(l => l.trim());
    if (linhas.length < 2) {
      Utils.toast('CSV inválido', 'error');
      return;
    }

    // Detecta separador
    const sep = linhas[0].includes(';') ? ';' : ',';
    const cabecalho = this._parseRow(linhas[0], sep);
    this.linhas = linhas.slice(1).map(l => {
      const cols = this._parseRow(l, sep);
      const obj = {};
      cabecalho.forEach((h, i) => obj[h.trim()] = (cols[i] || '').trim());
      return obj;
    }).filter(l => l['Id da Central']);

    this.renderPreview();
  },

  _parseRow(row, sep) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') { inQuotes = !inQuotes; }
      else if (c === sep && !inQuotes) { result.push(current); current = ''; }
      else { current += c; }
    }
    result.push(current);
    return result;
  },

  renderPreview() {
    const n = this.linhas.length;
    document.getElementById('upload-preview').style.display = 'block';
    document.getElementById('upload-count').textContent = `${n} venda${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''}`;

    // Mostra preview das primeiras 5
    const preview = this.linhas.slice(0, 5).map(l =>
      `<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
        <span>${l['Nome'] || '—'}</span>
        <span style="color:var(--text-3)">${l['Data de Pagamento'] || ''}</span>
      </div>`
    ).join('');
    document.getElementById('upload-linhas').innerHTML =
      `<div class="card card-sm"><div class="section-title" style="margin-bottom:var(--s3)">Prévia</div>${preview}${n > 5 ? `<div style="padding:6px 0;color:var(--text-3)">... e mais ${n-5}</div>` : ''}</div>`;
  },

  async importar() {
    const btn = document.getElementById('btn-importar');
    Utils.btnLoading(btn, true);

    try {
      const res = await API.uploadCSV(this.linhas);
      Utils.toast(`${res.importados || 0} vendas importadas!`, 'success');
      if (res.duplicados > 0) {
        Utils.toast(`${res.duplicados} duplicadas ignoradas`, '');
      }
      this.limpar();
    } catch (e) {
      Utils.toast('Erro ao importar: ' + e.message, 'error');
      Utils.btnLoading(btn, false);
    }
  },

  limpar() {
    this.linhas = [];
    document.getElementById('upload-preview').style.display = 'none';
    document.getElementById('upload-file').value = '';
  }
};
