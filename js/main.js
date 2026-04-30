// =====================================================================
// COBOL Flow Studio – main.js
// Funcionalidades: zoom, tabs, drag-drop do sidebar, mover nós,
// conexão de nós por clique, propriedades na sidebar direita,
// excluir com Delete/Backspace, atualizar setas dinamicamente.
// =====================================================================

// ---------- ZOOM ----------
let zoomLevel = 100;
const canvasEl = document.getElementById('canvas');
const zoomValueEl = document.getElementById('zoomValue');

document.getElementById('zoomIn').addEventListener('click', () => {
  if (zoomLevel < 200) { zoomLevel += 10; applyZoom(); }
});
document.getElementById('zoomOut').addEventListener('click', () => {
  if (zoomLevel > 30) { zoomLevel -= 10; applyZoom(); }
});
function applyZoom() {
  canvasEl.style.transform = `scale(${zoomLevel / 100})`;
  canvasEl.style.transformOrigin = 'top left';
  zoomValueEl.textContent = zoomLevel + '%';
}

// ---------- TABS ----------
document.querySelectorAll('.tab-item').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// ---------- SEARCH FILTER ----------
document.querySelector('.search-input').addEventListener('input', function () {
  const term = this.value.toLowerCase();
  document.querySelectorAll('.component-item').forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

// ---------- NODE / CONNECTION STATE ----------
let nodeCounter = 100;          // IDs únicos para novos nós
let connections = [];           // { id, fromId, toId, label }
let connectingFrom = null;      // ID do nó aguardando destino para conexão
let selectedNodeId = null;      // nó atualmente selecionado
let connCounter = 0;

// Botão excluir seta
document.getElementById('arrow-delete-btn').addEventListener('click', () => {
  if (arrowDeleteTarget) {
    connections = connections.filter(c => c.id !== arrowDeleteTarget);
    redrawConnections();
    hideArrowDeleteBtn();
  }
});

// Paleta de estilos por tipo de componente
const STYLE_MAP = {
  'Início':                    { border: 'green-border',  icon: 'green',   iconClass: 'player-play' },
  'Fim':                       { border: 'red-border',    icon: 'red',     iconClass: 'player-stop' },
  'Arquivo (Excel / CSV)':     { border: 'green-border',  icon: 'excel',   iconClass: 'table', iconImg: 'img/excel_png.png' },
  'Arquivo (Texto)':           { border: 'blue-border',   icon: 'word',    iconClass: 'file-text' },
  'Mensagem (MQ Series)':      { border: 'teal-border',   icon: 'teal',    iconClass: 'inbox' },
  'Entrada Manual':            { border: 'blue-border',   icon: 'indigo',  iconClass: 'forms' },
  'Programa COBOL (Batch)':    { border: 'green-border',  icon: 'emerald', iconClass: 'terminal-2' },
  'Programa COBOL (Online)':   { border: 'green-border',  icon: 'emerald', iconClass: 'device-desktop' },
  'Serviço (CICS)':            { border: 'teal-border',   icon: 'teal',    iconClass: 'server' },
  'Validação / Regras':        { border: 'teal-border',   icon: 'teal',    iconSvg: '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', svgViewBox: '0 0 24 24' },
  'Decisão':                   { border: '',              icon: 'yellow',  iconClass: 'diamond', isDiamond: true },
  'Leitura de Tabela (DB2)':   { border: 'teal-border',   icon: 'teal',    iconClass: 'database' },
  'Atualização de Tabela (DB2)':{ border: 'teal-border',  icon: 'teal',    iconClass: 'database-export' },
  'Inclusão de Tabela (DB2)':  { border: 'teal-border',   icon: 'teal',    iconClass: 'database-import' },
  'Exclusão de Tabela (DB2)':  { border: 'orange-border', icon: 'orange',  iconClass: 'database-off' },
  'Relatório (Impressão)':     { border: 'yellow-border', icon: 'yellow',  iconClass: 'printer' },
  'Arquivo de Saída':          { border: 'orange-border', icon: 'orange',  iconClass: 'file-arrow-right' },
  'Envio de E-mail':           { border: 'blue-border',   icon: 'blue',    iconClass: 'mail' },
  'Transmissão a Bancos':      { border: 'blue-border',   icon: 'purple',  iconImg: 'img/banco.png' },
  'Transmissão a Clientes':    { border: 'blue-border',   icon: 'purple',  iconClass: 'users' },
  'Transmissão a Corretores':  { border: 'blue-border',   icon: 'purple',  iconClass: 'briefcase' },
  'WebService / API':          { border: 'teal-border',   icon: 'teal',    iconClass: 'api' },
  'Expurgo / Purga':           { border: 'orange-border', icon: 'orange',  iconClass: 'trash' },
  'Backup':                    { border: 'blue-border',   icon: 'blue',    iconClass: 'database-export' },
  'Compactação de Arquivo':    { border: 'blue-border',   icon: 'indigo',  iconClass: 'file-zip' },
  'Marcador':                  { isBubble: true, color: '#2563eb' },
};
const DEFAULT_STYLE = { border: 'blue-border', icon: 'blue', iconClass: 'box' };

// ---------- CRIAR NÓ ----------
function createNodeElement(type, x, y) {
  const id = 'node-' + (++nodeCounter);
  const style = STYLE_MAP[type] || DEFAULT_STYLE;

  const wrapper = document.createElement('div');
  wrapper.className = 'flow-node';
  wrapper.id = id;
  wrapper.style.left = x + 'px';
  wrapper.style.top  = y + 'px';
  wrapper.dataset.type = type;
  wrapper.dataset.title = type;
  wrapper.dataset.description = '';

  if (style.isBubble) {
    wrapper.className += ' bubble-node';
    wrapper.innerHTML = `
      <div class="bubble-circle" data-node-id="${id}" style="background:${style.color || '#16a34a'}">
        <span class="bubble-number">+</span>
      </div>`;
    canvasEl.appendChild(wrapper);
    const numEl = wrapper.querySelector('.bubble-number');
    numEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = numEl.textContent.trim() === '+' ? '' : numEl.textContent.trim();
      const val = prompt('Número ou texto do marcador:', current);
      if (val === null) return;
      numEl.textContent = val.trim() || '+';
    });
    attachNodeEvents(wrapper);
    return id;
  }

  if (style.isBubble) {
    wrapper.className += ' bubble-node';
    wrapper.innerHTML = `
      <div class="bubble-circle" data-node-id="${id}" style="background:${style.color || '#16a34a'}">
        <span class="bubble-number">+</span>
      </div>`;
    canvasEl.appendChild(wrapper);
    const numEl = wrapper.querySelector('.bubble-number');
    numEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = numEl.textContent.trim() === '+' ? '' : numEl.textContent.trim();
      const val = prompt('Número ou texto do marcador:', current);
      if (val === null) return;
      numEl.textContent = val.trim() || '+';
    });
    attachNodeEvents(wrapper);
    return id;
  }

  if (style.isDiamond) {
    wrapper.className += ' decision-node';
    wrapper.innerHTML = `
      <div class="diamond" data-node-id="${id}">
        <div class="diamond-text">${type}</div>
      </div>`;
  } else {
    const iconHtml = style.iconImg
      ? `<img src="${style.iconImg}" alt="${type}" style="width:28px;height:28px;object-fit:contain;display:block;">`
      : style.iconSvg
        ? `<svg viewBox="${style.svgViewBox || '0 0 16 16'}" fill="none" stroke="${style.svgStroke || 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${style.iconSvg}</svg>`
        : `<i class="ti ti-${style.iconClass}"></i>`;
    const nodeIconClass = style.iconImg ? `node-icon node-icon-img` : `node-icon${style.icon ? ' ' + style.icon : ''}`;
    wrapper.innerHTML = `
      <div class="node-box ${style.border}" data-node-id="${id}">
        <div class="${nodeIconClass}">
          ${iconHtml}
        </div>
        <div class="node-info">
          <h4>${type}</h4>
          <p></p>
        </div>
      </div>
      <span class="node-badge" title="Clique para definir número">+</span>
      <button class="node-comment-btn" title="Comentário">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      </button>
      <div class="node-comment-block" style="display:none">
        <div class="node-comment-header">
          <span>Comentário</span>
          <div class="node-comment-actions">
            <button class="node-comment-edit-btn" title="Editar"><i class="ti ti-pencil"></i></button>
            <button class="node-comment-toggle" title="Recolher"><i class="ti ti-chevron-up"></i></button>
            <button class="node-comment-close" title="Fechar">✕</button>
          </div>
        </div>
        <div class="node-comment-body" contenteditable="false" spellcheck="false" data-placeholder="Escreva aqui..."></div>
      </div>`;
  }

  canvasEl.appendChild(wrapper);
  attachNodeEvents(wrapper);

  // Evento da bolinha numerada
  const badge = wrapper.querySelector('.node-badge');
  if (badge) {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = badge.textContent.trim() === '+' ? '' : badge.textContent.trim();
      const val = prompt('Número do passo (deixe vazio para remover):', current);
      if (val === null) return;
      const num = val.trim();
      badge.textContent = num || '+';
      badge.classList.toggle('has-value', !!num);
    });
  }

  // Evento do botão de comentário
  const commentBtn = wrapper.querySelector('.node-comment-btn');
  const commentBlock = wrapper.querySelector('.node-comment-block');
  if (commentBtn && commentBlock) {
    const commentBody = commentBlock.querySelector('.node-comment-body');
    const toggleBtn  = commentBlock.querySelector('.node-comment-toggle');
    const editBtn    = commentBlock.querySelector('.node-comment-edit-btn');

    commentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = commentBlock.style.display !== 'none';
      commentBlock.style.display = isOpen ? 'none' : 'flex';
    });

    commentBlock.querySelector('.node-comment-close').addEventListener('click', (e) => {
      e.stopPropagation();
      commentBlock.style.display = 'none';
    });

    // Recolher / expandir corpo
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const collapsed = commentBlock.classList.toggle('collapsed');
      toggleBtn.querySelector('i').className = collapsed ? 'ti ti-chevron-down' : 'ti ti-chevron-up';
      toggleBtn.title = collapsed ? 'Expandir' : 'Recolher';
    });

    // Alternar modo edição
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isEditing = commentBody.contentEditable === 'true';
      commentBody.contentEditable = isEditing ? 'false' : 'true';
      editBtn.classList.toggle('editing', !isEditing);
      editBtn.title = isEditing ? 'Editar' : 'Concluir edição';
      if (!isEditing) {
        commentBlock.classList.remove('collapsed');
        toggleBtn.querySelector('i').className = 'ti ti-chevron-up';
        toggleBtn.title = 'Recolher';
        commentBody.focus();
      }
    });

    commentBody.addEventListener('input', () => {
      const hasText = commentBody.textContent.trim() !== '';
      commentBtn.classList.toggle('has-value', hasText);
    });

    commentBlock.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  return id;
}

