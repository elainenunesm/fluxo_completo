/* =================================================================
   tabs.js — Chaveamento de abas: painel esquerdo, painel direito
             e tabs de canvas (view tabs)
   ================================================================= */

/**
 * Ativa uma aba do painel esquerdo e exibe seu conteúdo.
 * @param {HTMLElement} tab       - Elemento .ltab clicado
 * @param {string}      contentId - ID do div de conteúdo a exibir
 */
function switchLTab(tab, contentId) {
  document.querySelectorAll('.ltab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  ['project-tab-content', 'activities-panel', 'custom-tab-content'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const target = document.getElementById(contentId);
  if (target) target.style.display = 'block';
}

/**
 * Ativa uma aba do painel direito (Propriedades / Ver Código).
 * Ao abrir "Ver Código", regenera o código automaticamente.
 * @param {HTMLElement} tab       - Elemento .rtab clicado
 * @param {string}      contentId - 'props-view' | 'code-view'
 */
function switchRTab(tab, contentId) {
  document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  document.querySelectorAll('#right-panel-content > div').forEach(d => {
    d.classList.remove('visible');
    d.style.display = 'none';
  });

  const target = document.getElementById(contentId);
  if (target) {
    target.classList.add('visible');
    target.style.display = 'block';
  }

  if (contentId === 'code-view') generateAllCode();
}

/**
 * Ativa uma aba de canvas (Bot / Dados / Relatórios).
 * @param {HTMLElement} tab  - Elemento .vtab clicado
 * @param {string}      name - Identificador do canvas
 */
function switchCanvas(tab, name) {
  document.querySelectorAll('.vtab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
}
