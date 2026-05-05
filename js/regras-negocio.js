/* =====================================================
   REGRAS DE NEGÓCIO — JavaScript
   Armazenamento: localStorage key 'cobol-flow-regras'
   Padrão idêntico ao main.js e micro-fluxo.js
   ===================================================== */

'use strict';

const STORAGE_KEY = 'cobol-flow-regras';

// ── Flags de navegação/reload (mesmo padrão das outras páginas) ──
let _skipPagehideSave = false;
let _isNavigating    = false;

function navigateTo(url) {
  _isNavigating = true;
  window.location.href = url;
}

// ── Mapa de cores das categorias ──
const COR_MAP = {
  verde:    { cor: '#10b981', bg: '#d1fae5', border: '#6ee7b7' },
  azul:     { cor: '#3b82f6', bg: '#dbeafe', border: '#93c5fd' },
  roxo:     { cor: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd' },
  laranja:  { cor: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
  vermelho: { cor: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
  rosa:     { cor: '#ec4899', bg: '#fce7f3', border: '#f9a8d4' },
  ciano:    { cor: '#06b6d4', bg: '#cffafe', border: '#67e8f9' },
  indigo:   { cor: '#6366f1', bg: '#e0e7ff', border: '#a5b4fc' },
};

// ── Ícones disponíveis para categorias (agrupados) ──
const ICONES_CAT = {
  'Organização & Arquivos': [
    'ti-folder','ti-folder-open','ti-archive','ti-layers','ti-stack',
    'ti-file-text','ti-file-invoice','ti-clipboard-list','ti-clipboard-check','ti-notes',
    'ti-tag','ti-bookmark','ti-flag','ti-star','ti-paperclip'
  ],
  'Negócios & Finanças': [
    'ti-briefcase','ti-building','ti-building-bank','ti-building-store','ti-building-factory',
    'ti-handshake','ti-certificate','ti-award','ti-trophy','ti-rosette',
    'ti-coin','ti-coins','ti-credit-card','ti-cash','ti-wallet',
    'ti-receipt','ti-percentage','ti-trending-up','ti-trending-down',
    'ti-chart-bar','ti-chart-pie','ti-chart-line','ti-report','ti-report-analytics'
  ],
  'Pessoas & Equipes': [
    'ti-users','ti-user','ti-user-check','ti-user-dollar','ti-user-circle',
    'ti-user-cog','ti-user-shield','ti-user-star','ti-address-book','ti-id-badge'
  ],
  'TI & Sistemas': [
    'ti-database','ti-server','ti-server-2','ti-cloud','ti-cloud-upload',
    'ti-cpu','ti-microchip','ti-circuit-board','ti-device-desktop','ti-device-laptop',
    'ti-device-mobile','ti-router','ti-network','ti-wifi',
    'ti-code','ti-terminal','ti-terminal-2','ti-git-branch','ti-git-merge',
    'ti-api','ti-webhook','ti-plug','ti-bug','ti-robot'
  ],
  'Segurança': [
    'ti-shield-check','ti-shield','ti-shield-lock','ti-lock','ti-lock-open',
    'ti-key','ti-eye','ti-eye-off','ti-fingerprint','ti-scan'
  ],
  'Operações & Processos': [
    'ti-sitemap','ti-arrows-exchange','ti-refresh','ti-settings','ti-settings-2',
    'ti-adjustments','ti-filter','ti-search','ti-clock','ti-history',
    'ti-calendar','ti-send','ti-mail','ti-bell','ti-notification',
    'ti-package','ti-package-import','ti-package-export','ti-truck','ti-box',
    'ti-puzzle','ti-grid-dots','ti-layout-grid','ti-apps','ti-template'
  ],
};

// ── Dados em memória ──
let categorias = [];
let regras = [];
let categoriaSelecionada = null; // { grupoId, filhoId, nome, path }
let regraSelecionadaId   = null;
let pendingExcluirId     = null;
let subTabAtiva          = 'categorias';
let detailSubTabAtiva    = 'geral';

// ── Dados iniciais (seed) ──
const SEED_CATEGORIAS = [
  {
    id: 'seg-negocio', nome: 'Segmentação de Negócio', aberto: true,
    cor: 'verde', icone: 'ti-grid-dots', descricao: 'Define o tipo de cliente e sua natureza.',
    filhos: [
      { id: 'pessoa-fisica',    nome: 'Pessoa Física',   icone: 'ti-user' },
      { id: 'pessoa-juridica',  nome: 'Pessoa Jurídica', icone: 'ti-building' }
    ]
  },
  {
    id: 'class-comercial', nome: 'Classificação Comercial', aberto: true,
    cor: 'azul', icone: 'ti-briefcase', descricao: 'Classificação do porte e grupo comercial.',
    filhos: [
      { id: 'pequeno-grupo', nome: 'Pequeno Grupo', icone: 'ti-building-store' },
      { id: 'grande-grupo',  nome: 'Grande Grupo',  icone: 'ti-building-factory' }
    ]
  },
  {
    id: 'dominio-operacional', nome: 'Domínio Operacional', aberto: true,
    cor: 'roxo', icone: 'ti-database', descricao: 'Áreas de negócio e operações.',
    filhos: [
      { id: 'contrato',       nome: 'Contrato',       icone: 'ti-file-invoice' },
      { id: 'documento',      nome: 'Documento',      icone: 'ti-file-text' },
      { id: 'armazenamento',  nome: 'Armazenamento',  icone: 'ti-archive' }
    ]
  },
  {
    id: 'fluxo-sistemico', nome: 'Fluxo Sistêmico', aberto: true,
    cor: 'laranja', icone: 'ti-sitemap', descricao: 'Como o processo é executado no sistema.',
    filhos: [
      { id: 'cics',                 nome: 'CICS',                  icone: 'ti-terminal' },
      { id: 'batch',                nome: 'Batch',                 icone: 'ti-clock' },
      { id: 'apis',                 nome: 'APIs',                  icone: 'ti-api' },
      { id: 'jobs',                 nome: 'Jobs',                  icone: 'ti-refresh' },
      { id: 'integracoes-externas', nome: 'Integrações externas',  icone: 'ti-arrows-exchange' }
    ]
  },
  {
    id: 'regras-negocio', nome: 'Regras de Negócio', aberto: true,
    cor: 'vermelho', icone: 'ti-shield-check', descricao: 'Tipos de regras aplicadas no processo.',
    filhos: [
      { id: 'validacoes',    nome: 'Validações',    icone: 'ti-clipboard-check' },
      { id: 'elegibilidade', nome: 'Elegibilidade', icone: 'ti-certificate' },
      { id: 'dependentes',   nome: 'Dependentes',   icone: 'ti-users' },
      { id: 'cancelamentos', nome: 'Cancelamentos', icone: 'ti-tag' },
      { id: 'contratos',     nome: 'Contratos',     icone: 'ti-file-invoice' }
    ]
  }
];

const SEED_REGRAS = [];

// ── Persistência ──
function salvarDados() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categorias, regras }));
  } catch (e) { /* quota exceeded — ignorar */ }
}

function carregarDados() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      categorias = parsed.categorias || SEED_CATEGORIAS;
      regras     = parsed.regras     || [];
      return;
    } catch (e) { /* dados corrompidos */ }
  }
  // Seed inicial
  categorias = JSON.parse(JSON.stringify(SEED_CATEGORIAS));
  regras     = [];
}