// ---------- REGISTRAR NÓS EXISTENTES ----------
function registerExistingNodes() {
  document.querySelectorAll('.flow-node, .decision-node').forEach(wrapper => {
    if (!wrapper.id) wrapper.id = 'node-' + (++nodeCounter);
    const inner = wrapper.querySelector('[data-node-id]');
    if (!inner) {
      const box = wrapper.querySelector('.node-box, .diamond');
      if (box) box.dataset.nodeId = wrapper.id;
    }
    wrapper.dataset.type  = wrapper.dataset.type  || wrapper.querySelector('h4')?.textContent || 'Nó';
    wrapper.dataset.title = wrapper.dataset.title || wrapper.querySelector('h4')?.textContent || 'Nó';
    wrapper.dataset.description = wrapper.dataset.description || wrapper.querySelector('.node-info p')?.textContent || '';
    attachNodeEvents(wrapper);
  });
}

// ---------- EVENTOS DE NÓ (move + selecionar + conectar) ----------
function attachNodeEvents(wrapper) {
  const handle = wrapper.querySelector('.node-box, .diamond, .bubble-circle');
  if (!handle) return;

  let isDragging = false;
  let startX, startY, origLeft, origTop;

  handle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    // Modo conexão: aguardando destino
    if (connectingFrom !== null) {
      const toId = wrapper.id;
      if (toId !== connectingFrom) {
        addConnection(connectingFrom, toId, '', connectingFromPort);
      }
      exitConnectMode();
      return;
    }

    isDragging = false;
    const rect = canvasEl.getBoundingClientRect();
    const scale = zoomLevel / 100;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = parseInt(wrapper.style.left) || 0;
    origTop  = parseInt(wrapper.style.top)  || 0;

    function onMove(ev) {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging = true;
      if (isDragging) {
        wrapper.style.left = (origLeft + dx) + 'px';
        wrapper.style.top  = (origTop  + dy) + 'px';
        redrawConnections();
      }
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (!isDragging) {
        selectNode(wrapper.id);
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ---------- SELEÇÃO ----------
function selectNode(id) {
  // Desselecionar anterior
  if (selectedNodeId) {
    const prev = document.getElementById(selectedNodeId);
    if (prev) {
      prev.querySelectorAll('.node-box, .diamond').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
      });
    }
  }
  selectedNodeId = id;
  const curr = document.getElementById(id);
  if (curr) {
    curr.querySelectorAll('.node-box, .diamond').forEach(el => {
      el.style.outline = '2px solid #3b82f6';
      el.style.outlineOffset = '2px';
    });
    showProperties(curr);
  }
}

// ---------- PROPRIEDADES ----------
function showProperties(wrapper) {
  const sidebarRight = document.querySelector('.sidebar-right');
  const title   = wrapper.dataset.title       || wrapper.querySelector('h4')?.textContent || 'Nó';
  const desc    = wrapper.dataset.description || wrapper.querySelector('.node-info p')?.textContent || '';
  const type    = wrapper.dataset.type || title;
  const nodeId  = wrapper.id;

  sidebarRight.innerHTML = `
    <div class="sidebar-right-title-bar">Propriedades do Componente</div>
    <div style="padding: 56px 16px 16px; width: 100%;">
      <div style="margin-bottom: 12px;">
        <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Tipo</label>
        <div style="font-size:13px;color:#6b7280;padding:6px 10px;background:#f3f4f6;border-radius:6px;">${type}</div>
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Título</label>
        <input id="prop-title" type="text" value="${escHtml(title)}"
          style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;outline:none;">
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Descrição</label>
        <textarea id="prop-desc" rows="3"
          style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;resize:vertical;outline:none;">${escHtml(desc)}</textarea>
      </div>
      <button id="prop-save"
        style="width:100%;padding:8px;background:#3b82f6;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;">
        Salvar
      </button>
      <button id="prop-connect"
        style="width:100%;padding:8px;background:#8b5cf6;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;">
        Conectar a outro nó
      </button>
      <button id="prop-delete"
        style="width:100%;padding:8px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">
        Excluir nó
      </button>
    </div>`;

  document.getElementById('prop-save').addEventListener('click', () => {
    const newTitle = document.getElementById('prop-title').value.trim();
    const newDesc  = document.getElementById('prop-desc').value.trim();
    const node = document.getElementById(nodeId);
    if (!node) return;
    node.dataset.title       = newTitle;
    node.dataset.description = newDesc;
    const h4 = node.querySelector('h4');
    const p  = node.querySelector('.node-info p');
    const dt = node.querySelector('.diamond-text');
    if (h4) h4.textContent = newTitle;
    if (p)  p.innerHTML   = newDesc.replace(/\n/g, '<br>');
    if (dt) dt.textContent = newTitle;
    showToast('Propriedades salvas!');
  });

  document.getElementById('prop-connect').addEventListener('click', () => {
    enterConnectMode(nodeId);
  });

  document.getElementById('prop-delete').addEventListener('click', () => {
    deleteNode(nodeId);
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---------- PORTAS ----------
let connectingFromPort = null;

// ---------- CONEXÕES ----------
function addConnection(fromId, toId, label, fromSide) {
  const id = 'conn-' + (++connCounter);
  connections.push({ id, fromId, toId, label: label || '', fromSide: fromSide || null });
  redrawConnections();
  showToast('Conexão criada!');
}

function redrawConnections() {
  const svg = document.getElementById('arrowsLayer');
  svg.querySelectorAll('[data-dynamic]').forEach(el => el.remove());

  connections.forEach(conn => {
    const fromEl = document.getElementById(conn.fromId);
    const toEl   = document.getElementById(conn.toId);
    if (!fromEl || !toEl) return;

    const fRect = getNodeRect(fromEl);
    const tRect = getNodeRect(toEl);

    // Ponto de saída: porta específica ou borda automática
    const p1 = conn.fromSide ? getPortPoint(fRect, conn.fromSide) : getEdgePoint(fRect, tRect);
    const p2 = getEdgePoint(tRect, p1);

    // Recuo mínimo para ponta ficar visível
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ex = p2.x + (dx / dist) * 1;
    const ey = p2.y + (dy / dist) * 1;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x);
    line.setAttribute('y1', p1.y);
    line.setAttribute('x2', ex);
    line.setAttribute('y2', ey);
    line.setAttribute('marker-end', 'url(#arrowhead)');
    line.setAttribute('data-dynamic', conn.id);
    svg.appendChild(line);

    // Linha transparente mais larga para facilitar o clique
    const hitLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hitLine.setAttribute('x1', p1.x);
    hitLine.setAttribute('y1', p1.y);
    hitLine.setAttribute('x2', ex);
    hitLine.setAttribute('y2', ey);
    hitLine.setAttribute('data-dynamic', conn.id);
    hitLine.classList.add('arrow-hit');
    hitLine.addEventListener('click', (e) => {
      e.stopPropagation();
      showArrowDeleteBtn(e.clientX, e.clientY, conn.id);
    });
    svg.appendChild(hitLine);

    if (conn.label) {
      const mx = (p1.x + ex) / 2;
      const my = (p1.y + ey) / 2 - 6;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', mx);
      text.setAttribute('y', my);
      text.setAttribute('data-dynamic', conn.id + '-lbl');
      text.textContent = conn.label;
      svg.appendChild(text);
    }
  });
}

function getPortPoint(rect, side) {
  switch (side) {
    case 'top':    return { x: rect.x,              y: rect.y - rect.h / 2 };
    case 'bottom': return { x: rect.x,              y: rect.y + rect.h / 2 };
    case 'left':   return { x: rect.x - rect.w / 2, y: rect.y };
    case 'right':  return { x: rect.x + rect.w / 2, y: rect.y };
    default:       return { x: rect.x, y: rect.y };
  }
}

function getNodeRect(el) {
  const left = parseInt(el.style.left) || 0;
  const top  = parseInt(el.style.top)  || 0;
  const w = el.offsetWidth  || 160;
  const h = el.offsetHeight || 60;
  return { x: left + w / 2, y: top + h / 2, w, h };
}

function getNodeCenter(el) {
  const r = getNodeRect(el);
  return { x: r.x, y: r.y };
}

function getEdgePoint(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return { x: from.x, y: from.y };
  const hw = from.w / 2;
  const hh = from.h / 2;
  const angle = Math.atan2(dy, dx);
  const absCos = Math.abs(Math.cos(angle));
  const absSin = Math.abs(Math.sin(angle));
  let ex, ey;
  if (hw * absSin <= hh * absCos) {
    // intercepta lado esquerdo ou direito
    const sign = dx >= 0 ? 1 : -1;
    ex = from.x + sign * hw;
    ey = from.y + sign * hw * Math.tan(angle);
  } else {
    // intercepta topo ou base
    const sign = dy >= 0 ? 1 : -1;
    ey = from.y + sign * hh;
    ex = from.x + sign * hh / Math.tan(angle);
  }
  return { x: ex, y: ey };
}

// ---------- MODO CONEXÃO ----------
function enterConnectMode(fromId) {
  connectingFrom = fromId;
  canvasEl.style.cursor = 'crosshair';
  showToast('Clique no nó de destino para conectar. [Esc] para cancelar.');
}

function exitConnectMode() {
  connectingFrom = null;
  connectingFromPort = null;
  document.querySelectorAll('.flow-node.port-visible').forEach(n => n.classList.remove('port-visible'));
  canvasEl.style.cursor = '';
}

// ---------- BOTÃO EXCLUIR SETA ----------
let arrowDeleteTarget = null;

function showArrowDeleteBtn(clientX, clientY, connId) {
  const btn = document.getElementById('arrow-delete-btn');
  const canvasRect = canvasEl.getBoundingClientRect();
  btn.style.left = (clientX - canvasRect.left + 8) + 'px';
  btn.style.top  = (clientY - canvasRect.top  - 16) + 'px';
  btn.style.display = 'block';
  arrowDeleteTarget = connId;
}

function hideArrowDeleteBtn() {
  const btn = document.getElementById('arrow-delete-btn');
  if (btn) btn.style.display = 'none';
  arrowDeleteTarget = null;
}

// ---------- EXCLUIR NÓ ----------
function deleteNode(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
  connections = connections.filter(c => c.fromId !== id && c.toId !== id);
  redrawConnections();
  selectedNodeId = null;
  resetSidebarRight();
  showToast('Nó excluído.');
}

function resetSidebarRight() {
  document.querySelector('.sidebar-right').innerHTML = `
    <div class="sidebar-right-title-bar">Propriedades do Componente</div>
    <div class="empty-state" style="margin-top:60px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
        <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
        <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
        <line x1="17" y1="16" x2="23" y2="16"/>
      </svg>
      <p>Selecione um componente<br>no fluxo para editar<br>suas propriedades.</p>
    </div>`;
}

// ---------- TECLA DELETE ----------
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    deleteNode(selectedNodeId);
  }
  if (e.key === 'Escape') {
    exitConnectMode();
    canvasEl.style.cursor = '';
  }
});

