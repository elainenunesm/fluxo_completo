/* =================================================================
   arrows.js — Desenho das setas de conexão entre nós no canvas SVG
   ================================================================= */

/**
 * Retorna o centro-inferior de um nó para servir de origem da seta,
 * e o centro-superior para servir de destino.
 * @param {string} nodeId - ID do elemento DOM do nó
 * @returns {{ x, y, bx, by } | null}
 */
function getNodeCenter(nodeId) {
  const el = document.getElementById(nodeId);
  if (!el) return null;
  const x = parseInt(el.style.left) || 0;
  const y = parseInt(el.style.top)  || 0;
  const w = el.offsetWidth  || 72;
  const h = el.offsetHeight || 72;
  return {
    x:  x + w / 2,
    y,
    bx: x + w / 2,  // centro horizontal (base)
    by: y + h,       // base inferior
  };
}

/**
 * Redesenha todas as setas no SVG overlay.
 * Chamado sempre que um nó é movido, criado ou removido.
 *
 * As conexões vêm do array global `connections` em state.js.
 * Clique com botão direito em uma seta para removê-la.
 */
function drawArrows() {
  const svg = document.getElementById('arrows-svg');
  svg.querySelectorAll('.arrow-path, .arrow-label').forEach(e => e.remove());

  connections.forEach(({ from, to }, idx) => {
    const f = getNodeCenter(from);
    const t = document.getElementById(to);
    if (!f || !t) return;

    const tx = parseInt(t.style.left) + (t.offsetWidth  || 72) / 2;
    const ty = parseInt(t.style.top);
    const my = (f.by + ty) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${f.bx} ${f.by} C ${f.bx} ${my + 30}, ${tx} ${my - 30}, ${tx} ${ty}`);
    path.setAttribute('class', 'arrow-path');
    path.style.pointerEvents = 'stroke';
    path.setAttribute('data-conn', idx);

    /* Botão direito na seta → remove a conexão */
    path.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      connections.splice(idx, 1);
      drawArrows();
      showToast('Conexão removida. (dica: clique direito na seta para remover)');
    });

    svg.appendChild(path);
  });
}
