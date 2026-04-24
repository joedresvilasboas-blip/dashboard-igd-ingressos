// ===== DASHBOARD =====
const Dashboard = {
  config: null,
  dados: null,
  // filtros com arrays para múltipla seleção
  filtros: { mes: [], evento: [], canal: ['VA SALES','RC SALES'], semana: [], categoria: [] },
  charts: {},
  _dropAberto: null,

  async load() {
    const el = document.getElementById('dash-content');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';
    try {
      if (!this.config) this.config = await API.get('config');
      this.renderFiltros();
      await this.atualizar();
      // Fecha dropdown ao clicar fora
      document.addEventListener('click', e => {
        if (this._dropAberto && !this._dropAberto.contains(e.target)) {
          this._dropAberto.querySelector('.dash-dropdown').style.display = 'none';
          this._dropAberto = null;
        }
      });
    } catch(e) {
      el.innerHTML = `<div class="empty"><div class="empty-title">Erro ao carregar</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  toggleFiltros() {
    const el = document.getElementById('dash-filtros');
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  renderFiltros() {
    const c = this.config;
    const meses   = (c.meses   || []).map(m => m.nome);
    const semanas = (c.semanas || []).map(s => `Sem ${s.num} · ${s.label}`);
    const eventos = (c.eventos || []).map(e => e.nome);
    const canais  = ['VA SALES','RC SALES','TRÁFEGO','ORGÂNICO','MARKETING','CONTEÚDO','SUPORTE','GRATUITO'];
    const cats    = ['NORMAL','VIP','UPGRADE','ESSENTIAL'];

    const filtrosEl = document.getElementById('dash-filtros');
    if (!filtrosEl) return;

    filtrosEl.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;padding:10px 20px;background:var(--bg-2);border-bottom:1px solid var(--border);">
        ${this._dropdown('dash-f-mes',    'Mês',       meses,   'mes',       [])}
        ${this._dropdown('dash-f-sem',    'Semana',    semanas, 'semana',    [])}
        ${this._dropdown('dash-f-evento', 'Evento',    eventos, 'evento',    [])}
        ${this._dropdown('dash-f-canal',  'Canal',     canais,  'canal',     ['VA SALES','RC SALES'])}
        ${this._dropdown('dash-f-cat',    'Categoria', cats,    'categoria', [])}
        <button class="btn btn-sm btn-secondary" onclick="Dashboard.limparFiltros()">Limpar</button>
      </div>`;
  },

  _dropdown(id, label, items, filtroKey, presel) {
    const sel = this.filtros[filtroKey] || [];
    const opts = items.map(v => {
      const checked = sel.includes(v) ? 'checked' : '';
      return `<label style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;font-size:12px;color:var(--text);white-space:nowrap"
        onmouseenter="this.style.background='var(--bg-3)'" onmouseleave="this.style.background=''">
        <input type="checkbox" value="${v}" ${checked}
          onchange="Dashboard.toggleOpcao('${filtroKey}','${v}',this.checked,'${id}')"
          style="accent-color:var(--accent);width:14px;height:14px">
        ${v}
      </label>`;
    }).join('');

    const btnLabel = sel.length === 0 ? 'Todos' : sel.length === 1 ? sel[0] : sel.length + ' selecionados';
    const ativo = sel.length > 0 ? 'border-color:var(--accent);color:var(--accent)' : '';

    return `<div style="display:flex;flex-direction:column;gap:3px;position:relative" id="wrap-${id}">
      <span style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em">${label}</span>
      <button onclick="Dashboard.toggleDrop('wrap-${id}')"
        style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;
        background:var(--bg-3);border:1px solid var(--border-2);border-radius:var(--r2);
        font-size:12px;color:var(--text);cursor:pointer;min-width:120px;${ativo}" id="btn-${id}">
        <span id="lbl-${id}">${btnLabel}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="dash-dropdown" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;
        background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r2);
        min-width:180px;max-height:220px;overflow-y:auto;z-index:100;box-shadow:var(--shadow)">
        <label style="display:flex;align-items:center;gap:8px;padding:6px 10px;cursor:pointer;font-size:12px;
          color:var(--accent);border-bottom:1px solid var(--border);font-weight:600"
          onmouseenter="this.style.background='var(--bg-3)'" onmouseleave="this.style.background=''">
          <input type="checkbox" onchange="Dashboard.toggleTodos('${filtroKey}','${id}',this.checked)"
            ${sel.length === 0 ? 'checked' : ''}
            style="accent-color:var(--accent);width:14px;height:14px">
          Todos
        </label>
        ${opts}
      </div>
    </div>`;
  },

  toggleDrop(wrapId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const drop = wrap.querySelector('.dash-dropdown');
    const jaAberto = drop.style.display !== 'none';
    // Fecha todos
    document.querySelectorAll('.dash-dropdown').forEach(d => d.style.display = 'none');
    this._dropAberto = null;
    if (!jaAberto) {
      drop.style.display = 'block';
      this._dropAberto = wrap;
    }
  },

  toggleOpcao(filtroKey, valor, checked, id) {
    if (!this.filtros[filtroKey]) this.filtros[filtroKey] = [];
    if (checked) {
      if (!this.filtros[filtroKey].includes(valor)) this.filtros[filtroKey].push(valor);
    } else {
      this.filtros[filtroKey] = this.filtros[filtroKey].filter(v => v !== valor);
    }
    this._atualizarBotao(filtroKey, id);
    this.atualizar();
  },

  toggleTodos(filtroKey, id, checked) {
    const wrap = document.getElementById('wrap-' + id);
    if (!wrap) return;
    const cbs = wrap.querySelectorAll('.dash-dropdown input[type=checkbox]:not(:first-child)');
    this.filtros[filtroKey] = [];
    cbs.forEach(cb => {
      cb.checked = false;
    });
    this._atualizarBotao(filtroKey, id);
    this.atualizar();
  },

  _atualizarBotao(filtroKey, id) {
    const sel = this.filtros[filtroKey] || [];
    const lbl = document.getElementById('lbl-' + id);
    const btn = document.getElementById('btn-' + id);
    const todosCheck = document.querySelector(`#wrap-${id} .dash-dropdown label:first-child input`);
    if (lbl) lbl.textContent = sel.length === 0 ? 'Todos' : sel.length === 1 ? sel[0] : sel.length + ' selecionados';
    if (btn) btn.style.borderColor = sel.length > 0 ? 'var(--accent)' : 'var(--border-2)';
    if (btn) btn.style.color = sel.length > 0 ? 'var(--accent)' : 'var(--text)';
    if (todosCheck) todosCheck.checked = sel.length === 0;
  },

  limparFiltros() {
    this.filtros = { mes: [], evento: [], canal: [], semana: [], categoria: [] };
    this.renderFiltros();
    this.atualizar();
  },

  async atualizar() {
    const el = document.getElementById('dash-content');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';
    try {
      const d = await API.post('dashboard', { filtros: this.filtros });
      this.dados = d;
      this.renderMetricas(d);
    } catch(e) {
      el.innerHTML = `<div class="empty"><div class="empty-title">Erro</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  renderMetricas(d) {
    const el = document.getElementById('dash-content');
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--s3);margin-bottom:var(--s4)">
        ${this._metrica('Total HCs', d.totalHC, 'headcounts', '')}
        ${this._metrica('Faturamento', 'R$ ' + Number(d.totalValor||0).toLocaleString('pt-BR',{minimumFractionDigits:2}), 'valor total', '')}
        ${this._metrica('Vendedores', d.vendedoresAtivos, 'com vendas', '')}
        ${this._metrica('HCs Hoje', d.hojeHC, d.hojeStr || '', 'accent')}
      </div>
      <div class="card" style="margin-bottom:var(--s3)">
        <div style="font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--s4)">HCs por Mês</div>
        <div style="position:relative;height:180px"><canvas id="chart-mes"></canvas></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s3);margin-bottom:var(--s3)">
        <div class="card">
          <div style="font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--s4)">Por Canal</div>
          <div id="chart-canal"></div>
        </div>
        <div class="card">
          <div style="font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--s4)">Por Categoria</div>
          <div id="chart-cat"></div>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--s3)">
        <div style="font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--s4)">Por Evento</div>
        <div id="chart-evento"></div>
      </div>
      <div class="card" style="margin-bottom:var(--s3)">
        <div style="font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--s4)">Ranking Vendedores</div>
        <div id="chart-ranking"></div>
      </div>`;

    setTimeout(() => this._renderCharts(d), 50);
  },

  _metrica(label, valor, sub, tipo) {
    const accent = tipo === 'accent';
    return `<div class="card card-sm" style="${accent ? 'border-color:var(--accent);background:var(--accent-dim);' : ''}">
      <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--s2)">${label}</div>
      <div style="font-size:24px;font-weight:700;font-family:var(--font-display);color:${accent ? 'var(--accent)' : 'var(--text)'};line-height:1">${valor}</div>
      <div style="font-size:11px;color:var(--text-3);margin-top:var(--s1)">${sub}</div>
    </div>`;
  },

  _renderCharts(d) {
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    this.charts = {};

    const ACCENT = '#e8b86d';
    const CORES = ['#e8b86d','#5cb876','#5d9ee8','#e85d5d','#b86de8','#e8b05d','#5de8d4','#e85db0'];

    const canvasMes = document.getElementById('chart-mes');
    if (canvasMes && d.porMes && d.porMes.length) {
      this.charts.mes = new Chart(canvasMes, {
        type: 'bar',
        data: {
          labels: d.porMes.map(m => m.nome),
          datasets: [{ data: d.porMes.map(m => m.hc), backgroundColor: ACCENT, borderRadius: 4, borderSkipped: false }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#5a5550', font: { size: 10 } }, grid: { display: false } },
            y: { ticks: { color: '#5a5550', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }

    this._renderBarras('chart-canal', d.porCanal || [], CORES);
    this._renderBarras('chart-cat', d.porCategoria || [], ['#5cb876','#e8b86d','#5d9ee8','#e85d5d']);
    this._renderBarras('chart-evento', d.porEvento || [], CORES);
    this._renderRanking('chart-ranking', d.ranking || []);
  },

  _renderBarras(elId, dados, cores) {
    const el = document.getElementById(elId);
    if (!el) return;
    const max = dados.reduce((m, d) => Math.max(m, d.hc), 1);
    el.innerHTML = dados.slice(0, 10).map((d, i) => {
      const pct = Math.round((d.hc / max) * 100);
      const cor = cores[i % cores.length];
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="font-size:11px;color:var(--text-2);min-width:100px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${d.nome}">${d.nome}</div>
        <div style="flex:1;height:6px;background:var(--bg-3);border-radius:3px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${cor};border-radius:3px"></div>
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--text);min-width:36px;text-align:right">${d.hc}</div>
      </div>`;
    }).join('') || '<div class="empty-sub">Sem dados</div>';
  },

  _renderRanking(elId, dados) {
    const el = document.getElementById(elId);
    if (!el) return;
    const M = ['🥇','🥈','🥉'];
    el.innerHTML = dados.slice(0, 15).map((v, i) => {
      const pos = i < 3 ? M[i] : String(i + 1);
      return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:0.5px solid var(--border)">
        <span style="font-size:${i<3?'16':'12'}px;min-width:28px;text-align:center;color:var(--text-3)">${pos}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v.nome}</div>
          <div style="font-size:11px;color:var(--text-3)">${v.codigo}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:700;color:var(--accent)">${v.pontos} pts</div>
          <div style="font-size:11px;color:var(--text-3)">${v.hc} HC</div>
        </div>
      </div>`;
    }).join('') || '<div class="empty-sub">Sem dados</div>';
  }
};
