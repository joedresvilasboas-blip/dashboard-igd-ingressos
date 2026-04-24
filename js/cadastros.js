// ===== CADASTROS =====
const Cadastros = {
  init() {
    const el = document.getElementById('cadastros-content');
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s3)">
        ${this._menuItem('👤', 'Vendedores', 'vendedores')}
        ${this._menuItem('🏆', 'Equipes', 'equipes')}
        ${this._menuItem('🎪', 'Eventos', 'eventos')}
        ${this._menuItem('📅', 'Calendário', 'calendario')}
        ${this._menuItem('📡', 'Canais', 'canais')}
        ${this._menuItem('🔗', 'OCs / Planos', 'ocs')}
      </div>`;
  },

  _menuItem(icon, label, id) {
    return `
      <button class="card" style="text-align:center;cursor:pointer;border:1px solid var(--border);padding:var(--s5);transition:border-color var(--t1)"
        onclick="Cadastros.abrirSecao('${id}')"
        onmouseenter="this.style.borderColor='var(--accent)'"
        onmouseleave="this.style.borderColor='var(--border)'">
        <div style="font-size:28px;margin-bottom:var(--s3)">${icon}</div>
        <div style="font-size:13px;font-weight:600;color:var(--text)">${label}</div>
      </button>`;
  },

  abrirSecao(secao) {
    const telas = {
      vendedores: CadVendedores,
      equipes:    CadEquipes,
      eventos:    CadEventos,
      calendario: CadCalendario,
      canais:     CadCanais,
      ocs:        CadOCs,
    };
    const tela = telas[secao];
    if (tela) tela.abrir();
  }
};

// ===== CADASTRO DE VENDEDORES =====
const CadVendedores = {
  dados: [],

  async abrir() {
    this.modal = this._criarModal('Vendedores');
    document.body.appendChild(this.modal);
    await this.carregar();
  },

  async carregar() {
    const el = document.getElementById('cad-lista');
    el.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
    try {
      const d = await API.getConfig();
      this.dados = d.vendedores || [];
      this.renderLista();
    } catch { el.innerHTML = '<div class="empty"><div class="empty-title">Erro</div></div>'; }
  },

  renderLista() {
    const el = document.getElementById('cad-lista');
    const busca = (document.getElementById('cad-busca')?.value || '').toLowerCase();
    const lista = this.dados.filter(v =>
      !busca || v.nome.toLowerCase().includes(busca) || v.codigo.toLowerCase().includes(busca)
    );

    el.innerHTML = lista.map(v => `
      <div class="list-item">
        <div class="avatar avatar-gold">${Utils.iniciais(v.nome)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600" class="truncate">${v.nome}</div>
          <div style="font-size:11px;color:var(--text-3)">${v.codigo} · ${v.equipe || '—'}</div>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="CadVendedores.editar('${v.codigo}')">Editar</button>
      </div>`).join('') || '<div class="empty"><div class="empty-title">Nenhum vendedor</div></div>';
  },

  editar(codigo) {
    const v = this.dados.find(x => x.codigo === codigo);
    if (!v) return;
    document.getElementById('cad-form').innerHTML = this._form(v);
    document.getElementById('cad-form').style.display = 'block';
  },

  novo() {
    document.getElementById('cad-form').innerHTML = this._form({});
    document.getElementById('cad-form').style.display = 'block';
  },

  _form(v) {
    return `
      <div class="divider"></div>
      <h4 style="margin-bottom:var(--s4)">${v.codigo ? 'Editar' : 'Novo'} Vendedor</h4>
      <div class="input-group">
        <label class="input-label">Código</label>
        <input id="f-codigo" class="input" value="${v.codigo || ''}" placeholder="Ex: V001">
      </div>
      <div class="input-group">
        <label class="input-label">Nome</label>
        <input id="f-nome" class="input" value="${v.nome || ''}" placeholder="Nome completo">
      </div>
      <div class="input-group">
        <label class="input-label">Equipe</label>
        <input id="f-equipe" class="input" value="${v.equipe || ''}" placeholder="Ex: HUSKIES">
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" style="flex:1" onclick="document.getElementById('cad-form').style.display='none'">Cancelar</button>
        <button class="btn btn-primary" style="flex:1" onclick="CadVendedores.salvar()">Salvar</button>
      </div>`;
  },

  async salvar() {
    const dados = {
      codigo: document.getElementById('f-codigo').value.trim(),
      nome:   document.getElementById('f-nome').value.trim(),
      equipe: document.getElementById('f-equipe').value.trim(),
    };
    if (!dados.codigo || !dados.nome) { Utils.toast('Preencha os campos obrigatórios', 'error'); return; }
    try {
      await API.salvarVendedor(dados);
      Utils.toast('Salvo!', 'success');
      document.getElementById('cad-form').style.display = 'none';
      await this.carregar();
    } catch { Utils.toast('Erro ao salvar', 'error'); }
  },

  _criarModal(titulo) {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'modal-cad';
    m.innerHTML = `
      <div class="modal" style="max-height:90vh">
        <div class="modal-handle"></div>
        <div class="flex items-center justify-between" style="margin-bottom:var(--s4)">
          <div class="modal-title">${titulo}</div>
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('modal-cad').remove()">✕</button>
        </div>
        <input type="text" id="cad-busca" class="input" placeholder="Buscar..." style="margin-bottom:var(--s4)" oninput="CadVendedores.renderLista()">
        <button class="btn btn-primary btn-full" style="margin-bottom:var(--s4)" onclick="CadVendedores.novo()">+ Novo Vendedor</button>
        <div id="cad-form" style="display:none;margin-bottom:var(--s4)"></div>
        <div id="cad-lista"></div>
      </div>`;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    return m;
  }
};

// ===== CADASTRO DE EQUIPES =====
const CadEquipes = {
  async abrir() {
    Utils.toast('Em breve: Cadastro de Equipes', '');
  }
};

// ===== CADASTRO DE EVENTOS =====
const CadEventos = {
  async abrir() {
    Utils.toast('Em breve: Cadastro de Eventos', '');
  }
};

// ===== CADASTRO DE CALENDÁRIO =====
const CadCalendario = {
  async abrir() {
    Utils.toast('Em breve: Cadastro de Calendário', '');
  }
};

// ===== CADASTRO DE CANAIS =====
const CadCanais = {
  async abrir() {
    Utils.toast('Em breve: Cadastro de Canais', '');
  }
};

// ===== CADASTRO DE OCs =====
const CadOCs = {
  async abrir() {
    Utils.toast('Em breve: Cadastro de OCs/Planos', '');
  }
};
