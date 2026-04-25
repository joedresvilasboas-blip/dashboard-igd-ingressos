// ===== UPLOAD CSV =====
const Upload = {
  linhas: [],

  init() {
    const el = document.getElementById('upload-content');
    el.innerHTML = `
      <div class="card" style="margin-bottom:var(--s3)">
        <h3 style="margin-bottom:var(--s2)">Importar CSV da Central</h3>
        <p style="margin-bottom:var(--s5)">Selecione um ou mais arquivos CSV exportados da Central de Vendas</p>

        <div id="upload-dropzone" style="
          border:2px dashed var(--border-2);border-radius:var(--r3);
          padding:var(--s10) var(--s5);text-align:center;cursor:pointer;
          transition:border-color var(--t1);margin-bottom:var(--s4)"
          onclick="document.getElementById('upload-file').click()"
          ondragover="Upload.onDragOver(event)"
          ondrop="Upload.onDrop(event)">
          <div style="font-size:32px;margin-bottom:var(--s3)">📂</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:var(--s2)">Toque para selecionar</div>
          <div style="font-size:12px;color:var(--text-3)">ou arraste os arquivos CSV aqui</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:var(--s2)">Múltiplos arquivos permitidos</div>
        </div>
        <input type="file" id="upload-file" accept=".csv" multiple style="display:none" onchange="Upload.onFile(this)">
      </div>

      <div id="upload-preview" style="display:none">
        <div class="card" style="margin-bottom:var(--s3)">
          <div class="flex items-center justify-between" style="margin-bottom:var(--s4)">
            <h3 id="upload-count"></h3>
            <button class="btn btn-sm btn-secondary" onclick="Upload.limpar()">Limpar</button>
          </div>
          <div id="upload-arquivos" style="margin-bottom:var(--s4)"></div>
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
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
    if (files.length) this.processarArquivos(files);
  },

  onFile(input) {
    const files = Array.from(input.files);
    if (files.length) this.processarArquivos(files);
  },

  processarArquivos(files) {
    this.linhas = [];
    this._arquivos = [];
    let processados = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const linhas = this.parsearCSV(e.target.result);
        this._arquivos.push({ nome: file.name, count: linhas.length });
        this.linhas = this.linhas.concat(linhas);
        processados++;
        if (processados === files.length) this.renderPreview();
      };
      reader.readAsText(file, 'utf-8');
    });
  },

  parsearCSV(texto) {
    const linhas = texto.split('\n').filter(l => l.trim());
    if (linhas.length < 2) return [];
    const sep = linhas[0].includes(';') ? ';' : ',';
    const cabecalho = this._parseRow(linhas[0], sep);
    return linhas.slice(1).map(l => {
      const cols = this._parseRow(l, sep);
      const obj = {};
      cabecalho.forEach((h, i) => obj[h.trim()] = (cols[i] || '').trim());
      return obj;
    }).filter(l => l['Id da Central']);
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

    const arquivosHtml = (this._arquivos || []).map(a =>
      `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
        <span style="color:var(--text)">📄 ${a.nome}</span>
        <span style="color:var(--text-3)">${a.count} vendas</span>
      </div>`
    ).join('');
    document.getElementById('upload-arquivos').innerHTML = arquivosHtml;

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

      if (res.erro) {
        Utils.toast('Erro do servidor: ' + res.erro, 'error');
        Utils.btnLoading(btn, false);
        return;
      }

      const msgs = [];
      if (res.importados > 0) msgs.push(`${res.importados} importadas`);
      if (res.atualizados > 0) msgs.push(`${res.atualizados} atualizadas`);
      if (msgs.length) Utils.toast(msgs.join(' · ') + '!', 'success');
      if (res.erros > 0) Utils.toast(`${res.erros} erros`, 'error');

      this.limpar();
    } catch (e) {
      Utils.toast('Erro ao importar: ' + e.message, 'error');
      Utils.btnLoading(btn, false);
    }
  },

  limpar() {
    this.linhas = [];
    this._arquivos = [];
    document.getElementById('upload-preview').style.display = 'none';
    document.getElementById('upload-file').value = '';
  }
};
