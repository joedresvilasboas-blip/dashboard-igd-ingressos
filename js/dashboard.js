// ===== DASHBOARD =====
const Dashboard = {
  config: null,
  dados: null,
  filtros: { mes: '', evento: '', canal: '', semana: '', categoria: '' },
  charts: {},

  async load() {
    const el = document.getElementById('dash-content');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';

    try {
      // Carrega config (meses, semanas, eventos) e dados
      if (!this.config) this.config = await API.get('config');
      this.renderFiltros();
      await this.atualizar();
    } catch(e) {
      el.innerHTML = `<div class="empty"><div class="empty-title">Erro ao carregar</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  toggleFiltros() {
    const el = document.getElementById('dash-filtros');
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    if (el.style.display === 'block' && !el.innerHTML) this.renderFiltros();
  },
    const c = this.config;
    const topbar = document.getElementById('dash-periodo');
    if (topbar) topbar.textContent = 'Todos os períodos';

    // Monta opções
    const meses    = (c.meses    || []).map(m => m.nome);
    const semanas  = (c.semanas  || []).map(s => ({ label: 'Sem ' + s.num + ' · ' + s.label, val: s.num }));
    const eventos  = (c.eventos  || []).map(e => e.nome);
    const canais   = ['VA SALES','RC SALES','TRÁFEGO','ORGÂNICO','MARKETING','CONTEÚDO','SUPORTE','GRATUITO'];
    const cats     = ['NORMAL','VIP','UPGRADE'];

    const filtrosEl = document.getElementById('dash-filtros');
    if (!filtrosEl) return;

    filtrosEl.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 20px;background:var(--bg-2);border-bottom:1px solid var(--border);">
        ${this._select('dash-f-mes',     'Mês',       meses,   '', m => m)}
        ${this._select('dash-f-sem',     'Semana',    semanas, '', s => s.val, s => s.label)}
        ${this._select('dash-f-evento',  'Evento',    eventos, '', e => e)}
        ${this._select('dash-f-canal',   'Canal',     canais,  '', c => c)}
        ${this._select('dash-f-cat',     'Categoria', cats,    '', c => c)}
        <button class="btn btn-sm btn-secondary" onclick="Dashboard.limparFiltros()" style="align-self:flex-end">Limpar</button>
      </div>`;

    ['mes','sem','evento','canal','cat'].forEach(id => {
      const el = document.getElementById('dash-f-' + id);
      if (el) el.onchange = () => {
        this.filtros[id === 'sem' ? 'semana' : id === 'cat' ? 'categoria' : id] = el.value;
        this.atualizar();
      };
    });
  },

  _select(id, label, items, val, valFn, labelFn) {
    const opts = items.map(i => {
      const v = valFn ? valFn(i) : i;
      const l = labelFn ? labelFn(i) : i;
      return `<option value="${v}">${l}</option>`;
    }).join('');
    return `<div style="display:flex;flex-direction:column;gap:3px;">
      <span style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em">${label}</span>
      <select id="${id}" class="input select" style="padding:6px 28px 6px 10px;font-size:12px;min-width:110px">
        <option value="">Todos</option>${opts}
      </select>
    </div>`;
  },

  limparFiltros() {
    this.filtros = { mes: '', evento: '', canal: '', semana: '', categoria: '' };
    ['mes','sem','evento','canal','cat'].forEach(id => {
      const el = document.getElementById('dash-f-' + id);
      if (el) el.value = '';
    });
    this.atualizar();
  },

  async atualizar() {
    const el = document.getElementById('dash-content');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';

    try {
      const d = await API.post('dashboard', { filtros: this.filtros });
      this.dados = d;
      this.renderMetricas(d);
      this.renderGraficos(d);
    } catch(e) {
      el.innerHTML = `<div class="empty"><div class="empty-title">Erro</div><div class="empty-sub">${e.message}</div></div>`;
    }
  },

  renderMetricas(d) {
    const el = document.getElementById('dash-content');
    el.innerHTML = `
      <!-- Métricas -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--s3);margin-bottom:var(--s4)">
        ${this._metrica('Total HCs', d.totalHC, 'headcounts', '')}
        ${this._metrica('Faturamento', 'R$ ' + Number(d.totalValor||0).toLocaleString('pt-BR',{minimumFractionDigits:2}), 'valor total', '')}
        ${this._metrica('Vendedores', d.vendedoresAtivos, 'com vendas', '')}
        ${this._metrica('HCs Hoje', d.hojeHC, d.hojeStr || '', 'accent')}
      </div>

      <!-- Gráficos -->
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

    // Renderiza gráficos após HTML estar no DOM
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
    // Destroi charts anteriores
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    this.charts = {};

    const ACCENT = '#e8b86d';
    const CORES = ['#e8b86d','#5cb876','#5d9ee8','#e85d5d','#b86de8','#e8b05d','#5de8d4','#e85db0'];

    // Chart HCs por mês
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

    // Canal — barras horizontais
    this._renderBarras('chart-canal', d.porCanal || [], CORES);

    // Categoria
    this._renderBarras('chart-cat', d.porCategoria || [], ['#5cb876','#e8b86d','#5d9ee8']);

    // Evento
    this._renderBarras('chart-evento', d.porEvento || [], CORES);

    // Ranking vendedores
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
  },

  renderGraficos(d) {
    // já feito em renderMetricas
  }
};
