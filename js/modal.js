/* =================================================================
   modal.js — Modal de conteúdo (exportar código, docs, config…)
              e seletor de instrução COBOL (field picker)
   ================================================================= */

/**
 * Abre o modal com um título e conteúdo de texto.
 * @param {string} title   - Título exibido no modal
 * @param {string} content - Texto exibido no textarea
 */
function showModal(title, content) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-content').value     = content;
  document.getElementById('modal-overlay').classList.add('open');
}

/**
 * Fecha o modal.
 */
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

/**
 * Fecha o modal ao clicar fora da caixa (no overlay).
 * @param {MouseEvent} e
 */
function closeModalIfOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

/**
 * Copia o conteúdo do modal para a área de transferência.
 */
function copyModalContent() {
  const ta = document.getElementById('modal-content');
  navigator.clipboard.writeText(ta.value)
    .then(() => showToast('Copiado para a área de transferência!', 'success'));
}

/**
 * Abre o seletor de instrução COBOL para um campo de nó.
 * Stub: exibe lista de verbos disponíveis.
 * @param {string} nodeId   - ID do nó pai
 * @param {number} fieldIdx - Índice do campo dentro do nó
 */
function openFieldPicker(nodeId, fieldIdx) {
  showModal('Seletor de Instrução COBOL',
`Selecione abaixo a instrução desejada:

  > PERFORM [paragrafo]
  > MOVE [var] TO [dest]
  > ADD [val] TO [acc]
  > IF [cond] ... END-IF
  > EVALUATE [var] ... END-EVALUATE
  > READ [arquivo] AT END ...
  > WRITE [reg] FROM [area]
  > DISPLAY [texto/var]
  > ACCEPT [variavel]
  > COMPUTE [var] = [expr]
  > INITIALIZE [variavel]
  > STOP RUN

(Em uma versão completa, clique para inserir no campo.)`
  );
}
