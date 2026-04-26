/* =================================================================
   tree.js — Árvore do projeto: expand/collapse e seleção de item
   ================================================================= */

/**
 * Abre ou fecha um nó da árvore e seu grupo de filhos.
 * @param {HTMLElement} el      - Elemento .tree-item com o toggle
 * @param {string}      childId - ID do div .tree-children a alternar
 */
function toggleTree(el, childId) {
  el.classList.toggle('open');
  const children = document.getElementById(childId);
  if (children) children.classList.toggle('open');
}

/**
 * Marca um item da árvore como selecionado.
 * @param {HTMLElement} el        - Elemento .tree-item clicado
 * @param {string}      [propGroup] - ID de grupo de propriedades a destacar (futuro uso)
 */
function selectTreeItem(el, propGroup) {
  document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
}

/**
 * Expande todos os nós da árvore e atualiza o botão do canvas.
 */
function expandAll() {
  document.querySelectorAll('.tree-children').forEach(c => c.classList.add('open'));
  document.querySelectorAll('.tree-item').forEach(i => i.classList.add('open'));
  showToast('Todos os nós expandidos.');
}

/**
 * Recolhe todos os nós da árvore.
 */
function collapseAll() {
  document.querySelectorAll('.tree-children').forEach(c => c.classList.remove('open'));
  document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('open'));
  showToast('Todos os nós recolhidos.');
}

/* ── Mapeamento de ícones por tipo de nó ─────────────────────────── */
const _TREE_ICONS = {
  SECTION:          '📂',
  PERFORM:          '🔁',
  PERFORM_UNTIL:    '🔂',
  PERFORM_VARYING:  '🔃',
  PERFORM_INI_PRO_TER: '▶️',
  GO_TO:            '↪️',
  GO_BACK:          '↩️',
  STOP_RUN:         '⏹️',
  IF:               '❓',
  EVALUATE:         '🔀',
  READ:             '📖',
  WRITE:            '💾',
  DISPLAY:          '🖥️',
  ACCEPT:           '⌨️',
  MOVE:             '➡️',
  ADD:              '➕',
  SUBTRACT:         '➖',
  MULTIPLY:         '✖️',
  DIVIDE:           '➗',
  COMPUTE:          '🧮',
  INITIALIZE:       '🔄',
  STRING_OP:        '🔤',
  UNSTRING:         '✂️',
  DB2_SELECT:       '🔍',
  DB2_INSERT:       '📥',
  DB2_UPDATE:       '✏️',
  DB2_DELETE:       '🗑️',
  DB2_OPEN:         '📂',
  DB2_FETCH:        '📋',
  DB2_CLOSE:        '📁',
  DB2_COMMIT:       '✅',
  DB2_ROLLBACK:     '↩️',
  DB2_FETCH_FIRST:  '🥇',
};

let _treeRefreshTimer = null;

/**
 * Reconstrói a PROCEDURE DIVISION na árvore do projeto
 * seguindo a ordem das setas (connections) no canvas.
 */
function refreshProjectTree() {
  // Atualiza nome do programa
  const pid = document.getElementById('prop-program-id')?.value?.trim().toUpperCase() || 'MEUCOBOL';
  const progLabel = document.getElementById('prog-name-label');
  if (progLabel) progLabel.textContent = pid;

  const container = document.getElementById('tree-proc');
  if (!container) return;

  // Ordena nós pela cadeia de setas, igual ao generateAllCode
  const nextMap = {};
  (typeof connections !== 'undefined' ? connections : []).forEach(c => { nextMap[c.from] = c.to; });

  const allCards = Array.from(document.querySelectorAll('#canvas .node-card'));
  const ordered  = [];
  const visited  = new Set();

  let curId = nextMap['node-start'];
  while (curId && !visited.has(curId)) {
    visited.add(curId);
    const el = document.getElementById(curId);
    if (el && el.classList.contains('node-card')) ordered.push(el);
    curId = nextMap[curId];
  }
  allCards.forEach(n => { if (!visited.has(n.id)) ordered.push(n); });

  // Reconstrói os itens da árvore
  container.innerHTML = '';

  if (ordered.length === 0) {
    container.innerHTML = '<div class="tree-item" style="padding-left:32px;color:#aaa;font-style:italic;font-size:11px"><span class="tree-label">— vazio —</span></div>';
    return;
  }

  ordered.forEach(n => {
    const hdr   = n.querySelector('.node-card-header');
    const title = hdr?.querySelector('.node-label')?.textContent?.trim()
                  || hdr?.textContent?.replace(/[→✕↗]/g, '').trim()
                  || n.id;

    const type  = n.dataset.nodeType || '';
    const icon  = _TREE_ICONS[type] || '⚙️';

    const item  = document.createElement('div');
    item.className = 'tree-item';
    item.style.paddingLeft = '32px';
    item.innerHTML = `<span class="tree-icon">${icon}</span><span class="tree-label">${title}</span>`;
    item.addEventListener('click', () => {
      selectTreeItem(item);
      n.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelectorAll('.node-card').forEach(c => c.classList.remove('selected'));
      n.classList.add('selected');
    });
    container.appendChild(item);
  });
}

/**
 * Agenda um refreshProjectTree com debounce (evita chamadas excessivas).
 */
function scheduleTreeRefresh() {
  if (_treeRefreshTimer) clearTimeout(_treeRefreshTimer);
  _treeRefreshTimer = setTimeout(refreshProjectTree, 150);
}
