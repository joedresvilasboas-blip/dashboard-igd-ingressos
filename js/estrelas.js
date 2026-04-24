// ===== ESTRELAS =====
const Estrelas = {
  todos: [],
  visiveis: new Set(),

  async load() {
    const el = document.getElementById('estrelas-lista');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px"><div class="spinner"></div></div>';

    try {
      const d = await API.getEstrelas();
      this.todos = d.vendedores || [];
      this.visiveis = new Set(this.todos.map(v => v.codigo));
      this.renderFiltros();
      this.renderLista();

      // Busca
      const busca = document.getElementById('estrelas-busca');
      busca.oninput = Utils.debounce(() => this.renderLista(), 200);
    } catch (e) {
      el.innerHTML = '<div class="empty"><div class="empty-title">Erro ao carregar</div></div>';
    }
  },

  renderFiltros() {
    const cats = [...new Set(this.todos.map(v => v.categoria))].sort((a, b) => {
      const o = { SENIOR: 0, PLENO: 1, JUNIOR: 2 };
      return (o[a] || 9) - (o[b] || 9);
    });
    const el = document.getElementById('estrelas-filtros');
    el.innerHTML = cats.map(cat => {
      const n = this.todos.filter(v => v.categoria === cat).length;
      return `<button class="chip active" onclick="Estrelas.toggleCat('${cat}',this)">${cat} <span style="opacity:.6">${n}</span></button>`;
    }).join('');
  },

  toggleCat(cat, btn) {
    btn.classList.toggle('active');
    const ativo = btn.classList.contains('active');
    this.todos.filter(v => v.categoria === cat).forEach(v => {
      if (ativo) this.visiveis.add(v.codigo);
      else this.visiveis.delete(v.codigo);
    });
    this.renderLista();
  },

  renderLista() {
    const busca = (document.getElementById('estrelas-busca').value || '').toLowerCase();
    const lista = this.todos.filter(v =>
      this.visiveis.has(v.codigo) &&
      (!busca || v.nome.toLowerCase().includes(busca) || v.codigo.toLowerCase().includes(busca))
    );

    const el = document.getElementById('estrelas-lista');
    if (!lista.length) {
      el.innerHTML = '<div class="empty"><div class="empty-title">Nenhum vendedor</div></div>';
      return;
    }

    const corBarra = { JUNIOR: '#EF9F27', PLENO: '#BA7517', SENIOR: '#639922' };
    const fe = window._faltaEstrela || {};

    el.innerHTML = lista.map(v => {
      const pct = Math.min(100, (v.pontos / 5) * 100);
      const bc = corBarra[v.categoria] || '#EF9F27';
      const fd = fe[v.codigo];
      let incentivo = '';
      let faltaPts = '';

      if (fd) {
        if (fd.completa) {
          incentivo = `<span style="font-size:11px;color:var(--green);background:var(--green-dim);border-radius:6px;padding:2px 8px">⭐ Estrela conquistada!</span>`;
        } else if (fd.pct === 0) {
          incentivo = `<span style="font-size:11px;color:var(--text-3);background:var(--bg-3);border-radius:6px;padding:2px 8px">💪 Vamos começar!</span>`;
        } else if (fd.pct <= 30) {
          incentivo = `<span style="font-size:11px;color:var(--accent);background:var(--accent-dim);border-radius:6px;padding:2px 8px">🚀 Bom começo!</span>`;
        } else if (fd.pct <= 60) {
          incentivo = `<span style="font-size:11px;color:var(--accent);background:var(--accent-dim);border-radius:6px;padding:2px 8px">🔥 No caminho certo!</span>`;
        } else if (fd.pct <= 89) {
          incentivo = `<span style="font-size:11px;color:var(--accent);background:var(--accent-dim);border-radius:6px;padding:2px 8px">⚡ Quase lá!</span>`;
        } else {
          incentivo = `<span style="font-size:11px;color:var(--green);background:var(--green-dim);border-radius:6px;padding:2px 8px">🎯 Vai buscar!</span>`;
        }
        if (fd.falta > 0) {
          faltaPts = `<span style="font-size:11px;color:var(--text-3)">Faltam <strong style="color:var(--accent)">${fd.falta} pts</strong> ⭐</span>`;
        }
      }

      return `
        <div class="card card-sm" style="margin-bottom:var(--s3)">
          <div class="flex items-center gap-3" style="margin-bottom:var(--s3)">
            <div class="avatar avatar-gold">${Utils.iniciais(v.nome)}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:var(--text)" class="truncate">${v.nome}</div>
              <div style="font-size:11px;color:var(--text-3)">${v.codigo}</div>
            </div>
            <span class="badge badge-neutral">${v.categoria}</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="stars">${Utils.renderStars(v.pontos, v.categoria)}</div>
            <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%;background:${bc}"></div></div>
            <span style="font-size:11px;color:var(--text-3);min-width:40px;text-align:right">${v.pontos.toFixed(2)}/5</span>
          </div>
          ${incentivo || faltaPts ? `
          <div class="flex items-center justify-between" style="margin-top:var(--s3);flex-wrap:wrap;gap:var(--s2)">
            ${incentivo}${faltaPts}
          </div>` : ''}
        </div>`;
    }).join('');
  }
};
