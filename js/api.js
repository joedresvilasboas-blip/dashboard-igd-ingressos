// ===== CONECTOR COM GOOGLE APPS SCRIPT =====

const API = {
  // Cole aqui a URL do seu Web App do Google Apps Script após o deploy
  BASE_URL: 'https://script.google.com/macros/s/AKfycbyAVjWE063Wwq-aXLHPey61VoMI8RM2vDICAvl28HR6YK9RtMSVjD6PIRSjE037jb26/exec',

  async get(action, params = {}) {
    const url = new URL(this.BASE_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error('Erro na API: ' + res.status);
    return res.json();
  },

  async post(action, body = {}) {
    const res = await fetch(this.BASE_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...body })
    });
    if (!res.ok) throw new Error('Erro na API: ' + res.status);
    return res.json();
  },

  // ===== ENDPOINTS =====

  // Dashboard
  getDashboard(filtros) { return this.post('dashboard', { filtros }); },

  // Estrelas
  getEstrelas() { return this.get('estrelas'); },

  // Ranking
  getRanking(strIni, strFim, semNum) { return this.post('ranking', { strIni, strFim, semNum }); },

  // Relatórios
  getRelatorioDiario(data) { return this.get('relatorio_diario', { data }); },
  getRelatorioSemanal(semana) { return this.get('relatorio_semanal', { semana }); },

  // Configurações
  getConfig() { return this.get('config'); },
  salvarVendedor(dados) { return this.post('salvar_vendedor', dados); },
  uploadVendedores(linhas) { return this.post('upload_vendedores', { linhas }); },
  salvarEquipe(dados) { return this.post('salvar_equipe', dados); },
  salvarEvento(dados) { return this.post('salvar_evento', dados); },
  salvarCalendario(dados) { return this.post('salvar_calendario', dados); },
  salvarCanal(dados) { return this.post('salvar_canal', dados); },
  salvarOC(dados) { return this.post('salvar_oc', dados); },
  deletarOC(oc, plano) { return this.post('deletar_oc', { oc, plano }); },
  getOCsEvento(eventoCod) { return this.post('get_ocs_evento', { eventoCod }); },
  salvarOCEvento(dados) { return this.post('salvar_oc_evento', dados); },
  salvarPlanoEvento(dados) { return this.post('salvar_plano_evento', dados); },
  salvarOCsLote(eventoCod, ocs) { return this.post('salvar_ocs_lote', { eventoCod, ocs }); },
  salvarPlanosLote(eventoCod, planos) { return this.post('salvar_planos_lote', { eventoCod, planos }); },
  vincularAtualizar(tipo, codigo, eventoCod) { return this.post('vincular_atualizar', { tipo, codigo, eventoCod }); },
  reprocessarTodosCanais() { return this.post('reprocessar_todos_canais', {}); },
  reprocessarTodasCategorias() { return this.post('reprocessar_todas_categorias', {}); },
  deletarOCEvento(oc, eventoCod) { return this.post('deletar_oc_evento', { oc, eventoCod }); },
  deletarPlanoEvento(plano, eventoCod) { return this.post('deletar_plano_evento', { plano, eventoCod }); },
  deletar(tipo, id) { return this.post('deletar', { tipo, id }); },

  // Upload CSV
  uploadCSV(linhas) { return this.post('upload_csv', { linhas }); },
  getUploadStatus() { return this.get('upload_status'); },

  // Jornada do Upgrade
  getJornadaUpgrade(evento, filtros) { return this.post('jornada_upgrade', { evento, filtros }); },
  getRegrасCanal() { return this.get('get_regras_canal'); },
  salvarRegraCanal(dados) { return this.post('salvar_regra_canal', dados); },
  deletarRegraCanal(padrao, tipo) { return this.post('deletar_regra_canal', { padrao, tipo }); },
  aplicarRegraCanal(dados) { return this.post('aplicar_regra_canal', dados); },
};
