/* =================================================================
   properties.js — Painel de propriedades: grupos colapsáveis,
                   filtro de busca e atualização do nome do programa
   ================================================================= */

/**
 * Abre ou fecha um grupo de propriedades no painel direito.
 * @param {HTMLElement} header  - Elemento .prop-group-header clicado
 * @param {string}      groupId - ID do div de conteúdo do grupo
 */
function togglePropGroup(header, groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const isOpen = group.style.display !== 'none';
  group.style.display = isOpen ? 'none' : 'block';
  header.childNodes[0].textContent = isOpen ? '▶' : '▼';
}

/**
 * Filtra as linhas de propriedade conforme o texto digitado.
 * @param {string} val - Texto de busca
 */
function filterProps(val) {
  const q = val.toLowerCase();
  document.querySelectorAll('.prop-row').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/**
 * Limpa o campo de busca e reexibe todas as linhas de propriedade.
 */
function clearPropSearch() {
  const input = document.querySelector('.prop-search input');
  if (input) input.value = '';
  document.querySelectorAll('.prop-row').forEach(row => {
    row.style.display = '';
  });
}

/**
 * Atualiza o rótulo do nó de programa na árvore do projeto
 * conforme o campo Program-ID é editado.
 * @param {string} val - Valor atual do input Program-ID
 */
function updateProgramName(val) {
  const label = document.getElementById('prog-name-label');
  if (label) label.textContent = val.toUpperCase() || 'MEUCOBOL';
}
