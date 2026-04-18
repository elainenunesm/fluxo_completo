/* =================================================================
   canvas-drag.js — Drag & drop do painel de atividades para o canvas
                    e reposicionamento de nós por arrastar o cabeçalho
   ================================================================= */

/* ── Drag do painel de atividades → canvas ──────────────────────── */

/**
 * Inicia o drag de um item do painel de atividades.
 * @param {DragEvent} event
 * @param {string}    type  - Chave de activityMeta
 */
function onDragStart(event, type) {
  draggingType = type;
  event.dataTransfer.effectAllowed = 'copy';
}

/**
 * Permite o drop no canvas (previne comportamento padrão).
 * @param {DragEvent} event
 */
function onCanvasDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
  event.dataTransfer.dropEffect = 'copy';
}

/**
 * Remove o destaque visual ao sair do canvas sem soltar.
 * @param {DragEvent} event
 */
function onCanvasDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

/**
 * Cria o nó no ponto exato do drop, compensando o scroll do canvas.
 * @param {DragEvent} event
 */
function onCanvasDrop(event) {
  event.preventDefault();
  const canvas = document.getElementById('canvas');
  canvas.classList.remove('drag-over');

  const rect   = canvas.getBoundingClientRect();
  const scroll = document.getElementById('canvas-scroll');
  const x = event.clientX - rect.left  + scroll.scrollLeft;
  const y = event.clientY - rect.top   + scroll.scrollTop;

  if (draggingType) {
    createNodeAt(draggingType, Math.round(x - 155), Math.round(y - 30));
    draggingType = null;
  }
}

/* ── Reposicionamento de nós por mouse ──────────────────────────── */

/**
 * Torna um card de nó arrastável pelo seu cabeçalho.
 * Ignora cliques em botões (node-field-more) e inputs para não
 * interferir com a edição de texto.
 * @param {HTMLElement} el - Elemento .cf-node a tornar draggable
 */
function makeDraggable(el) {
  let startX, startY, startLeft, startTop;
  const handle = el.querySelector('.node-card-header') || el;

  handle.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('node-field-more') || e.target.classList.contains('node-connect-btn') || e.target.tagName === 'INPUT') return;

    startX    = e.clientX;
    startY    = e.clientY;
    startLeft = parseInt(el.style.left) || 0;
    startTop  = parseInt(el.style.top)  || 0;

    const onMove = (ev) => {
      el.style.left = (startLeft + ev.clientX - startX) + 'px';
      el.style.top  = (startTop  + ev.clientY - startY) + 'px';
      drawArrows();
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    e.preventDefault();
  });
}
