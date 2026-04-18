/* =================================================================
   ui.js — Feedback visual: Toast de notificação e barra de status
   ================================================================= */

/**
 * Exibe uma mensagem temporária (toast) no canto inferior direito.
 * @param {string} msg   - Texto da mensagem
 * @param {string} [type] - 'success' | 'error' | '' (padrão cinza)
 */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 2800);
}

/**
 * Atualiza a mensagem da barra de status inferior.
 * @param {string} msg
 */
function setStatus(msg) {
  const el = document.getElementById('status-msg');
  if (el) el.textContent = msg;
}

/**
 * Abre/fecha o painel de Argumentos (Working-Storage) na barra inferior.
 */
function toggleArgsPanel() {
  argsOpen = !argsOpen;
  document.getElementById('args-panel').classList.toggle('open', argsOpen);
}

/**
 * Abre o painel de Console (stub — extensível).
 */
function toggleConsolePanel() {
  showToast('Console: saída do compilador/executor apareceria aqui.');
}
