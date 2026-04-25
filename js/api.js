// ===== CONECTOR COM GOOGLE APPS SCRIPT =====

const API = {
  // Cole aqui a URL do seu Web App do Google Apps Script após o deploy
  BASE_URL: 'https://script.google.com/macros/s/AKfycbxVFa5p3Ga6EI2cxbpGASHByo6kkCx-c-qyNkXxHzu8LbL5nFcKMB8BIrxThjAx3Gqf/exec',

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
  deletarOCEvento(oc, eventoCod) { return this.post('deletar_oc_evento', { oc, eventoCod }); },
  deletarPlanoEvento(plano, eventoCod) { return this.post('deletar_plano_evento', { plano, eventoCod }); },
  deletar(tipo, id) { return this.post('deletar', { tipo, id }); },

  // Upload CSV
  uploadCSV(linhas) { return this.post('upload_csv', { linhas }); },
  getUploadStatus() { return this.get('upload_status'); },

  // Jornada do Upgrade
  getJornadaUpgrade(evento, filtros) { return this.post('jornada_upgrade', { evento, filtros }); },
};
