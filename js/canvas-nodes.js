/* =================================================================
   canvas-nodes.js — Criação, seleção, remoção e renomeação de nós
                     no canvas do fluxograma
   ================================================================= */

/**
 * Seleciona um nó no canvas e atualiza o painel de propriedades.
 * @param {string} nodeId - Sufixo do id do nó (sem 'node-')
 * @param {string} label  - Rótulo legível do nó
 */
function selectNode(nodeId, label) {
  const fullId = 'node-' + nodeId;

  /* Se estiver em modo de conexão, este clique finaliza a conexão */
  if (connectingFrom) {
    finishConnect(fullId);
    return;
  }

  document.querySelectorAll('.node-card').forEach(c => c.classList.remove('selected'));

  const el = document.getElementById(fullId);
  if (el) el.classList.add('selected');
  selectedNode = nodeId;

  document.getElementById('prop-sel-name').value = label;

  const typeMap = {
    start: 'Nó Inicial',
    end:   'Nó Final (STOP RUN)',
    main:  'Parágrafo COBOL',
    read:  'Parágrafo COBOL',
    proc:  'Parágrafo COBOL',
    write: 'Parágrafo COBOL',
  };
  document.getElementById('prop-sel-type').value  = typeMap[nodeId] || 'Instrução COBOL';

  const linesMap = { start: '—', end: '~95', main: '30–38', read: '40–48', proc: '50–68', write: '70–78' };
  document.getElementById('prop-sel-lines').value = linesMap[nodeId] || '—';

  setStatus('Selecionado: ' + label);
  drawArrows();
}

/**
 * Remove um nó estático do canvas pelo sufixo de seu ID.
 * @param {string} nid - Sufixo do id (sem 'node-')
 */
function deleteNode(nid) {
  const el = document.getElementById('node-' + nid);
  if (el) {
    el.remove();
    updateNodeCount();
    drawArrows();
    showToast('Nó removido.');
  }
}

/**
 * Permite renomear o cabeçalho de um nó via prompt nativo.
 * @param {string} nid - Sufixo do id (sem 'node-')
 */
function editNodeLabel(nid) {
  const el = document.getElementById('node-' + nid);
  if (!el) return;

  const hdr = el.querySelector('.node-card-header');
  if (!hdr) return;

  const oldText = hdr.textContent.trim().replace('✕', '').trim();
  const novo = prompt('Renomear parágrafo:', oldText);
  if (novo && novo !== oldText) {
    hdr.childNodes[1].textContent = ' ' + novo;
    showToast('Parágrafo renomeado.', 'success');
  }
}

/**
 * Atualiza o contador de nós exibido na toolbar do canvas.
 */
function updateNodeCount() {
  nodeCounter = document.querySelectorAll('#canvas .cf-node').length;
  document.getElementById('node-count').textContent = nodeCounter + ' nós';
}

/**
 * Cria um novo nó de atividade COBOL na posição (x, y) do canvas.
 * O nó é iniciado como draggable imediatamente após a criação.
 * @param {string} type - Chave de activityMeta (ex.: 'READ', 'IF')
 * @param {number} x    - Posição left no canvas
 * @param {number} y    - Posição top no canvas
 */
function createNodeAt(type, x, y) {
  if (!activityMeta[type]) return;

  const meta = activityMeta[type];
  nodeSeqCounter[type] = (nodeSeqCounter[type] || 0) + 1;
  const uid    = type.toLowerCase().replace('_', '-') + '-' + nodeSeqCounter[type];
  const nodeId = 'node-dyn-' + uid;
  const canvas = document.getElementById('canvas');

  const div = document.createElement('div');
  div.className = 'cf-node node-card';
  div.id        = nodeId;
  div.style.left = Math.max(10, x) + 'px';
  div.style.top  = Math.max(10, y) + 'px';
  div.setAttribute('onclick', `selectNode('dyn-${uid}','${meta.label} #${nodeSeqCounter[type]}')`);

  const headerClass = meta.color
    ? `class="node-card-header ${meta.color}"`
    : `class="node-card-header"`;

  const fieldsHtml = meta.fields.map((f, i) => `
    <div class="node-field">
      <input id="field-${uid}-${i}" placeholder="${f}" />
      <span class="node-field-more">···</span>
      <span class="node-field-help">?</span>
    </div>`).join('');

  div.innerHTML = `
    <div ${headerClass}>
      <span>${meta.icon}</span> ${meta.label}
      <span class="node-connect-btn"
            onclick="event.stopPropagation();startConnect(event,'${nodeId}')"
            title="Conectar saída deste nó">→</span>
      <span class="node-field-more"
            onclick="event.stopPropagation();this.closest('.node-card').remove();updateNodeCount();drawArrows();"
            title="Remover">✕</span>
    </div>
    <div class="node-card-body">${fieldsHtml}</div>`;

  makeDraggable(div);
  canvas.appendChild(div);
  nodeCounter++;
  updateNodeCount();
  selectNode('dyn-' + uid, `${meta.label} #${nodeSeqCounter[type]}`);
  showToast(`${meta.label} adicionado ao fluxo.`, 'success');
  drawArrows();
}

/* =================================================================
   Sistema de conexão de setas entre nós
   ================================================================= */

/**
 * Inicia o modo de conexão a partir de um nó.
 * Se já estiver em modo de conexão, finaliza (conecta) ou cancela.
 * @param {Event}  event  - Evento original (stopPropagation)
 * @param {string} nodeId - ID completo no DOM (com 'node-' prefix)
 */
function startConnect(event, nodeId) {
  event.stopPropagation();

  /* Clicou no mesmo nó de origem → cancela */
  if (connectingFrom === nodeId) {
    cancelConnect();
    return;
  }

  /* Já havia um nó de origem → finaliza a conexão */
  if (connectingFrom) {
    finishConnect(nodeId);
    return;
  }

  /* Começa modo de conexão */
  connectingFrom = nodeId;
  document.getElementById('canvas').classList.add('connecting-mode');

  /* Destaca o nó de origem */
  document.querySelectorAll('.cf-node').forEach(n => n.classList.remove('conn-source'));
  const srcEl = document.getElementById(nodeId);
  if (srcEl) srcEl.classList.add('conn-source');

  setStatus('Clique no nó de destino para conectar — ESC para cancelar');
}

/**
 * Finaliza a conexão ligando connectingFrom → toId.
 * Evita conexões duplicadas e auto-conexões.
 * @param {string} toId - ID completo do nó destino
 */
function finishConnect(toId) {
  if (!connectingFrom || connectingFrom === toId) {
    cancelConnect();
    return;
  }

  const from = connectingFrom;
  cancelConnect();

  if (!connections.some(c => c.from === from && c.to === toId)) {
    connections.push({ from, to: toId });
    drawArrows();
    showToast('Seta criada! Clique direito na seta para remover.', 'success');
    setStatus('✓ Conexão adicionada');
  } else {
    showToast('Essa conexão já existe.', 'error');
  }
}

/**
 * Cancela o modo de conexão sem criar nenhuma seta.
 */
function cancelConnect() {
  connectingFrom = null;
  document.getElementById('canvas').classList.remove('connecting-mode');
  document.querySelectorAll('.cf-node').forEach(n => n.classList.remove('conn-source'));
  setStatus('✓ Pronto');
}