// ── Helpers ──
function getAgora() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function getHoraAtual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function contarRegras(filhoId) {
  return regras.filter(r => r.categoriaId === filhoId).length;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Renderização da árvore ──
function renderTree(filtro) {
  const tree = document.getElementById('rnTree');
  if (!tree) return;

  const q = (filtro || '').toLowerCase().trim();
  let html = '';

  categorias.forEach(grupo => {
    const filhosFiltrados = q
      ? grupo.filhos.filter(f => f.nome.toLowerCase().includes(q))
      : grupo.filhos;

    if (q && filhosFiltrados.length === 0) return;

    const aberto = q ? true : grupo.aberto;
    const c = COR_MAP[grupo.cor || 'azul'];
    const icClass = grupo.icone || 'ti-folder';

    html += `
      <div class="rn-tree-group" data-grupo="${escapeHtml(grupo.id)}">
        <div class="rn-tree-group-header">
          <span style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;" onclick="toggleGrupo('${escapeHtml(grupo.id)}')">
            <i class="ti ti-chevron-right rn-tree-group-arrow ${aberto ? 'aberto' : ''}"></i>
            <span class="rn-tree-cat-icon" style="background:${c.bg};color:${c.cor}"><i class="ti ${icClass}"></i></span>
            <span class="rn-tree-group-nome">${escapeHtml(grupo.nome)}</span>
          </span>
          <div class="rn-tree-group-actions">
            <button class="rn-tree-add-sub-btn" title="Nova subcategoria" onclick="event.stopPropagation();abrirModalNovaSubcategoria('${escapeHtml(grupo.id)}')"><i class="ti ti-plus"></i></button>
            <button class="rn-tree-edit-btn" title="Editar categoria" onclick="event.stopPropagation();abrirModalEditarCategoria('${escapeHtml(grupo.id)}')"><i class="ti ti-pencil"></i></button>
            <button class="rn-tree-del-btn" title="Excluir categoria" onclick="event.stopPropagation();abrirModalExcluirGrupo('${escapeHtml(grupo.id)}','${escapeHtml(grupo.nome)}')"><i class="ti ti-trash"></i></button>
          </div>
        </div>
        <div class="rn-tree-children ${aberto ? 'aberto' : ''}">`;

    filhosFiltrados.forEach(filho => {
      const total    = contarRegras(filho.id);
      const selClass = (categoriaSelecionada && categoriaSelecionada.filhoId === filho.id) ? ' selecionado' : '';
      html += `
          <div class="rn-tree-item${selClass}">
            <span class="rn-tree-item-sub-icon" style="color:${c.cor}"><i class="ti ${filho.icone || 'ti-folder'}"></i></span>
            <span class="rn-tree-item-label" onclick="selecionarCategoria('${escapeHtml(grupo.id)}','${escapeHtml(filho.id)}','${escapeHtml(filho.nome)}','${escapeHtml(grupo.nome)}')">${escapeHtml(filho.nome)}</span>
            <span class="rn-tree-item-right">
              <span class="rn-tree-item-badge">${total}</span>
              <button class="rn-tree-edit-sub-btn" title="Editar subcategoria" onclick="event.stopPropagation();abrirModalEditarSubcategoria('${escapeHtml(grupo.id)}','${escapeHtml(filho.id)}')"><i class="ti ti-pencil"></i></button>
              <button class="rn-tree-del-sub-btn" title="Excluir subcategoria" onclick="event.stopPropagation();abrirModalExcluirFilho('${escapeHtml(grupo.id)}','${escapeHtml(filho.id)}','${escapeHtml(filho.nome)}')"><i class="ti ti-x"></i></button>
            </span>
          </div>`;
    });

    html += `
        </div>
      </div>`;
  });

  if (!html) {
    html = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">Nenhuma categoria encontrada</div>';
  }

  tree.innerHTML = html;
}

// ── Toggle grupo ──
function toggleGrupo(grupoId) {
  const grupo = categorias.find(g => g.id === grupoId);
  if (!grupo) return;
  grupo.aberto = !grupo.aberto;
  salvarDados();
  renderTree(document.getElementById('rnSearchCat').value);
}

// ── Filtro de categorias ──
function filtrarCategorias(q) {
  renderTree(q);
}

function expandirTudo() {
  categorias.forEach(g => { g.aberto = true; });
  renderTree(document.getElementById('rnSearchCat').value || '');
}

function recolherTudo() {
  categorias.forEach(g => { g.aberto = false; });
  renderTree(document.getElementById('rnSearchCat').value || '');
}

// ── Selecionar categoria ──
function selecionarCategoria(grupoId, filhoId, filhoNome, grupoNome) {
  const grupo = categorias.find(g => g.id === grupoId);
  if (!grupo) return;

  categoriaSelecionada = { grupoId, filhoId, filhoNome, grupoNome };
  regraSelecionadaId   = null;

  // Fechar sidebar no mobile após selecionar
  if (isMobile()) fecharSidebarRN();

  renderTree(document.getElementById('rnSearchCat').value);
  renderTabela();
  renderDetalheVazio();
  atualizarFooter();
}

// ── Renderização da tabela ──
function renderTabela() {
  const toolbar   = document.getElementById('rnListToolbar');
  const tableWrap = document.getElementById('rnTableWrap');
  const paginacao = document.getElementById('rnPagination');
  const breadcrumb = document.getElementById('rnBreadcrumb');

  if (!categoriaSelecionada) {
    toolbar.style.display   = 'none';
    paginacao.style.display = 'none';
    // Mostrar cards de categorias
    const cards = categorias.map(g => {
      const c = COR_MAP[g.cor || 'azul'];
      const ic = g.icone || 'ti-folder';
      const total = g.filhos.reduce((acc, f) => acc + contarRegras(f.id), 0);
      return `
        <div class="rn-cat-card" style="border-left-color:${c.cor}" onclick="abrirGrupoCards('${escapeHtml(g.id)}')">
          <div class="rn-cat-card-icon" style="background:${c.bg};color:${c.cor}">
            <i class="ti ${ic}"></i>
          </div>
          <div class="rn-cat-card-info">
            <div class="rn-cat-card-nome">${escapeHtml(g.nome)}</div>
            <div class="rn-cat-card-desc">${escapeHtml(g.descricao || '')}</div>
            <div class="rn-cat-card-count" style="color:${c.cor}">${total} ${total === 1 ? 'item' : 'itens'}</div>
          </div>
        </div>`;
    }).join('');
    tableWrap.innerHTML = `<div class="rn-cat-cards">${cards || '<div style="padding:30px;text-align:center;color:#9ca3af">Nenhuma categoria cadastrada.</div>'}</div>`;
    return;
  }

  // Breadcrumb
  const path = `${escapeHtml(categoriaSelecionada.grupoNome)} <span>›</span> ${escapeHtml(categoriaSelecionada.filhoNome)}`;
  breadcrumb.innerHTML = path;
  toolbar.style.display = '';

  const lista = regras.filter(r => r.categoriaId === categoriaSelecionada.filhoId);

  if (lista.length === 0) {
    paginacao.style.display = 'none';
    tableWrap.innerHTML = `
      <div class="rn-table-empty">
        <i class="ti ti-notes-off"></i>
        <span>Nenhuma regra cadastrada nesta categoria.<br>Clique em <strong>+ Nova Regra</strong> para adicionar.</span>
      </div>`;
    return;
  }

  paginacao.style.display = '';
  const total = lista.length;
  document.getElementById('rnPagInfo').textContent = `Mostrando 1–${total} de ${total} ${total === 1 ? 'regra' : 'regras'}`;

  const grupo = categorias.find(g => g.id === categoriaSelecionada.grupoId);
  const cGrupo = COR_MAP[(grupo && grupo.cor) ? grupo.cor : 'azul'];
  const idStyle = `background:${cGrupo.bg};color:${cGrupo.cor};border-color:${cGrupo.border}`;

  let rows = '';
  lista.forEach(r => {
    const selClass = regraSelecionadaId === r.id ? ' selecionada' : '';
    const statusClass = { 'Ativa':'ativa', 'Inativa':'inativa', 'Concluído':'concluido', 'Alerta':'alerta', 'Observação':'observacao' }[r.status] || 'inativa';
    rows += `
      <tr class="${selClass}" onclick="selecionarRegra('${escapeHtml(r.id)}')">
        <td><span class="rn-badge-id" style="${idStyle}">${escapeHtml(r.id)}</span></td>
        <td>${escapeHtml(r.nome)}</td>
        <td>${escapeHtml(r.tipo)}</td>
        <td style="color:#6b7280;font-size:12px;">${escapeHtml(r.aplicacao)}</td>
        <td><span class="rn-badge-status ${statusClass}">${escapeHtml(r.status)}</span></td>
        <td>
          <div class="rn-row-actions">
            <button class="rn-row-action-btn" title="Editar" onclick="event.stopPropagation();abrirModalEditarRegra('${escapeHtml(r.id)}')">
              <i class="ti ti-pencil"></i>
            </button>
            <button class="rn-row-action-btn danger" title="Excluir" onclick="event.stopPropagation();abrirModalExcluir('${escapeHtml(r.id)}')">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  });

  tableWrap.innerHTML = `
    <table class="rn-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome da Regra</th>
          <th>Tipo</th>
          <th>Aplicação (Painel)</th>
          <th>Status</th>
          <th style="width:72px"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── Selecionar regra ──
function selecionarRegra(id) {
  regraSelecionadaId = id;
  detailSubTabAtiva  = 'geral';
  renderTabela();
  renderDetalhe();
}

// ── Renderizar detalhe vazio ──
function renderDetalheVazio() {
  document.getElementById('rnDetailEmpty').style.display   = '';
  document.getElementById('rnDetailContent').style.display = 'none';
  document.getElementById('rnDetailPanel').classList.remove('mobile-open');
}

// ── Renderizar detalhe da regra ──
function renderDetalhe() {
  const regra = regras.find(r => r.id === regraSelecionadaId);
  const empty   = document.getElementById('rnDetailEmpty');
  const content = document.getElementById('rnDetailContent');

  if (!regra) {
    empty.style.display   = '';
    content.style.display = 'none';
    return;
  }

  empty.style.display   = 'none';
  content.style.display = 'flex';

  // No mobile, exibir painel detalhe por cima
  if (isMobile()) {
    document.getElementById('rnDetailPanel').classList.add('mobile-open');
  }

  const statusClass = { 'Ativa':'ativa', 'Inativa':'inativa', 'Concluído':'concluido', 'Alerta':'alerta', 'Observação':'observacao' }[regra.status] || 'inativa';

  const grupoDetalhe = categorias.find(g => g.filhos.some(f => f.id === regra.categoriaId));
  const cDetalhe = COR_MAP[(grupoDetalhe && grupoDetalhe.cor) ? grupoDetalhe.cor : 'azul'];
  const idStyleDetalhe = `background:${cDetalhe.bg};color:${cDetalhe.cor};border-color:${cDetalhe.border}`;

  let bodyHtml = '';
  if (detailSubTabAtiva === 'geral') {
    bodyHtml = `
      <div class="rn-detail-section-title">Informações Gerais</div>
      <div class="rn-detail-field">
        <label>ID</label>
        <span class="rn-detail-value">${escapeHtml(regra.id)}</span>
      </div>
      <div class="rn-detail-field">
        <label>Categoria</label>
        <span class="rn-detail-value">${escapeHtml(regra.tipo)}</span>
      </div>
      <div class="rn-detail-field">
        <label>Tipo de Regra</label>
        <span class="rn-detail-value">${escapeHtml(regra.tipo)}</span>
      </div>
      <div class="rn-detail-field">
        <label>Aplicação (Painel)</label>
        <span class="rn-detail-value">${escapeHtml(regra.aplicacao)}</span>
      </div>
      <div class="rn-detail-field">
        <label>Descrição</label>
        <span class="rn-detail-value" style="line-height:1.5;color:#6b7280;">${escapeHtml(regra.descricao)}</span>
      </div>
      <div class="rn-detail-divider"></div>
      <div class="rn-detail-field">
        <label>Ativo</label>
        <span class="rn-detail-value">${escapeHtml(regra.status)}</span>
      </div>
      <div class="rn-detail-field">
        <label>Criado por</label>
        <span class="rn-detail-value">${escapeHtml(regra.criadoPor)}</span>
      </div>
      <div class="rn-detail-field">
        <label>Criado em</label>
        <span class="rn-detail-value">${escapeHtml(regra.criadoEm)}</span>
      </div>
      <div class="rn-detail-field">
        <label>Última alteração</label>
        <span class="rn-detail-value">${escapeHtml(regra.ultimaAlteracao)}</span>
      </div>`;
  } else if (detailSubTabAtiva === 'condicao') {
    const txt = regra.condicao || '';
    bodyHtml = `
      <div class="rn-detail-section-title">Condições da Regra</div>
      ${txt
        ? `<div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${escapeHtml(txt)}</div>`
        : `<div style="color:#9ca3af;font-size:12px;line-height:1.6;">Nenhuma condição configurada. Clique em <strong>Editar Regra</strong> para adicionar condições.</div>`
      }`;
  } else if (detailSubTabAtiva === 'acao') {
    const txt = regra.acao || '';
    bodyHtml = `
      <div class="rn-detail-section-title">Ações da Regra</div>
      ${txt
        ? `<div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${escapeHtml(txt)}</div>`
        : `<div style="color:#9ca3af;font-size:12px;line-height:1.6;">Nenhuma ação configurada. Clique em <strong>Editar Regra</strong> para adicionar ações.</div>`
      }`;
  } else if (detailSubTabAtiva === 'observacoes') {
    const txt = regra.observacoes || '';
    bodyHtml = `
      <div class="rn-detail-section-title">Observações</div>
      ${txt
        ? `<div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${escapeHtml(txt)}</div>`
        : `<div style="color:#9ca3af;font-size:12px;line-height:1.6;">Sem observações registradas.</div>`
      }`;
  }

  const subtabsHtml = ['geral','condicao','acao','observacoes'].map(t => {
    const labels = { geral: 'Geral', condicao: 'Condição', acao: 'Ação', observacoes: 'Observações' };
    return `<button class="rn-detail-subtab${detailSubTabAtiva === t ? ' active' : ''}" onclick="mudarDetalheSubTab('${t}')">${labels[t]}</button>`;
  }).join('');

  content.innerHTML = `
    <div class="rn-detail-top">
      <div class="rn-detail-top-row">
        <div class="rn-detail-badges">
          <span class="rn-badge-rn" style="${idStyleDetalhe}">${escapeHtml(regra.id)}</span>
          <span class="rn-badge-status ${statusClass}">${escapeHtml(regra.status)}</span>
        </div>
        <select class="rn-detail-status-select ${statusClass}" onchange="setStatusRegra('${escapeHtml(regra.id)}', this.value)">
          <option value="Ativa"${regra.status === 'Ativa' ? ' selected' : ''}>Ativa</option>
          <option value="Concluído"${regra.status === 'Concluído' ? ' selected' : ''}>Concluído</option>
          <option value="Alerta"${regra.status === 'Alerta' ? ' selected' : ''}>Alerta</option>
          <option value="Inativa"${regra.status === 'Inativa' ? ' selected' : ''}>Inativa</option>
          <option value="Observação"${regra.status === 'Observação' ? ' selected' : ''}>Observação</option>
        </select>
      </div>
      <div class="rn-detail-nome">${escapeHtml(regra.nome)}</div>
      <div class="rn-detail-desc">${escapeHtml(regra.descricao)}</div>
    </div>
    <div class="rn-detail-subtabs">${subtabsHtml}</div>
    <div class="rn-detail-body">${bodyHtml}</div>
    <div class="rn-detail-footer">
      <button class="rn-btn-editar-regra" onclick="abrirModalEditarRegra('${escapeHtml(regra.id)}')">
        <i class="ti ti-pencil"></i> Editar Regra
      </button>
    </div>`;
}

// ── Trocar aba dentro dos modais Nova/Editar Regra ──
function mudarAbaModal(modal, aba) {
  const p    = modal === 'nova' ? 'Nova' : 'Edit';
  const tabs = ['Geral', 'Condicao', 'Acao', 'Obs'];
  const keys = ['geral', 'condicao', 'acao', 'observacoes'];
  tabs.forEach((t, i) => {
    const btn   = document.getElementById('aba'   + p + t);
    const panel = document.getElementById('panel' + p + t);
    const active = keys[i] === aba;
    if (btn)   btn.classList.toggle('active', active);
    if (panel) panel.style.display = active ? '' : 'none';
  });
}

// ── Alterar status pelo select do detalhe ──
function setStatusRegra(id, novoStatus) {
  const regra = regras.find(r => r.id === id);
  if (!regra) return;
  regra.status = novoStatus;
  regra.ultimaAlteracao = getAgora() + ' por paruline';
  salvarDados();
  renderTabela();
  renderDetalhe();
  atualizarFooter();
}

// ── Alternar status direto do badge no detalhe ──
function alternarStatusRegra(id) {
  const regra = regras.find(r => r.id === id);
  if (!regra) return;
  regra.status = regra.status === 'Ativa' ? 'Inativa' : 'Ativa';
  regra.ultimaAlteracao = getAgora() + ' por paruline';
  salvarDados();
  renderTabela();
  renderDetalhe();
  atualizarFooter();
}

// ── Sub-tab do detalhe ──
function mudarDetalheSubTab(tab) {
  detailSubTabAtiva = tab;
  renderDetalhe();
}

// ── Sub-tab principal ──
function mudarSubTab(tab) {
  subTabAtiva = tab;
  document.querySelectorAll('.rn-subtab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

// ── Dropdowns ──
function toggleDropdown(wrapperId) {
  const wrapper  = document.getElementById(wrapperId);
  const dropdown = wrapper.querySelector('.rn-dropdown');
  const isOpen   = dropdown.classList.contains('open');
  fecharTodosDropdowns();
  if (!isOpen) dropdown.classList.add('open');
}

function fecharTodosDropdowns() {
  document.querySelectorAll('.rn-dropdown.open').forEach(d => d.classList.remove('open'));
}

// ── Exportação ──
function _getRegrasFiltradas() {
  if (categoriaSelecionada) {
    return regras.filter(r => r.categoriaId === categoriaSelecionada.filhoId);
  }
  return regras;
}

function _getNomeArquivo(ext) {
  const base = categoriaSelecionada
    ? (categoriaSelecionada.grupoNome + '-' + categoriaSelecionada.filhoNome)
    : 'regras-negocio';
  return base.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,'-').replace(/[^a-zA-Z0-9-]/g,'').toLowerCase() + '.' + ext;
}

function _downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
}

function _getGrupoNome(regra) {
  const grupo = categorias.find(g => g.filhos.some(f => f.id === regra.categoriaId));
  return grupo ? grupo.nome : '';
}

function _getFilhoNome(regra) {
  for (const g of categorias) {
    const f = g.filhos.find(f => f.id === regra.categoriaId);
    if (f) return f.nome;
  }
  return '';
}

function exportarCSV() {
  fecharTodosDropdowns();
  const lista = _getRegrasFiltradas();
  const headers = ['ID','Nome','Tipo','Aplicação','Status','Categoria','Subcategoria','Descrição','Condição','Ação','Observações','Criado Por','Criado Em','Última Alteração'];
  const esc = v => '"' + String(v || '').replace(/"/g, '""') + '"';
  const rows = lista.map(r => [
    r.id, r.nome, r.tipo, r.aplicacao, r.status,
    _getGrupoNome(r), _getFilhoNome(r),
    r.descricao, r.condicao, r.acao, r.observacoes,
    r.criadoPor, r.criadoEm, r.ultimaAlteracao
  ].map(esc).join(';'));
  const csv = '\uFEFF' + [headers.map(esc).join(';'), ...rows].join('\r\n');
  _downloadBlob(csv, _getNomeArquivo('csv'), 'text/csv;charset=utf-8;');
}

function exportarExcel() {
  fecharTodosDropdowns();
  const lista = _getRegrasFiltradas();
  const headers = ['ID','Nome','Tipo','Aplicação','Status','Categoria','Subcategoria','Descrição','Condição','Ação','Observações','Criado Por','Criado Em','Última Alteração'];
  const esc = v => `<td>${String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>`;
  const headerRow = headers.map(h => `<th>${h}</th>`).join('');
  const dataRows  = lista.map(r => '<tr>' + [
    r.id, r.nome, r.tipo, r.aplicacao, r.status,
    _getGrupoNome(r), _getFilhoNome(r),
    r.descricao, r.condicao, r.acao, r.observacoes,
    r.criadoPor, r.criadoEm, r.ultimaAlteracao
  ].map(esc).join('') + '</tr>').join('');
  const xls = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Regras</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table></body></html>`;
  _downloadBlob(xls, _getNomeArquivo('xls'), 'application/vnd.ms-excel;charset=utf-8;');
}

function exportarJSON() {
  fecharTodosDropdowns();
  const lista = _getRegrasFiltradas();
  const payload = {
    exportadoEm: new Date().toISOString(),
    totalRegras: lista.length,
    categorias: categorias.map(g => ({
      id: g.id, nome: g.nome, descricao: g.descricao, cor: g.cor, icone: g.icone,
      subcategorias: g.filhos.map(f => ({ id: f.id, nome: f.nome, icone: f.icone }))
    })),
    regras: lista
  };
  _downloadBlob(JSON.stringify(payload, null, 2), _getNomeArquivo('json'), 'application/json;charset=utf-8;');
}

function exportarPDF() {
  fecharTodosDropdowns();
  const lista = _getRegrasFiltradas();
  const titulo = categoriaSelecionada
    ? (categoriaSelecionada.grupoNome + ' › ' + categoriaSelecionada.filhoNome)
    : 'Todas as Regras de Negócio';
  const headers = ['ID','Nome','Tipo','Aplicação','Status'];
  const esc = v => String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const statusColor = { Ativa:'#10b981', Inativa:'#6b7280', 'Concluído':'#3b82f6', Alerta:'#f59e0b', 'Observação':'#8b5cf6' };
  const rows = lista.map(r => `
    <tr>
      <td><b>${esc(r.id)}</b></td>
      <td>${esc(r.nome)}</td>
      <td>${esc(r.tipo)}</td>
      <td>${esc(r.aplicacao)}</td>
      <td style="color:${statusColor[r.status]||'#374151'};font-weight:600">${esc(r.status)}</td>
    </tr>
    ${r.descricao ? `<tr class="desc-row"><td colspan="5" style="color:#6b7280;font-size:11px;padding:0 8px 6px 8px">${esc(r.descricao)}</td></tr>` : ''}`).join('');

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Exportar PDF — ${esc(titulo)}</title>
    <style>
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family: Arial, sans-serif; font-size: 12px; color:#1f2937; padding:30px; }
      h1 { font-size:18px; margin-bottom:4px; }
      .meta { font-size:11px; color:#6b7280; margin-bottom:20px; }
      table { width:100%; border-collapse:collapse; }
      th { background:#f3f4f6; text-align:left; padding:7px 8px; font-size:11px; text-transform:uppercase; letter-spacing:.05em; border-bottom:2px solid #e5e7eb; }
      td { padding:6px 8px; border-bottom:1px solid #f3f4f6; vertical-align:top; }
      tr:hover td { background:#f9fafb; }
      @media print { body { padding:10px; } button { display:none; } }
    </style>
  </head><body>
    <h1>Regras de Negócio</h1>
    <div class="meta">${esc(titulo)} &nbsp;·&nbsp; ${lista.length} ${lista.length===1?'regra':'regras'} &nbsp;·&nbsp; Exportado em ${new Date().toLocaleDateString('pt-BR')}</div>
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

// ── Exportar tudo (JSON completo) ──
function exportarTudo() {
  fecharTodosDropdowns();
  const payload = {
    versao: '1.0',
    exportadoEm: new Date().toISOString(),
    categorias: categorias,
    regras: regras
  };
  _downloadBlob(JSON.stringify(payload, null, 2), 'regras-negocio-backup-' + _dataHoje() + '.json', 'application/json;charset=utf-8;');
}

function _dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

// ── Importação via JSON ──
function importarJSON() {
  fecharTodosDropdowns();
  document.getElementById('inputImportarJSON').click();
}

function _onImportarJSONChange(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      _processarImportJSON(data);
    } catch {
      _mostrarToastImport('❌ Arquivo inválido. Verifique se é um JSON exportado por este sistema.', 'erro');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

function _processarImportJSON(data) {
  const cats  = Array.isArray(data.categorias) ? data.categorias : [];
  const regs  = Array.isArray(data.regras)     ? data.regras     : [];
  if (cats.length === 0 && regs.length === 0) {
    _mostrarToastImport('❌ Arquivo sem dados reconhecíveis.', 'erro');
    return;
  }
  // Acumular: mescla categorias existentes com novas
  let catsAdicionadas = 0, catsAtualizadas = 0;
  cats.forEach(importCat => {
    const existente = categorias.find(g => g.id === importCat.id);
    if (existente) {
      // Atualiza metadados, mescla filhos
      existente.nome      = importCat.nome      || existente.nome;
      existente.descricao = importCat.descricao !== undefined ? importCat.descricao : existente.descricao;
      existente.cor       = importCat.cor       || existente.cor;
      existente.icone     = importCat.icone     || existente.icone;
      const filhos = Array.isArray(importCat.filhos) ? importCat.filhos : [];
      filhos.forEach(f => {
        if (!existente.filhos.find(ef => ef.id === f.id)) {
          existente.filhos.push(f);
        }
      });
      catsAtualizadas++;
    } else {
      categorias.push({ ...importCat, filhos: Array.isArray(importCat.filhos) ? importCat.filhos : [], aberto: false });
      catsAdicionadas++;
    }
  });
  let regsAdicionadas = 0, regsDuplicadas = 0;
  regs.forEach(r => {
    if (regras.find(er => er.id === r.id)) {
      regsDuplicadas++;
    } else {
      regras.push(r);
      regsAdicionadas++;
    }
  });
  salvarDados();
  renderTree('');
  renderTabela();
  renderDetalhe();
  atualizarFooter();
  const msg = [
    catsAdicionadas  ? `${catsAdicionadas} categoria(s) adicionada(s)`   : '',
    catsAtualizadas  ? `${catsAtualizadas} categoria(s) atualizada(s)`   : '',
    regsAdicionadas  ? `${regsAdicionadas} regra(s) importada(s)`        : '',
    regsDuplicadas   ? `${regsDuplicadas} regra(s) ignorada(s) (ID já existe)` : '',
  ].filter(Boolean).join(' · ');
  _mostrarToastImport('✅ Importação concluída — ' + msg, 'ok');
}

// ── Importação via CSV (apenas regras) ──
function importarCSV() {
  fecharTodosDropdowns();
  document.getElementById('inputImportarCSV').click();
}

function _onImportarCSVChange(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  const reader = new FileReader();
  reader.onload = e => _processarImportCSV(e.target.result);
  reader.readAsText(file, 'UTF-8');
}

function _processarImportCSV(texto) {
  // Remove BOM se houver
  const conteudo = texto.replace(/^\uFEFF/, '');
  const linhas = conteudo.split(/\r?\n/).filter(l => l.trim());
  if (linhas.length < 2) { _mostrarToastImport('❌ CSV vazio ou sem dados.', 'erro'); return; }

  // Detectar separador
  const sep = linhas[0].includes(';') ? ';' : ',';
  const parseLine = line => {
    const result = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuote = !inQuote; }
      else if (c === sep && !inQuote) { result.push(cur.replace(/""/g,'"')); cur = ''; }
      else { cur += c; }
    }
    result.push(cur.replace(/""/g,'"'));
    return result;
  };

  const headers = parseLine(linhas[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g,''));
  const idx = k => headers.indexOf(k);

  let adicionadas = 0, duplicadas = 0;
  for (let i = 1; i < linhas.length; i++) {
    const cols = parseLine(linhas[i]);
    const id = (cols[idx('id')] || '').trim().toUpperCase();
    if (!id) continue;
    if (regras.find(r => r.id === id)) { duplicadas++; continue; }

    // Descobrir categoriaId pela subcategoria ou por grupoId
    const subNome  = (cols[idx('subcategoria')] || '').trim();
    const grupoNome= (cols[idx('categoria')]    || '').trim();
    let filhoId = '', grupoId = '';
    for (const g of categorias) {
      if (grupoNome && g.nome !== grupoNome) continue;
      const f = g.filhos.find(f => f.nome === subNome);
      if (f) { filhoId = f.id; grupoId = g.id; break; }
    }

    const agora = getAgora();
    regras.push({
      id,
      nome:           (cols[idx('nome')]        || '').trim(),
      tipo:           (cols[idx('tipo')]        || 'Validação').trim(),
      aplicacao:      (cols[idx('aplicao')]     || cols[idx('aplicacao')] || '2 - Válida Dados').trim(),
      status:         (cols[idx('status')]      || 'Ativa').trim(),
      categoriaId:    filhoId,
      grupoId,
      descricao:      (cols[idx('descrio')]     || cols[idx('descricao')] || '').trim(),
      condicao:       (cols[idx('condio')]      || cols[idx('condicao')]  || '').trim(),
      acao:           (cols[idx('ao')]          || cols[idx('acao')]      || '').trim(),
      observacoes:    (cols[idx('observaes')]   || cols[idx('observacoes')]|| '').trim(),
      criadoPor:      (cols[idx('criadopor')]   || 'importado').trim(),
      criadoEm:       (cols[idx('criadoem')]    || agora),
      ultimaAlteracao:(cols[idx('ltimaalterao')]|| agora)
    });
    adicionadas++;
  }
  salvarDados();
  renderTree('');
  renderTabela();
  renderDetalhe();
  atualizarFooter();
  const msg = [
    adicionadas ? `${adicionadas} regra(s) importada(s)` : '0 regras importadas',
    duplicadas  ? `${duplicadas} ignorada(s) (ID duplicado)` : ''
  ].filter(Boolean).join(' · ');
  _mostrarToastImport('✅ ' + msg, adicionadas ? 'ok' : 'aviso');
}

// ── Toast de resultado de importação ──
function _mostrarToastImport(msg, tipo) {
  let toast = document.getElementById('rnImportToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'rnImportToast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'rn-import-toast ' + (tipo === 'erro' ? 'erro' : tipo === 'aviso' ? 'aviso' : 'ok');
  toast.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 5000);
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.rn-dropdown-wrapper')) fecharTodosDropdowns();
  if (!e.target.closest('.config-menu-wrapper'))  fecharConfigDropdown();
});

// ── Config dropdown ──
function fecharConfigDropdown() {
  const dd = document.getElementById('configDropdown');
  if (dd) dd.classList.remove('open');
}

// ── Modal Nova Regra ──
function abrirModalNovaRegra() {
  preencherSelectCategorias('novaRegraCategoria');
  document.getElementById('novaRegraId').value        = gerarProximoId();
  document.getElementById('novaRegraNome').value      = '';
  document.getElementById('novaRegraTipo').value      = 'Validação';
  document.getElementById('novaRegraAplicacao').value = '2 - Válida Dados';
  document.getElementById('novaRegraStatus').value    = 'Ativa';
  document.getElementById('novaRegraDesc').value      = '';
  document.getElementById('novaRegraCondicao').value  = '';
  document.getElementById('novaRegraAcao').value      = '';
  document.getElementById('novaRegraObs').value       = '';
  // Pré-selecionar categoria se já houver uma selecionada na árvore
  if (categoriaSelecionada) {
    const sel = document.getElementById('novaRegraCategoria');
    sel.value = `${categoriaSelecionada.grupoId}::${categoriaSelecionada.filhoId}`;
  }
  mudarAbaModal('nova', 'geral');
  document.getElementById('modalNovaRegraOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('novaRegraNome').focus(), 50);
}

function fecharModalNovaRegra() {
  document.getElementById('modalNovaRegraOverlay').style.display = 'none';
}

function salvarNovaRegra() {
  const id        = document.getElementById('novaRegraId').value.trim().toUpperCase();
  const nome      = document.getElementById('novaRegraNome').value.trim();
  const tipo      = document.getElementById('novaRegraTipo').value;
  const catVal    = document.getElementById('novaRegraCategoria').value;
  const aplicacao = document.getElementById('novaRegraAplicacao').value;
  const status    = document.getElementById('novaRegraStatus').value;
  const descricao = document.getElementById('novaRegraDesc').value.trim();
  const condicao  = document.getElementById('novaRegraCondicao').value.trim();
  const acao      = document.getElementById('novaRegraAcao').value.trim();
  const observacoes = document.getElementById('novaRegraObs').value.trim();

  if (!id || !nome) {
    alert('Por favor, preencha o ID e o Nome da regra.');
    return;
  }
  if (regras.some(r => r.id === id)) {
    alert(`Já existe uma regra com o ID "${id}". Escolha outro ID.`);
    return;
  }

  const [grupoId, filhoId] = catVal.split('::');
  const agora = getAgora();

  const novaRegra = {
    id, nome, categoriaId: filhoId, grupoId, tipo, aplicacao, status, descricao,
    condicao, acao, observacoes,
    criadoPor: 'paruline', criadoEm: agora, ultimaAlteracao: agora + ' por paruline'
  };

  regras.push(novaRegra);
  salvarDados();
  fecharModalNovaRegra();

  // Selecionar a categoria da nova regra e mostrar
  const grupo = categorias.find(g => g.id === grupoId);
  const filho = grupo ? grupo.filhos.find(f => f.id === filhoId) : null;
  if (grupo && filho) {
    categoriaSelecionada = { grupoId, filhoId, filhoNome: filho.nome, grupoNome: grupo.nome };
    regraSelecionadaId   = id;
  }
  renderTree('');
  renderTabela();
  renderDetalhe();
  atualizarFooter();
}

// ── Modal Editar Regra ──
function abrirModalEditarRegra(id) {
  const regra = regras.find(r => r.id === id);
  if (!regra) return;

  preencherSelectCategorias('editRegraCategoria');

  document.getElementById('editRegraOriginalId').value  = id;
  document.getElementById('editRegraId').value          = regra.id;
  document.getElementById('editRegraNome').value        = regra.nome;
  document.getElementById('editRegraTipo').value        = regra.tipo;
  document.getElementById('editRegraAplicacao').value   = regra.aplicacao;
  document.getElementById('editRegraStatus').value      = regra.status;
  document.getElementById('editRegraDesc').value        = regra.descricao;
  document.getElementById('editRegraCondicao').value    = regra.condicao  || '';
  document.getElementById('editRegraAcao').value        = regra.acao      || '';
  document.getElementById('editRegraObs').value         = regra.observacoes || '';
  mudarAbaModal('edit', 'geral');

  // Selecionar a categoria correta
  const selectCat = document.getElementById('editRegraCategoria');
  const targetVal = `${regra.grupoId}::${regra.categoriaId}`;
  for (let opt of selectCat.options) {
    if (opt.value === targetVal) { opt.selected = true; break; }
  }

  document.getElementById('modalEditarRegraOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('editRegraNome').focus(), 50);
}

function fecharModalEditarRegra() {
  document.getElementById('modalEditarRegraOverlay').style.display = 'none';
}

function confirmarEdicaoRegra() {
  const originalId  = document.getElementById('editRegraOriginalId').value;
  const novoId      = document.getElementById('editRegraId').value.trim().toUpperCase();
  const nome        = document.getElementById('editRegraNome').value.trim();
  const tipo        = document.getElementById('editRegraTipo').value;
  const catVal      = document.getElementById('editRegraCategoria').value;
  const aplicacao   = document.getElementById('editRegraAplicacao').value;
  const status      = document.getElementById('editRegraStatus').value;
  const descricao   = document.getElementById('editRegraDesc').value.trim();
  const condicao    = document.getElementById('editRegraCondicao').value.trim();
  const acao        = document.getElementById('editRegraAcao').value.trim();
  const observacoes = document.getElementById('editRegraObs').value.trim();

  if (!novoId || !nome) {
    alert('Por favor, preencha o ID e o Nome da regra.');
    return;
  }
  if (novoId !== originalId && regras.some(r => r.id === novoId)) {
    alert(`Já existe uma regra com o ID "${novoId}". Escolha outro ID.`);
    return;
  }

  const [grupoId, filhoId] = catVal.split('::');
  const agora = getAgora();

  const idx = regras.findIndex(r => r.id === originalId);
  if (idx < 0) return;

  regras[idx] = {
    ...regras[idx],
    id: novoId, nome, categoriaId: filhoId, grupoId, tipo, aplicacao, status, descricao,
    condicao, acao, observacoes,
    ultimaAlteracao: agora + ' por paruline'
  };

  if (regraSelecionadaId === originalId) regraSelecionadaId = novoId;

  salvarDados();
  fecharModalEditarRegra();
  renderTree('');
  renderTabela();
  renderDetalhe();
  atualizarFooter();
}

// ── Modal Excluir ──
function abrirModalExcluir(id) {
  pendingExcluirId = id;
  document.getElementById('excluirRegraId').textContent = id;
  document.getElementById('modalExcluirOverlay').style.display = 'flex';
}

function fecharModalExcluir() {
  document.getElementById('modalExcluirOverlay').style.display = 'none';
  pendingExcluirId = null;
}

function confirmarExclusaoRegra() {
  if (!pendingExcluirId) return;
  regras = regras.filter(r => r.id !== pendingExcluirId);
  if (regraSelecionadaId === pendingExcluirId) {
    regraSelecionadaId = null;
  }
  salvarDados();
  fecharModalExcluir();
  renderTree('');
  renderTabela();
  renderDetalheVazio();
  atualizarFooter();
}

// ── Modal Nova Categoria ──
function abrirModalNovaCategoria() {
  document.getElementById('novaCatNome').value = '';
  document.getElementById('novaCatDesc').value = '';
  document.getElementById('novaCatCor').value  = 'verde';
  document.getElementById('novaCatIcone').value = 'ti-folder';

  // Reset color picker
  document.querySelectorAll('#novaCatCorPicker .rn-color-swatch').forEach((s, i) => {
    s.classList.toggle('selected', i === 0);
  });

  // Render icon picker por categoria
  const picker = document.getElementById('novaCatIconePicker');
  let primeiroIcone = true;
  picker.innerHTML = Object.entries(ICONES_CAT).map(([cat, icones]) => {
    const swatches = icones.map(ic => {
      const sel = primeiroIcone ? ' selected' : '';
      if (primeiroIcone) {
        document.getElementById('novaCatIcone').value = ic;
        primeiroIcone = false;
      }
      return `<div class="rn-icon-swatch${sel}" data-icone="${ic}" onclick="selecionarIconeCat(this)" title="${ic.replace('ti-','')}"><i class="ti ${ic}"></i></div>`;
    }).join('');
    return `<div class="rn-icon-group"><div class="rn-icon-group-label">${cat}</div><div class="rn-icon-group-swatches">${swatches}</div></div>`;
  }).join('');

  document.getElementById('modalNovaCatOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('novaCatNome').focus(), 50);
}

function fecharModalNovaCategoria() {
  document.getElementById('modalNovaCatOverlay').style.display = 'none';
}

// Seletor de cor no modal Nova Categoria
function selecionarCorCat(el) {
  document.querySelectorAll('#novaCatCorPicker .rn-color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('novaCatCor').value = el.dataset.cor;
}

// Seletor de ícone no modal Nova Categoria
function selecionarIconeCat(el) {
  document.querySelectorAll('#novaCatIconePicker .rn-icon-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('novaCatIcone').value = el.dataset.icone;
}

// Expandir grupo ao clicar no card
function abrirGrupoCards(grupoId) {
  const grupo = categorias.find(g => g.id === grupoId);
  if (!grupo) return;
  grupo.aberto = true;
  if (grupo.filhos.length > 0) {
    const filho = grupo.filhos[0];
    selecionarCategoria(grupo.id, filho.id, filho.nome, grupo.nome);
  } else {
    renderTree('');
  }
}

function salvarNovaCategoria() {
  const nome     = document.getElementById('novaCatNome').value.trim();
  const descricao= document.getElementById('novaCatDesc').value.trim();
  const cor      = document.getElementById('novaCatCor').value  || 'azul';
  const icone    = document.getElementById('novaCatIcone').value|| 'ti-folder';

  if (!nome) {
    alert('Por favor, informe o nome da categoria.');
    return;
  }

  const id = nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');

  if (categorias.some(g => g.id === id)) {
    alert('Já existe uma categoria com esse nome.');
    return;
  }

  categorias.push({ id, nome, descricao, cor, icone, aberto: true, filhos: [] });
  salvarDados();
  fecharModalNovaCategoria();
  renderTree('');
  renderTabela();
  preencherTodosSelects();
}

// ── Modal Nova Subcategoria ──
let _subCatGrupoId = null;

function abrirModalNovaSubcategoria(grupoId) {
  _subCatGrupoId = grupoId;
  const grupo = categorias.find(g => g.id === grupoId);
  const titulo = document.getElementById('novaSubCatGrupoNome');
  if (titulo && grupo) titulo.textContent = grupo.nome;
  document.getElementById('novaSubCatNome').value = '';
  document.getElementById('novaSubCatIcone').value = 'ti-folder';

  // Render icon picker
  const picker = document.getElementById('novaSubCatIconePicker');
  let primeiro = true;
  picker.innerHTML = Object.entries(ICONES_CAT).map(([cat, icones]) => {
    const swatches = icones.map(ic => {
      const sel = primeiro ? ' selected' : '';
      if (primeiro) {
        document.getElementById('novaSubCatIcone').value = ic;
        primeiro = false;
      }
      return `<div class="rn-icon-swatch${sel}" data-icone="${ic}" onclick="selecionarIconeSubCat(this)" title="${ic.replace('ti-','')}"><i class="ti ${ic}"></i></div>`;
    }).join('');
    return `<div class="rn-icon-group"><div class="rn-icon-group-label">${cat}</div><div class="rn-icon-group-swatches">${swatches}</div></div>`;
  }).join('');

  document.getElementById('modalNovaSubCatOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('novaSubCatNome').focus(), 50);
}

function fecharModalNovaSubcategoria() {
  document.getElementById('modalNovaSubCatOverlay').style.display = 'none';
  _subCatGrupoId = null;
}

// Seletor de ícone no modal Nova Subcategoria
function selecionarIconeSubCat(el) {
  document.querySelectorAll('#novaSubCatIconePicker .rn-icon-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('novaSubCatIcone').value = el.dataset.icone;
}

function salvarNovaSubcategoria() {
  const nome  = document.getElementById('novaSubCatNome').value.trim();
  const icone = document.getElementById('novaSubCatIcone').value || 'ti-folder';
  if (!nome) {
    alert('Por favor, informe o nome da subcategoria.');
    return;
  }
  const grupo = categorias.find(g => g.id === _subCatGrupoId);
  if (!grupo) return;

  const id = (_subCatGrupoId + '-' + nome).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
    .substring(0, 60);

  const idFinal = categorias.some(g => g.filhos.some(f => f.id === id))
    ? id + '-' + Date.now()
    : id;

  grupo.filhos.push({ id: idFinal, nome, icone });
  grupo.aberto = true;
  salvarDados();
  fecharModalNovaSubcategoria();
  renderTree('');
  preencherTodosSelects();
}

// ── Editar Categoria ──
let _editarCatId = null;

function abrirModalEditarCategoria(grupoId) {
  const grupo = categorias.find(g => g.id === grupoId);
  if (!grupo) return;
  _editarCatId = grupoId;

  document.getElementById('editarCatNome').value  = grupo.nome;
  document.getElementById('editarCatDesc').value  = grupo.descricao || '';
  document.getElementById('editarCatCor').value   = grupo.cor || 'azul';
  document.getElementById('editarCatIcone').value = grupo.icone || 'ti-folder';

  // Color picker: marcar cor atual
  document.querySelectorAll('#editarCatCorPicker .rn-color-swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.cor === (grupo.cor || 'azul'));
  });

  // Icon picker com seleção atual
  const picker = document.getElementById('editarCatIconePicker');
  const corAtual = grupo.icone || 'ti-folder';
  picker.innerHTML = Object.entries(ICONES_CAT).map(([cat, icones]) => {
    const swatches = icones.map(ic =>
      `<div class="rn-icon-swatch${ic === corAtual ? ' selected' : ''}" data-icone="${ic}" onclick="selecionarIconeEditarCat(this)" title="${ic.replace('ti-','')}"><i class="ti ${ic}"></i></div>`
    ).join('');
    return `<div class="rn-icon-group"><div class="rn-icon-group-label">${cat}</div><div class="rn-icon-group-swatches">${swatches}</div></div>`;
  }).join('');

  document.getElementById('modalEditarCatOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('editarCatNome').focus(), 50);
}

function fecharModalEditarCategoria() {
  document.getElementById('modalEditarCatOverlay').style.display = 'none';
  _editarCatId = null;
}

function selecionarCorEditarCat(el) {
  document.querySelectorAll('#editarCatCorPicker .rn-color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('editarCatCor').value = el.dataset.cor;
}

function selecionarIconeEditarCat(el) {
  document.querySelectorAll('#editarCatIconePicker .rn-icon-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('editarCatIcone').value = el.dataset.icone;
}

function salvarEditarCategoria() {
  const nome = document.getElementById('editarCatNome').value.trim();
  if (!nome) { alert('Por favor, informe o nome da categoria.'); return; }

  const grupo = categorias.find(g => g.id === _editarCatId);
  if (!grupo) return;

  grupo.nome     = nome;
  grupo.descricao= document.getElementById('editarCatDesc').value.trim();
  grupo.cor      = document.getElementById('editarCatCor').value  || 'azul';
  grupo.icone    = document.getElementById('editarCatIcone').value|| 'ti-folder';

  salvarDados();
  fecharModalEditarCategoria();
  renderTree('');
  renderTabela();
  preencherTodosSelects();
}

// ── Editar Subcategoria ──
let _editarSubCatGrupoId = null;
let _editarSubCatFilhoId = null;

function abrirModalEditarSubcategoria(grupoId, filhoId) {
  const grupo = categorias.find(g => g.id === grupoId);
  if (!grupo) return;
  const filho = grupo.filhos.find(f => f.id === filhoId);
  if (!filho) return;

  _editarSubCatGrupoId = grupoId;
  _editarSubCatFilhoId = filhoId;

  document.getElementById('editarSubCatGrupoNome').textContent = grupo.nome;
  document.getElementById('editarSubCatNome').value  = filho.nome;
  document.getElementById('editarSubCatIcone').value = filho.icone || 'ti-folder';

  const icAtual = filho.icone || 'ti-folder';
  const picker  = document.getElementById('editarSubCatIconePicker');
  picker.innerHTML = Object.entries(ICONES_CAT).map(([cat, icones]) => {
    const swatches = icones.map(ic =>
      `<div class="rn-icon-swatch${ic === icAtual ? ' selected' : ''}" data-icone="${ic}" onclick="selecionarIconeEditarSubCat(this)" title="${ic.replace('ti-','')}"><i class="ti ${ic}"></i></div>`
    ).join('');
    return `<div class="rn-icon-group"><div class="rn-icon-group-label">${cat}</div><div class="rn-icon-group-swatches">${swatches}</div></div>`;
  }).join('');

  document.getElementById('modalEditarSubCatOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('editarSubCatNome').focus(), 50);
}

function fecharModalEditarSubcategoria() {
  document.getElementById('modalEditarSubCatOverlay').style.display = 'none';
  _editarSubCatGrupoId = null;
  _editarSubCatFilhoId = null;
}

function selecionarIconeEditarSubCat(el) {
  document.querySelectorAll('#editarSubCatIconePicker .rn-icon-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('editarSubCatIcone').value = el.dataset.icone;
}

function salvarEditarSubcategoria() {
  const nome = document.getElementById('editarSubCatNome').value.trim();
  if (!nome) { alert('Por favor, informe o nome da subcategoria.'); return; }

  const grupo = categorias.find(g => g.id === _editarSubCatGrupoId);
  if (!grupo) return;
  const filho = grupo.filhos.find(f => f.id === _editarSubCatFilhoId);
  if (!filho) return;

  filho.nome  = nome;
  filho.icone = document.getElementById('editarSubCatIcone').value || 'ti-folder';

  salvarDados();
  fecharModalEditarSubcategoria();
  renderTree('');
  preencherTodosSelects();
}

// ── Excluir Grupo (categoria pai) ──
let _excluirGrupoId = null;

function abrirModalExcluirGrupo(grupoId, grupoNome) {
  _excluirGrupoId = grupoId;
  const grupo = categorias.find(g => g.id === grupoId);
  const totalRegrasGrupo = grupo
    ? grupo.filhos.reduce((acc, f) => acc + contarRegras(f.id), 0)
    : 0;

  const el = document.getElementById('excluirGrupoNome');
  if (el) el.textContent = grupoNome;
  const aviso = document.getElementById('excluirGrupoAviso');
  if (aviso) {
    aviso.textContent = totalRegrasGrupo > 0
      ? `Atenção: esta categoria contém ${totalRegrasGrupo} regra(s) que também serão excluídas.`
      : '';
    aviso.style.display = totalRegrasGrupo > 0 ? '' : 'none';
  }
  document.getElementById('modalExcluirGrupoOverlay').style.display = 'flex';
}

function fecharModalExcluirGrupo() {
  document.getElementById('modalExcluirGrupoOverlay').style.display = 'none';
  _excluirGrupoId = null;
}

function confirmarExcluirGrupo() {
  const grupo = categorias.find(g => g.id === _excluirGrupoId);
  if (grupo) {
    // Remover regras vinculadas a qualquer filho desse grupo
    const filhoIds = grupo.filhos.map(f => f.id);
    regras = regras.filter(r => !filhoIds.includes(r.categoriaId));
    // Se categoria selecionada é deste grupo, limpar
    if (categoriaSelecionada && categoriaSelecionada.grupoId === _excluirGrupoId) {
      categoriaSelecionada = null;
      regraSelecionadaId   = null;
    }
  }
  categorias = categorias.filter(g => g.id !== _excluirGrupoId);
  salvarDados();
  fecharModalExcluirGrupo();
  renderTree('');
  renderTabela();
  renderDetalheVazio();
  preencherTodosSelects();
  atualizarFooter();
}

// ── Excluir Filho (subcategoria) ──
let _excluirFilhoGrupoId = null;
let _excluirFilhoId      = null;

function abrirModalExcluirFilho(grupoId, filhoId, filhoNome) {
  _excluirFilhoGrupoId = grupoId;
  _excluirFilhoId      = filhoId;
  const total = contarRegras(filhoId);

  const el = document.getElementById('excluirFilhoNome');
  if (el) el.textContent = filhoNome;
  const aviso = document.getElementById('excluirFilhoAviso');
  if (aviso) {
    aviso.textContent = total > 0
      ? `Atenção: esta subcategoria contém ${total} regra(s) que também serão excluídas.`
      : '';
    aviso.style.display = total > 0 ? '' : 'none';
  }
  document.getElementById('modalExcluirFilhoOverlay').style.display = 'flex';
}

function fecharModalExcluirFilho() {
  document.getElementById('modalExcluirFilhoOverlay').style.display = 'none';
  _excluirFilhoGrupoId = null;
  _excluirFilhoId      = null;
}

function confirmarExcluirFilho() {
  const grupo = categorias.find(g => g.id === _excluirFilhoGrupoId);
  if (grupo) {
    grupo.filhos = grupo.filhos.filter(f => f.id !== _excluirFilhoId);
    regras = regras.filter(r => r.categoriaId !== _excluirFilhoId);
    if (categoriaSelecionada && categoriaSelecionada.filhoId === _excluirFilhoId) {
      categoriaSelecionada = null;
      regraSelecionadaId   = null;
    }
  }
  salvarDados();
  fecharModalExcluirFilho();
  renderTree('');
  renderTabela();
  renderDetalheVazio();
  preencherTodosSelects();
  atualizarFooter();
}

// ── Helpers de formulário ──
function preencherSelectCategorias(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '';
  categorias.forEach(grupo => {
    if (grupo.filhos.length === 0) return;
    const optgroup = document.createElement('optgroup');
    optgroup.label = grupo.nome;
    grupo.filhos.forEach(filho => {
      const opt = document.createElement('option');
      opt.value = `${grupo.id}::${filho.id}`;
      opt.textContent = filho.nome;
      optgroup.appendChild(opt);
    });
    sel.appendChild(optgroup);
  });
}

function preencherTodosSelects() {
  preencherSelectCategorias('novaRegraCategoria');
  preencherSelectCategorias('editRegraCategoria');
}

function gerarProximoId() {
  const ids = regras.map(r => {
    const match = r.id.match(/^RN(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const max = ids.length > 0 ? Math.max(...ids) : 0;
  return 'RN' + String(max + 1).padStart(3, '0');
}

// ── Footer ──
function atualizarFooter() {
  const horaEl      = document.getElementById('footerHora');
  const totalEl     = document.getElementById('footerTotalRegras');
  const ultAltEl    = document.getElementById('footerUltAlt');
  if (horaEl)   horaEl.textContent   = getHoraAtual();
  if (totalEl)  totalEl.textContent  = regras.length;
  if (ultAltEl) ultAltEl.textContent = getAgora();
}

// ── Config dropdown toggle ──
// ── Sidebar mobile (Categorias) ──
function abrirSidebarRN() {
  document.getElementById('rnSidebar').classList.add('open');
  document.getElementById('rnSidebarOverlay').classList.add('active');
}
function fecharSidebarRN() {
  document.getElementById('rnSidebar').classList.remove('open');
  document.getElementById('rnSidebarOverlay').classList.remove('active');
}
function isMobile() { return window.innerWidth <= 768; }

// ── Fechar painel detalhe no mobile (botão Voltar) ──
function fecharDetalhesMobile() {
  document.getElementById('rnDetailPanel').classList.remove('mobile-open');
  regraSelecionadaId = null;
  renderTabela();
}

document.addEventListener('DOMContentLoaded', () => {
  const configBtn = document.getElementById('configMenuBtn');
  const configDd  = document.getElementById('configDropdown');
  if (configBtn && configDd) {
    configBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      configDd.classList.toggle('open');
    });
  }

  // Salvar pelo menu
  const configSave = document.getElementById('configSave');
  if (configSave) {
    configSave.addEventListener('click', () => {
      salvarDados();
      atualizarFooter();
      fecharConfigDropdown();
    });
  }

  // Botão hambúrguer (mobile) — abre sidebar de categorias
  const rnToggle = document.getElementById('rnSidebarToggle');
  if (rnToggle) rnToggle.addEventListener('click', abrirSidebarRN);

  const rnClose = document.getElementById('rnSidebarClose');
  if (rnClose) rnClose.addEventListener('click', fecharSidebarRN);

  const rnOverlay = document.getElementById('rnSidebarOverlay');
  if (rnOverlay) rnOverlay.addEventListener('click', fecharSidebarRN);

  // Botão Nova Categoria
  document.getElementById('btnNovaCategoria').addEventListener('click', abrirModalNovaCategoria);

  // Fechar modais com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharModalNovaRegra();
      fecharModalEditarRegra();
      fecharModalNovaCategoria();
      fecharModalNovaSubcategoria();
      fecharModalExcluirGrupo();
      fecharModalExcluirFilho();
      fecharModalExcluir();
      fecharTodosDropdowns();
      fecharConfigDropdown();
    }
  });

  // Inicializar
  carregarDados();
  renderTree('');
  renderTabela();
  renderDetalheVazio();
  preencherTodosSelects();
  atualizarFooter();
});

// ── Pagehide: salvar antes de sair ──
window.addEventListener('pagehide', () => {
  if (!_skipPagehideSave) {
    salvarDados();
  }
});

// ── Beforeunload: proteger contra reload acidental ──
window.addEventListener('beforeunload', (e) => {
  if (_skipPagehideSave || _isNavigating) return;
  if (regras.length > 0) {
    sessionStorage.setItem('_pendingClear', '1');
    e.preventDefault();
    e.returnValue = '';
  }
});

// ── Verificar flag de clear pós-reload ──
(function verificarPendingClear() {
  const nav = performance.getEntriesByType('navigation')[0];
  const isReload = nav && nav.type === 'reload';
  if (isReload && sessionStorage.getItem('_pendingClear') === '1') {
    localStorage.removeItem('cobol-flow-macro');
    localStorage.removeItem('cobol-flow-micro');
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('_pendingClear');
  }
})();