// ---------- DRAG DO SIDEBAR ----------
let dragType = null;

document.querySelectorAll('.component-item').forEach(item => {
  item.addEventListener('dragstart', function (e) {
    // Usa data-type se disponível; senão extrai só o texto direto (ignora conteúdo de SVGs)
    if (this.dataset.type) {
      dragType = this.dataset.type;
    } else {
      dragType = Array.from(this.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .filter(Boolean)
        .join('') || this.textContent.trim();
    }
    e.dataTransfer.setData('text/plain', dragType);
    this.style.opacity = '0.5';
  });
  item.addEventListener('dragend', function () {
    this.style.opacity = '1';
  });
});

canvasEl.addEventListener('dragover', (e) => { e.preventDefault(); });

canvasEl.addEventListener('drop', (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData('text/plain') || dragType;
  if (!type) return;

  const rect  = canvasEl.getBoundingClientRect();
  const scale = zoomLevel / 100;
  const x = (e.clientX - rect.left) / scale - 80;
  const y = (e.clientY - rect.top)  / scale - 30;

  const id = createNodeElement(type, Math.max(0, x), Math.max(0, y));
  selectNode(id);
  updateFooterCount();
});

// ---------- CLIQUE NO CANVAS (desselecionar) ----------
canvasEl.addEventListener('click', (e) => {
  // Fechar botão de excluir seta ao clicar fora
  if (!e.target.closest('#arrow-delete-btn') && !e.target.classList.contains('arrow-hit')) {
    hideArrowDeleteBtn();
  }
  if (e.target === canvasEl || e.target.classList.contains('canvas-scroll')) {
    if (connectingFrom !== null) { exitConnectMode(); return; }
    if (selectedNodeId) {
      const prev = document.getElementById(selectedNodeId);
      if (prev) prev.querySelectorAll('.node-box,.diamond').forEach(el => { el.style.outline = ''; });
      selectedNodeId = null;
      resetSidebarRight();
    }
  }
});

// ---------- BOTÃO AJUSTAR À TELA ----------
document.querySelector('.zoom-btn[title="Ajustar à tela"]')?.addEventListener('click', () => {
  zoomLevel = 100;
  applyZoom();
  document.querySelector('.canvas-scroll')?.scrollTo(0, 0);
});

// ---------- BOTÃO SALVAR ----------
document.querySelector('.header-btn')?.addEventListener('click', () => {
  showToast('Projeto salvo!');
  const now = new Date();
  const hhmm = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const footerSave = document.querySelector('.footer-left');
  if (footerSave) footerSave.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Projeto salvo às ${hhmm}`;
});

// ---------- ATUALIZAR CONTADOR DO FOOTER + hint ----------
function updateFooterCount() {
  const total = document.querySelectorAll('.flow-node, .decision-node').length;
  const spans = document.querySelectorAll('.footer-right span');
  if (spans[0]) spans[0].textContent = `Total de etapas: ${total}`;
  const hint = document.getElementById('canvas-empty-hint');
  if (hint) hint.style.display = total === 0 ? 'flex' : 'none';
}

// ---------- TOAST ----------
function showToast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;bottom:48px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:500;z-index:9999;pointer-events:none;transition:opacity .3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ---------- INIT ----------
registerExistingNodes();
updateFooterCount();

// ---------- EXPORTAR RELATÓRIO ----------
document.getElementById('exportBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = document.getElementById('exportMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
});
document.addEventListener('click', () => {
  const menu = document.getElementById('exportMenu');
  if (menu) menu.style.display = 'none';
});

function buildReportHtml(imgDataUrl) {
  const date = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  const nodes = Array.from(document.querySelectorAll('.flow-node, .decision-node'));

  let tableRows = '';
  nodes.forEach((node, i) => {
    const badge  = node.querySelector('.node-badge');
    const num    = badge && badge.classList.contains('has-value') ? badge.textContent.trim() : (i + 1);
    const title  = node.dataset.title || node.querySelector('h4')?.textContent || node.dataset.type || '';
    const desc   = node.dataset.description || node.querySelector('.node-info p')?.textContent || '';
    const body   = node.querySelector('.node-comment-body');
    const comment = body ? body.innerText.trim() : '';
    tableRows += `<tr>
      <td style="text-align:center;font-weight:700;color:#2563eb;">${num}</td>
      <td><strong>${escHtml(title)}</strong></td>
      <td>${escHtml(desc)}</td>
      <td style="color:#1e40af;">${escHtml(comment)}</td>
    </tr>`;
  });

  let connRows = '';
  connections.forEach((c, i) => {
    const fromEl = document.getElementById(c.fromId);
    const toEl   = document.getElementById(c.toId);
    const from = fromEl ? (fromEl.dataset.title || fromEl.dataset.type || c.fromId) : c.fromId;
    const to   = toEl   ? (toEl.dataset.title   || toEl.dataset.type   || c.toId)   : c.toId;
    connRows += `<tr>
      <td style="text-align:center;">${i+1}</td>
      <td>${escHtml(from)}</td>
      <td style="text-align:center;">→</td>
      <td>${escHtml(to)}</td>
      <td>${escHtml(c.label || '')}</td>
    </tr>`;
  });

  const imgTag = imgDataUrl ? `<img src="${imgDataUrl}" style="max-width:100%;border:1px solid #e5e7eb;border-radius:8px;margin:16px 0;">` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Fluxo</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 0; padding: 32px; color: #1e293b; font-size: 13px; }
  h1 { font-size: 22px; color: #1e3a8a; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  h2 { font-size: 15px; color: #1e3a8a; border-bottom: 2px solid #bfdbfe; padding-bottom: 4px; margin-top: 32px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #eff6ff; color: #1e40af; font-size: 11px; padding: 7px 10px; text-align: left; border: 1px solid #bfdbfe; }
  td { padding: 6px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .page-break { page-break-before: always; }
  @page { size: A4; margin: 20mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>Relatório de Fluxo — COBOL Flow Studio</h1>
  <p class="subtitle">Projeto: SistemaExemploCOBOL &nbsp;|&nbsp; Gerado em: ${date}</p>

  <h2>Diagrama do Fluxo</h2>
  ${imgTag}

  <h2>Componentes</h2>
  <table>
    <thead><tr><th>#</th><th>Componente</th><th>Descrição</th><th>Comentário</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>

  ${connRows ? `<h2>Conexões</h2>
  <table>
    <thead><tr><th>#</th><th>De</th><th></th><th>Para</th><th>Rótulo</th></tr></thead>
    <tbody>${connRows}</tbody>
  </table>` : ''}
</body>
</html>`;
}

async function captureCanvas() {
  // Salvar zoom e resetar para 100% antes de capturar
  const prevZoom = zoomLevel;
  zoomLevel = 100; applyZoom();
  const canvasEl2 = document.getElementById('canvas');
  await new Promise(r => setTimeout(r, 120));
  const cvs = await html2canvas(canvasEl2, {
    backgroundColor: '#f8fafc',
    scale: 1.5,
    useCORS: true,
    logging: false,
    ignoreElements: el => {
      const id  = el.id || '';
      const cls = el.getAttribute?.('class') || '';
      if (id === 'arrow-delete-btn' || id === 'canvas-empty-hint') return true;
      // Esconde sempre o bloco de edição
      if (cls.includes('node-comment-block')) return true;
      // Esconde badge e ícone de comentário APENAS se não tiverem valor
      if (cls.includes('node-badge') && !cls.includes('has-value')) return true;
      if (cls.includes('node-comment-btn') && !cls.includes('has-value')) return true;
      // Esconde botões internos do bloco de comentário
      if (cls.includes('node-comment-edit-btn') || cls.includes('node-comment-toggle') || cls.includes('node-comment-close')) return true;
      return false;
    }
  });
  zoomLevel = prevZoom; applyZoom();
  return cvs.toDataURL('image/png');
}

async function exportReport(format) {
  document.getElementById('exportMenu').style.display = 'none';
  showToast('Gerando relatório...');
  const imgDataUrl = await captureCanvas();

  if (format === 'pdf') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Capa
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(16); doc.setFont('helvetica','bold');
    doc.text('Relatório de Fluxo — COBOL Flow Studio', margin, 18);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, 25);

    // Imagem do canvas
    doc.setTextColor(30,58,138);
    doc.setFontSize(12); doc.setFont('helvetica','bold');
    doc.text('Diagrama do Fluxo', margin, 38);
    const imgProps = doc.getImageProperties(imgDataUrl);
    const imgW = pageW - margin * 2;
    const imgH = (imgProps.height * imgW) / imgProps.width;
    let imgY = 42;
    if (imgY + imgH > pageH - margin) {
      doc.addPage();
      imgY = margin;
    }
    doc.addImage(imgDataUrl, 'PNG', margin, imgY, imgW, Math.min(imgH, pageH - imgY - margin));

    // Tabela de nós
    doc.addPage();
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 12, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text('Componentes do Fluxo', margin, 8.5);

    const nodes = Array.from(document.querySelectorAll('.flow-node, .decision-node'));
    let y = 22;
    const colW = [(pageW - margin*2) * 0.06, (pageW - margin*2) * 0.28, (pageW - margin*2) * 0.34, (pageW - margin*2) * 0.32];
    const headers = ['#', 'Componente', 'Descrição', 'Comentário'];
    // Header
    doc.setFillColor(239,246,255);
    doc.rect(margin, y - 5, pageW - margin*2, 7, 'F');
    doc.setTextColor(30,64,175); doc.setFontSize(9); doc.setFont('helvetica','bold');
    let cx = margin;
    headers.forEach((h, i) => { doc.text(h, cx + 2, y); cx += colW[i]; });
    y += 4;
    doc.setDrawColor(191,219,254);
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    doc.setFont('helvetica','normal'); doc.setTextColor(30,41,59);
    nodes.forEach((node, idx) => {
      const badge  = node.querySelector('.node-badge');
      const num    = badge && badge.classList.contains('has-value') ? badge.textContent.trim() : String(idx+1);
      const title  = node.dataset.title || node.querySelector('h4')?.textContent || '';
      const desc   = node.dataset.description || node.querySelector('.node-info p')?.textContent || '';
      const body   = node.querySelector('.node-comment-body');
      const comment = body ? body.innerText.trim() : '';
      const rowH = 8;
      if (y + rowH > pageH - margin) { doc.addPage(); y = margin + 10; }
      if (idx % 2 === 0) { doc.setFillColor(248,250,252); doc.rect(margin, y - 5, pageW - margin*2, rowH, 'F'); }
      cx = margin;
      doc.setFontSize(8.5);
      doc.text(num, cx + 2, y); cx += colW[0];
      doc.text(doc.splitTextToSize(title, colW[1] - 4), cx + 2, y); cx += colW[1];
      doc.text(doc.splitTextToSize(desc, colW[2] - 4), cx + 2, y); cx += colW[2];
      doc.setTextColor(30,64,175);
      doc.text(doc.splitTextToSize(comment, colW[3] - 4), cx + 2, y);
      doc.setTextColor(30,41,59);
      y += rowH;
    });

    doc.save('relatorio-fluxo.pdf');
    showToast('PDF gerado!');

  } else if (format === 'word' || format === 'html') {
    const html = buildReportHtml(imgDataUrl);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = format === 'word' ? 'relatorio-fluxo.doc' : 'relatorio-fluxo.html';
    a.click();
    showToast(format === 'word' ? 'Word gerado!' : 'HTML gerado!');
  }
}
