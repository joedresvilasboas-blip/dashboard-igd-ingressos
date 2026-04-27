// ===== UPLOAD CSV =====
const Upload = {
  linhas: [],
  _naoIdOCs:    [],
  _naoIdPlanos: [],
  _eventos:     [],

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
      </div>
      <div id="upload-nao-id"></div>`;
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
    }).filter(l => l['Id da Central'] && (l['Venda Teste'] || '').trim().toUpperCase() !== 'SIM');
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

      this._naoIdOCs    = res.ocsNaoId    || [];
      this._naoIdPlanos = res.planosNaoId || [];

      if (this._naoIdOCs.length || this._naoIdPlanos.length) {
        // Carrega lista de eventos para o seletor
        try {
          const cfg = await API.getConfig();
          this._eventos = (cfg.eventos || []).map(e => e.nome).sort();
        } catch { this._eventos = []; }
        this._renderNaoId();
      } else {
        document.getElementById('upload-nao-id').innerHTML = '';
      }

      this.limpar();
    } catch (e) {
      Utils.toast('Erro ao importar: ' + e.message, 'error');
      Utils.btnLoading(btn, false);
    }
  },

  _renderNaoId() {
    const total = this._naoIdOCs.length + this._naoIdPlanos.length;
    if (!total) {
      document.getElementById('upload-nao-id').innerHTML = '';
      return;
    }

    const optsEvento = this._eventos.map(e =>
      `<option value="${e}">${e}</option>`
    ).join('');

    const renderItem = (codigo, tipo) => `
      <div id="nid-${btoa(codigo).replace(/=/g,'')}" style="padding:var(--s3) 0;border-bottom:1px solid var(--border)">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text);margin-bottom:var(--s2)">${codigo}</div>
        <div style="display:flex;gap:var(--s2);align-items:center;flex-wrap:wrap">
          <select class="input select" style="flex:1;min-width:160px;font-size:12px;padding:6px 10px"
            id="sel-${btoa(codigo).replace(/=/g,'')}">
            <option value="">— Selecionar evento —</option>
            ${optsEvento}
          </select>
          <button class="btn btn-sm btn-primary" onclick="Upload.vincular('${codigo.replace(/'/g,"\\'")}','${tipo}')">
            Vincular
          </button>
        </div>
      </div>`;

    let html = `
      <div class="card" style="margin-top:var(--s4);border-color:var(--accent)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--s2)">
          <div style="font-size:13px;font-weight:600;color:var(--accent)">⚠️ ${total} não identificado${total !== 1 ? 's' : ''}</div>
          <span style="font-size:11px;color:var(--text-3)">Vincule a um evento</span>
        </div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:var(--s4)">
          Após vincular, reimporte o CSV para atualizar os dados corretamente.
        </div>`;

    if (this._naoIdOCs.length) {
      html += `<div style="font-size:11px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--s2)">OCs (${this._naoIdOCs.length})</div>`;
      html += this._naoIdOCs.map(oc => renderItem(oc, 'oc')).join('');
    }

    if (this._naoIdPlanos.length) {
      html += `<div style="font-size:11px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin:var(--s4) 0 var(--s2)">Planos (${this._naoIdPlanos.length})</div>`;
      html += this._naoIdPlanos.map(p => renderItem(p, 'plano')).join('');
    }

    html += `</div>`;
    document.getElementById('upload-nao-id').innerHTML = html;
  },

  async vincular(codigo, tipo) {
    const id  = btoa(codigo).replace(/=/g, '');
    const sel = document.getElementById('sel-' + id);
    const evento = sel ? sel.value : '';
    if (!evento) { Utils.toast('Selecione um evento', 'error'); return; }

    const btn = sel.nextElementSibling;
    Utils.btnLoading(btn, true);

    try {
      const res = await API.vincularAtualizar(tipo, codigo, evento);

      if (tipo === 'oc') this._naoIdOCs = this._naoIdOCs.filter(x => x !== codigo);
      else               this._naoIdPlanos = this._naoIdPlanos.filter(x => x !== codigo);

      // Remove o item da tela
      const el = document.getElementById('nid-' + id);
      if (el) el.remove();

      const msg = res.atualizados > 0
        ? `Vinculado! ${res.atualizados} venda${res.atualizados !== 1 ? 's' : ''} atualizada${res.atualizados !== 1 ? 's' : ''}`
        : `Vinculado a ${evento}!`;
      Utils.toast(msg, 'success');

      // Se não sobrou nada, limpa o card
      if (!this._naoIdOCs.length && !this._naoIdPlanos.length) {
        document.getElementById('upload-nao-id').innerHTML = '';
      }
    } catch { 
      Utils.toast('Erro ao vincular', 'error');
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
