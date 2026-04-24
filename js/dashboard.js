// ===== DASHBOARD =====
const Dashboard = {
  loaded: false,

  async load() {
    if (this.loaded) return;
    const el = document.getElementById('dash-content');
    el.innerHTML = `
      <div class="card" style="margin-bottom:var(--s3)">
        <div class="section-title">Em breve</div>
        <p>Dashboard sendo construído...</p>
      </div>
    `;
  }
};
