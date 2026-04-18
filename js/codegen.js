/* =================================================================
   codegen.js — Geração de código COBOL a partir do estado do canvas
   ================================================================= */

/**
 * Percorre os nós do canvas e as propriedades do painel direito
 * para montar um programa COBOL completo como string.
 * Também preenche o #code-editor no painel "Ver Código".
 *
 * @returns {string} Código COBOL gerado
 */
function generateAllCode() {
  /* ── Lê cabeçalho do programa ─────────────────────────────────── */
  const pid     = (document.getElementById('prop-program-id')?.value || 'MEUCOBOL').toUpperCase();
  const author  =  document.getElementById('prop-author')?.value  || 'AUTOR';
  const date    =  document.getElementById('prop-date')?.value    || new Date().toISOString().split('T')[0];
  const remarks =  document.getElementById('prop-remarks')?.value || '';
  const dialect =  document.getElementById('prop-dialect')?.value || 'IBM Enterprise COBOL';

  /* ── Lê Working-Storage da tabela de argumentos ──────────────── */
  let wsLines = '';
  document.querySelectorAll('#args-tbody tr').forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (!inputs[0] || !inputs[2]) return;
    const nm  = inputs[0].value.trim();
    const lv  = inputs[1]?.value.trim() || '01';
    const pic = inputs[2].value.trim()  || 'PIC X';
    const val = inputs[3]?.value.trim() || '';
    wsLines += `       ${lv} ${nm.padEnd(20)} ${pic}${val ? ` VALUE ${val}` : ''}.\n`;
  });

  /* ── Lê parágrafos dos cards do canvas ───────────────────────── */
  let procLines = '';
  document.querySelectorAll('#canvas .node-card').forEach(card => {
    const hdr   = card.querySelector('.node-card-header');
    const title = hdr ? hdr.textContent.replace('✕', '').trim() : 'PARAGRAFO';
    procLines += `\n       ${title.toUpperCase()}.\n`;
    card.querySelectorAll('.node-field input').forEach(inp => {
      if (inp.value.trim()) procLines += `           ${inp.value.trim()}\n`;
    });
  });

  /* ── Monta o código final ────────────────────────────────────── */
  const code =
`      *================================================================*
      *  PROGRAMA  : ${pid.padEnd(20)}                             *
      *  DIALETO   : ${dialect.padEnd(28)}                 *
      *  GERADO POR: COBOL RPA Dev Studio 1.0                         *
      *================================================================*
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ${pid}.
       AUTHOR. ${author}.
       DATE-WRITTEN. ${date}.
       REMARKS. ${remarks}.

       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-ZOS.
       OBJECT-COMPUTER. IBM-ZOS.

       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ARQ-ENTRADA  ASSIGN TO ENTRADA
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE  IS SEQUENTIAL
               FILE STATUS  IS WS-STATUS-ENT.
           SELECT ARQ-SAIDA    ASSIGN TO SAIDA
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE  IS SEQUENTIAL
               FILE STATUS  IS WS-STATUS-SAI.

       DATA DIVISION.
       FILE SECTION.
       FD  ARQ-ENTRADA  RECORDING MODE IS F
                        BLOCK CONTAINS 0 RECORDS
                        RECORD CONTAINS 80 CHARACTERS.
       01  REG-ENTRADA.
           05  RE-TIPO            PIC X(1).
           05  RE-DADOS           PIC X(79).

       FD  ARQ-SAIDA    RECORDING MODE IS F
                        BLOCK CONTAINS 0 RECORDS
                        RECORD CONTAINS 133 CHARACTERS.
       01  REG-SAIDA.
           05  RS-LINHA           PIC X(133).

       WORKING-STORAGE SECTION.
       01 WS-STATUS-ENT           PIC X(2)  VALUE SPACES.
       01 WS-STATUS-SAI           PIC X(2)  VALUE SPACES.
       01 WS-FIM                  PIC X(1)  VALUE "N".
${wsLines}
       PROCEDURE DIVISION.
${procLines}
       9999-FIM.
           STOP RUN.
`;

  /* Preenche o editor de código no painel direito */
  const codeArea = document.getElementById('code-editor');
  if (codeArea) {
    codeArea.value = code;
    codeArea.removeAttribute('readonly');
  }

  return code;
}
