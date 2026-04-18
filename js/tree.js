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
