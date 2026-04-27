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
        ${this._menuItem('📡', 'Regras de Canal', 'canais')}
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
  eventos: [],
  eventoAtual: null,
  ocs: [],
  planos: [],

  async abrir() {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'modal-eventos';
    m.innerHTML = `
      <div class="modal" style="max-height:92vh;display:flex;flex-direction:column">
        <div class="modal-handle"></div>

        <!-- CABEÇALHO -->
        <div class="flex items-center justify-between" style="margin-bottom:var(--s4);flex-shrink:0">
          <div class="modal-title" id="ev-titulo">Eventos</div>
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('modal-eventos').remove()">✕</button>
        </div>

        <!-- LISTA DE EVENTOS -->
        <div id="ev-lista-wrap" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
          <div style="display:flex;gap:var(--s2);margin-bottom:var(--s3);flex-shrink:0">
            <input type="text" id="ev-busca" class="input" placeholder="Buscar evento..."
              style="flex:1" oninput="CadEventos.renderLista()">
            <button class="btn btn-primary" onclick="CadEventos.novoEvento()">+ Novo</button>
          </div>
          <div id="ev-lista" style="overflow-y:auto;flex:1">
            <div class="spinner" style="margin:20px auto"></div>
          </div>
        </div>

        <!-- DETALHE DO EVENTO -->
        <div id="ev-detalhe" style="display:none;flex:1;overflow-y:auto;flex-direction:column">
          <button class="btn btn-ghost btn-sm" style="margin-bottom:var(--s3);padding-left:0"
            onclick="CadEventos.voltarLista()">← Voltar</button>

          <!-- FORM DADOS -->
          <div id="ev-form"></div>

          <!-- PLANOS -->
          <div style="margin-top:var(--s5)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--s3)">
              <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)">Planos</div>
              <button class="btn btn-sm btn-secondary" onclick="CadEventos.mostrarAddPlano()">+ Adicionar</button>
            </div>
            <div id="ev-add-plano" style="display:none;margin-bottom:var(--s3)">
              <textarea id="ev-novo-plano" class="input" rows="4"
                placeholder="Um plano por linha:&#10;IMLS | FLN | ABR26 | CAT1 | 1 TKT&#10;IMLS | FLN | ABR26 | CAT2 | 2 TKT&#10;IMLS | FLN | ABR26 | VIP | 2 TKT"
                style="resize:vertical;font-family:var(--font-mono);font-size:12px"></textarea>
              <div style="font-size:11px;color:var(--text-3);margin:var(--s2) 0">Um plano por linha. Separe também por vírgula ou ponto-e-vírgula.</div>
              <div style="display:flex;gap:var(--s2)">
                <button class="btn btn-primary btn-sm" onclick="CadEventos.addPlanos()">Adicionar</button>
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('ev-add-plano').style.display='none'">Cancelar</button>
              </div>
            </div>
            <div id="ev-planos-lista"></div>
          </div>

          <!-- OCS -->
          <div style="margin-top:var(--s5)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--s3)">
              <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)">OCs</div>
              <button class="btn btn-sm btn-secondary" onclick="CadEventos.mostrarAddOC()">+ Adicionar</button>
            </div>
            <div id="ev-add-oc" style="display:none;margin-bottom:var(--s3)">
              <textarea id="ev-nova-oc" class="input" rows="4"
                placeholder="Uma OC por linha:&#10;IMLS_FLN_PP_TF&#10;IMLS_FLN_PP_VA&#10;IMLS_FLN_PP_RC"
                style="resize:vertical;font-family:var(--font-mono);font-size:12px"></textarea>
              <div style="font-size:11px;color:var(--text-3);margin:var(--s2) 0">Uma OC por linha. Canal inferido automaticamente pelo código.</div>
              <div style="display:flex;gap:var(--s2)">
                <button class="btn btn-primary btn-sm" onclick="CadEventos.addOCs()">Adicionar</button>
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('ev-add-oc').style.display='none'">Cancelar</button>
              </div>
            </div>
            <div id="ev-ocs-lista"></div>
          </div>
        </div>
      </div>`;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    await this.carregar();
  },

  async carregar() {
    const el = document.getElementById('ev-lista');
    el.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
    try {
      const d = await API.getConfig();
      this.eventos = (d.eventos || []).sort((a, b) => a.nome.localeCompare(b.nome));
      this.renderLista();
    } catch { el.innerHTML = '<div class="empty"><div class="empty-title">Erro ao carregar</div></div>'; }
  },

  renderLista() {
    const el = document.getElementById('ev-lista');
    const busca = (document.getElementById('ev-busca')?.value || '').toLowerCase();
    const lista = this.eventos.filter(e =>
      !busca || e.nome.toLowerCase().includes(busca) || (e.cidade||'').toLowerCase().includes(busca)
    );
    el.innerHTML = lista.map(e => `
      <div class="list-item" style="cursor:pointer" onclick="CadEventos.abrirEvento('${e.codigo.replace(/'/g,"\\'")}')">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--text)" class="truncate">${e.nome}</div>
          <div style="font-size:11px;color:var(--text-3)">${e.cidade||'Virtual'} · ${e.mesAno||'—'}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`).join('') || '<div class="empty"><div class="empty-title">Nenhum evento</div></div>';
  },

  novoEvento() {
    this.eventoAtual = null;
    this.ocs = [];
    this.planos = [];
    document.getElementById('ev-titulo').textContent = 'Novo Evento';
    document.getElementById('ev-lista-wrap').style.display = 'none';
    document.getElementById('ev-detalhe').style.display = 'flex';
    this._renderForm({});
    this._renderPlanos();
    this._renderOCs();
  },

  async abrirEvento(codigo) {
    const ev = this.eventos.find(e => e.codigo === codigo);
    if (!ev) return;
    this.eventoAtual = ev;

    document.getElementById('ev-titulo').textContent = ev.nome;
    document.getElementById('ev-lista-wrap').style.display = 'none';
    document.getElementById('ev-detalhe').style.display = 'flex';
    this._renderForm(ev);
    document.getElementById('ev-planos-lista').innerHTML = '<div class="spinner" style="margin:12px auto"></div>';
    document.getElementById('ev-ocs-lista').innerHTML = '<div class="spinner" style="margin:12px auto"></div>';

    try {
      const d = await API.getOCsEvento(ev.codigo);
      this.planos = d.planos || [];
      this.ocs = d.ocs || [];
      this._renderPlanos();
      this._renderOCs();
    } catch {
      Utils.toast('Erro ao carregar OCs/Planos', 'error');
    }
  },

  voltarLista() {
    document.getElementById('ev-detalhe').style.display = 'none';
    document.getElementById('ev-lista-wrap').style.display = 'flex';
    document.getElementById('ev-titulo').textContent = 'Eventos';
    this.carregar();
  },

  _renderForm(ev) {
    document.getElementById('ev-form').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s3)">
        <div class="input-group" style="grid-column:1/-1;margin-bottom:0">
          <label class="input-label">Nome do Evento *</label>
          <input id="ev-nome" class="input" value="${ev.nome||''}" placeholder="Ex: IMLS FLN - ABR26">
        </div>
        <div class="input-group" style="margin-bottom:0">
          <label class="input-label">Sigla *</label>
          <input id="ev-sigla" class="input" value="${ev.sigla||ev.codigo||''}" placeholder="Ex: IMLS FLN - ABR26">
        </div>
        <div class="input-group" style="margin-bottom:0">
          <label class="input-label">Cidade</label>
          <input id="ev-cidade" class="input" value="${ev.cidade||''}" placeholder="Vazio = Virtual">
        </div>
        <div class="input-group" style="margin-bottom:0">
          <label class="input-label">Capacidade</label>
          <input id="ev-capacidade" class="input" type="number" value="${ev.capacidade||''}" placeholder="Ex: 600">
        </div>
        <div class="input-group" style="margin-bottom:0">
          <label class="input-label">Mês/Ano</label>
          <input id="ev-mesano" class="input" value="${ev.mesAno||''}" placeholder="Ex: ABR26">
        </div>
        <div class="input-group" style="margin-bottom:0">
          <label class="input-label">Início das Vendas</label>
          <input id="ev-dtini" class="input" type="date" value="${ev.dtIniVend||''}">
        </div>
        <div class="input-group" style="margin-bottom:0">
          <label class="input-label">Data do Evento</label>
          <input id="ev-dtevento" class="input" type="date" value="${ev.dtEvento||''}">
        </div>
        <div class="input-group" style="grid-column:1/-1;margin-bottom:0">
          <label class="input-label">Data Fim do Evento</label>
          <input id="ev-dtfim" class="input" type="date" value="${ev.dtFimEv||''}">
        </div>
      </div>
      <button class="btn btn-primary btn-full" style="margin-top:var(--s4)" onclick="CadEventos.salvarEvento()">
        Salvar Evento
      </button>
      <div class="divider"></div>`;
  },

  _renderPlanos() {
    const el = document.getElementById('ev-planos-lista');
    if (!this.planos.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:var(--s2) 0">Nenhum plano cadastrado.</div>';
      return;
    }
    el.innerHTML = this.planos.map(p => `
      <div style="display:flex;align-items:center;gap:var(--s2);padding:7px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;font-size:12px;font-family:var(--font-mono);color:var(--text)">${p.plano}</div>
        <span style="font-size:10px;background:var(--blue-dim);color:var(--blue);border-radius:20px;padding:2px 8px">${this._inferirCat(p.plano)}</span>
        <button onclick="CadEventos.removerPlano('${p.plano.replace(/'/g,"\\'")}')"
          style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:16px;padding:0 4px">×</button>
      </div>`).join('');
  },

  _renderOCs() {
    const el = document.getElementById('ev-ocs-lista');
    if (!this.ocs.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:var(--s2) 0">Nenhuma OC cadastrada.</div>';
      return;
    }
    el.innerHTML = this.ocs.map(o => `
      <div style="display:flex;align-items:center;gap:var(--s2);padding:7px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <div style="font-size:12px;font-family:var(--font-mono);color:var(--text);min-width:160px;flex:2">${o.oc}</div>
        <input value="${o.canal||''}" placeholder="Canal"
          class="input" style="flex:1;min-width:100px;padding:5px 8px;font-size:12px"
          onblur="CadEventos.atualizarCanalOC('${o.oc.replace(/'/g,"\\'")}', this.value)">
        <button onclick="CadEventos.removerOC('${o.oc.replace(/'/g,"\\'")}')"
          style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:16px;padding:0 4px;flex-shrink:0">×</button>
      </div>`).join('');
  },

  async atualizarCanalOC(oc, canal) {
    if (!this.eventoAtual) return;
    const item = this.ocs.find(o => o.oc === oc);
    if (item && item.canal === canal) return;
    if (item) item.canal = canal;
    try {
      await API.salvarOCEvento({ oc, canal, eventoCod: this.eventoAtual.codigo });
      Utils.toast('Canal atualizado!', 'success');
    } catch { Utils.toast('Erro ao atualizar canal', 'error'); }
  },

  _inferirCat(plano) {
    const p = (plano||'').toUpperCase();
    if (p.includes('UPGRADE'))  return 'UPGRADE';
    if (p.includes('VIP') || p.includes('CAT2')) return 'VIP';
    if (p.includes('ESSENTIAL') || p.includes('CAT1')) return 'ESSENTIAL';
    return 'NORMAL';
  },

  mostrarAddPlano() {
    const el = document.getElementById('ev-add-plano');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    if (el.style.display === 'block') document.getElementById('ev-novo-plano').focus();
  },

  mostrarAddOC() {
    const el = document.getElementById('ev-add-oc');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    if (el.style.display === 'block') document.getElementById('ev-nova-oc').focus();
  },

  _parsarCodigos(texto) {
    return texto.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
  },

  async addPlanos() {
    const texto = document.getElementById('ev-novo-plano').value.trim();
    if (!texto) { Utils.toast('Digite ao menos um plano', 'error'); return; }
    if (!this.eventoAtual) { Utils.toast('Salve o evento primeiro', 'error'); return; }
    const planos = this._parsarCodigos(texto);
    if (!planos.length) return;
    try {
      const res = await API.salvarPlanosLote(this.eventoAtual.codigo, planos);
      planos.forEach(p => { if (!this.planos.find(x => x.plano === p)) this.planos.push({ plano: p }); });
      this._renderPlanos();
      document.getElementById('ev-novo-plano').value = '';
      document.getElementById('ev-add-plano').style.display = 'none';
      const msg = res.inseridos + ' adicionado' + (res.inseridos !== 1 ? 's' : '');
      const ign = res.ignorados > 0 ? ` · ${res.ignorados} já existia${res.ignorados !== 1 ? 'm' : ''}` : '';
      Utils.toast(msg + ign, 'success');
    } catch { Utils.toast('Erro ao salvar planos', 'error'); }
  },

  async addOCs() {
    const texto = document.getElementById('ev-nova-oc').value.trim();
    if (!texto) { Utils.toast('Digite ao menos uma OC', 'error'); return; }
    if (!this.eventoAtual) { Utils.toast('Salve o evento primeiro', 'error'); return; }
    const ocs = this._parsarCodigos(texto);
    if (!ocs.length) return;
    try {
      const res = await API.salvarOCsLote(this.eventoAtual.codigo, ocs);
      ocs.forEach(oc => { if (!this.ocs.find(o => o.oc === oc)) this.ocs.push({ oc, canal: '' }); });
      this._renderOCs();
      document.getElementById('ev-nova-oc').value = '';
      document.getElementById('ev-add-oc').style.display = 'none';
      const msg = res.inseridos + ' adicionada' + (res.inseridos !== 1 ? 's' : '');
      const ign = res.ignorados > 0 ? ` · ${res.ignorados} já existia${res.ignorados !== 1 ? 'm' : ''}` : '';
      Utils.toast(msg + ign, 'success');
    } catch { Utils.toast('Erro ao salvar OCs', 'error'); }
  },

  async removerPlano(plano) {
    if (!this.eventoAtual) return;
    try {
      await API.deletarPlanoEvento(plano, this.eventoAtual.codigo);
      this.planos = this.planos.filter(p => p.plano !== plano);
      this._renderPlanos();
      Utils.toast('Removido', 'success');
    } catch { Utils.toast('Erro ao remover', 'error'); }
  },

  async removerOC(oc) {
    if (!this.eventoAtual) return;
    try {
      await API.deletarOCEvento(oc, this.eventoAtual.codigo);
      this.ocs = this.ocs.filter(o => o.oc !== oc);
      this._renderOCs();
      Utils.toast('Removido', 'success');
    } catch { Utils.toast('Erro ao remover', 'error'); }
  },

  async salvarEvento() {
    const dados = {
      nome:       document.getElementById('ev-nome').value.trim(),
      sigla:      document.getElementById('ev-sigla').value.trim(),
      cidade:     document.getElementById('ev-cidade').value.trim(),
      capacidade: document.getElementById('ev-capacidade').value.trim(),
      mesAno:     document.getElementById('ev-mesano').value.trim(),
      dtIniVend:  document.getElementById('ev-dtini').value,
      dtEvento:   document.getElementById('ev-dtevento').value,
      dtFimEv:    document.getElementById('ev-dtfim').value,
      produto:    'IGR',
    };
    if (!dados.nome || !dados.sigla) { Utils.toast('Nome e Sigla são obrigatórios', 'error'); return; }
    try {
      await API.salvarEvento(dados);
      this.eventoAtual = { ...dados, codigo: dados.sigla };
      Utils.toast('Evento salvo!', 'success');
      // Atualiza lista local
      const idx = this.eventos.findIndex(e => e.codigo === dados.sigla);
      if (idx >= 0) this.eventos[idx] = { ...this.eventos[idx], ...dados, codigo: dados.sigla };
      else this.eventos.push({ ...dados, codigo: dados.sigla });
    } catch { Utils.toast('Erro ao salvar', 'error'); }
  },
};

// ===== CADASTRO DE CALENDÁRIO =====
const CadCalendario = {
  async abrir() {
    Utils.toast('Em breve: Cadastro de Calendário', '');
  }
};

// ===== REGRAS DE CANAL =====
const CadCanais = {
  regras: [],

  async abrir() {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'modal-canais';
    m.innerHTML = `
      <div class="modal" style="max-height:92vh;display:flex;flex-direction:column">
        <div class="modal-handle"></div>
        <div class="flex items-center justify-between" style="margin-bottom:var(--s4);flex-shrink:0">
          <div class="modal-title">Regras de Canal</div>
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('modal-canais').remove()">✕</button>
        </div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:var(--s4);flex-shrink:0">
          Define como o canal é inferido automaticamente pelo código da OC.
        </div>

        <!-- Formulário nova regra -->
        <div class="card card-sm" style="margin-bottom:var(--s4);flex-shrink:0">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:var(--s3)">Nova Regra</div>
          <div style="display:flex;gap:var(--s2);flex-wrap:wrap">
            <input id="rc-padrao" class="input" placeholder="Padrão (ex: _TF_)" style="flex:2;min-width:120px">
            <select id="rc-tipo" class="input select" style="flex:1;min-width:110px">
              <option value="igual_a">Igual a</option>
              <option value="contem">Contém</option>
              <option value="comeca_com">Começa com</option>
              <option value="termina_com">Termina com</option>
            </select>
            <input id="rc-canal" class="input" placeholder="Sub-canal" list="rc-canais-list"
              style="flex:2;min-width:120px" autocomplete="off">
            <datalist id="rc-canais-list"></datalist>
            <select id="rc-canal-macro" class="input select" style="flex:1;min-width:110px">
              <option value="">Canal Macro</option>
              <option value="VA">VA - Venda Ativa</option>
              <option value="VD">VD - Venda Direta</option>
              <option value="RC">RC - Venda Recuperação</option>
              <option value="GT">GT - Gratuito</option>
            </select>
            <button class="btn btn-primary btn-sm" onclick="CadCanais.adicionar()" style="flex-shrink:0">Adicionar</button>
          </div>
        </div>

        <!-- Lista de regras -->
        <div id="rc-lista" style="overflow-y:auto;flex:1">
          <div class="spinner" style="margin:20px auto"></div>
        </div>
      </div>`;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    await this.carregar();
  },

  async carregar() {
    const el = document.getElementById('rc-lista');
    el.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
    try {
      const d = await API.getRegrасCanal();
      this.regras = d.regras || [];

      const canaisSet = new Set();
      this.regras.forEach(r => canaisSet.add(r.canal));
      const dl = document.getElementById('rc-canais-list');
      if (dl) dl.innerHTML = [...canaisSet].sort().map(c => `<option value="${c}">`).join('');

      this.renderLista();
    } catch { el.innerHTML = '<div class="empty"><div class="empty-title">Erro ao carregar</div></div>'; }
  },

  renderLista() {
    const el = document.getElementById('rc-lista');
    if (!this.regras.length) {
      el.innerHTML = '<div class="empty"><div class="empty-title">Nenhuma regra cadastrada</div></div>';
      return;
    }

    const porCanal = {};
    this.regras.forEach(r => {
      if (!porCanal[r.canal]) porCanal[r.canal] = [];
      porCanal[r.canal].push(r);
    });

    const tipoLabel = { igual_a: 'igual a', contem: 'contém', comeca_com: 'começa com', termina_com: 'termina com' };
    const canaisSet = new Set(this.regras.map(r => r.canal));
    const canaisOpts = [...canaisSet].sort().map(c => `<option value="${c}">`).join('');

    const macroLabel = { VA: 'VA', VD: 'VD', RC: 'RC' };
    const macroColor = { VA: 'var(--accent)', VD: 'var(--blue)', RC: 'var(--green)' };

    el.innerHTML = Object.keys(porCanal).sort().map(canal => `
      <div class="card card-sm" style="margin-bottom:var(--s3)">
        <div style="display:flex;align-items:center;gap:var(--s2);margin-bottom:var(--s3)">
          <div style="font-size:12px;font-weight:600;color:var(--accent)">${canal}</div>
          ${porCanal[canal][0].canalMacro ? `<span style="font-size:10px;padding:1px 8px;border-radius:20px;background:var(--bg-3);color:${macroColor[porCanal[canal][0].canalMacro]||'var(--text-3)'};border:1px solid currentColor">${porCanal[canal][0].canalMacro}</span>` : ''}
        </div>
        ${porCanal[canal].map(r => {
          const rid = btoa(r.padrao + '|' + r.tipo).replace(/[+=\/]/g,'_');
          return `
          <div id="regra-${rid}" style="padding:6px 0;border-bottom:1px solid var(--border)">
            <div id="view-${rid}" style="display:flex;align-items:center;gap:var(--s2)">
              <span style="font-size:11px;color:var(--text-3);min-width:80px">${tipoLabel[r.tipo]||r.tipo}</span>
              <span style="font-family:var(--font-mono);font-size:12px;color:var(--text);flex:1">${r.padrao}</span>
              <button onclick="CadCanais.editarModo('${rid}')"
                style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:13px;padding:0 4px">✏️</button>
              <button onclick="CadCanais.remover('${r.padrao.replace(/'/g,"\\'")}','${r.tipo}')"
                style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:16px;padding:0 4px">×</button>
            </div>
            <div id="edit-${rid}" style="display:none;flex-wrap:wrap;gap:var(--s2);padding-top:var(--s2)">
              <input id="ep-${rid}" class="input" value="${r.padrao}"
                style="flex:2;min-width:100px;padding:5px 8px;font-size:12px">
              <select id="et-${rid}" class="input select" style="flex:1;min-width:100px;font-size:12px;padding:5px 8px">
                <option value="igual_a" ${r.tipo==='igual_a'?'selected':''}>Igual a</option>
                <option value="contem" ${r.tipo==='contem'?'selected':''}>Contém</option>
                <option value="comeca_com" ${r.tipo==='comeca_com'?'selected':''}>Começa com</option>
                <option value="termina_com" ${r.tipo==='termina_com'?'selected':''}>Termina com</option>
              </select>
              <input id="ec-${rid}" class="input" value="${r.canal}" list="rc-canais-list"
                style="flex:2;min-width:100px;padding:5px 8px;font-size:12px" autocomplete="off">
              <select id="em-${rid}" class="input select" style="flex:1;min-width:90px;font-size:12px;padding:5px 8px">
                <option value="" ${!r.canalMacro?'selected':''}>Macro</option>
                <option value="VA" ${r.canalMacro==='VA'?'selected':''}>VA</option>
                <option value="VD" ${r.canalMacro==='VD'?'selected':''}>VD</option>
                <option value="RC" ${r.canalMacro==='RC'?'selected':''}>RC</option>
                <option value="GT" ${r.canalMacro==='GT'?'selected':''}>GT</option>
              </select>
              <button class="btn btn-primary btn-sm"
                onclick="CadCanais.salvarEdicao('${rid}','${r.padrao.replace(/'/g,"\\'")}','${r.tipo}')">Salvar</button>
              <button class="btn btn-secondary btn-sm"
                onclick="CadCanais.editarModo('${rid}',true)">Cancelar</button>
            </div>
          </div>`;
        }).join('')}
      </div>`).join('');
  },

  editarModo(rid, cancelar = false) {
    document.getElementById('view-' + rid).style.display = cancelar ? 'flex' : 'none';
    document.getElementById('edit-' + rid).style.display = cancelar ? 'none' : 'flex';
  },

  async salvarEdicao(rid, padraoOrig, tipoOrig) {
    const novoPadrao  = document.getElementById('ep-' + rid)?.value.trim();
    const novoTipo    = document.getElementById('et-' + rid)?.value;
    const novoCanal   = document.getElementById('ec-' + rid)?.value.trim().toUpperCase();
    const novoCanalMacro = document.getElementById('em-' + rid)?.value || '';
    if (!novoPadrao || !novoCanal) { Utils.toast('Preencha todos os campos', 'error'); return; }
    try {
      await API.deletarRegraCanal(padraoOrig, tipoOrig);
      await API.salvarRegraCanal({ padrao: novoPadrao, tipo: novoTipo, canal: novoCanal, canalMacro: novoCanalMacro });
      const idx = this.regras.findIndex(r => r.padrao === padraoOrig && r.tipo === tipoOrig);
      if (idx >= 0) this.regras[idx] = { padrao: novoPadrao, tipo: novoTipo, canal: novoCanal, canalMacro: novoCanalMacro };
      this.renderLista();
      Utils.toast('Regra atualizada!', 'success');
    } catch { Utils.toast('Erro ao salvar', 'error'); }
  },

  async adicionar() {
    const padrao     = document.getElementById('rc-padrao').value.trim();
    const tipo       = document.getElementById('rc-tipo').value;
    const canal      = document.getElementById('rc-canal').value.trim().toUpperCase();
    const canalMacro = document.getElementById('rc-canal-macro').value;
    if (!padrao || !canal) { Utils.toast('Preencha padrão e sub-canal', 'error'); return; }
    if (!canalMacro) { Utils.toast('Selecione o Canal Macro', 'error'); return; }
    try {
      await API.salvarRegraCanal({ padrao, tipo, canal, canalMacro });
      this.regras.push({ padrao, tipo, canal, canalMacro });
      this.renderLista();
      document.getElementById('rc-padrao').value = '';
      document.getElementById('rc-canal').value  = '';
      document.getElementById('rc-canal-macro').value = '';
      Utils.toast('Regra adicionada!', 'success');
    } catch { Utils.toast('Erro ao salvar regra', 'error'); }
  },

  async remover(padrao, tipo) {
    try {
      await API.deletarRegraCanal(padrao, tipo);
      this.regras = this.regras.filter(r => !(r.padrao === padrao && r.tipo === tipo));
      this.renderLista();
      Utils.toast('Removida!', 'success');
    } catch { Utils.toast('Erro ao remover', 'error'); }
  }
};

// ===== CADASTRO DE OCs =====
const CadOCs = {
  async abrir() {
    Utils.toast('Em breve: Cadastro de OCs/Planos', '');
  }
};
