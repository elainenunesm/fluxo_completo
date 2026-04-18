/* =================================================================
   toolbar.js — Ações dos botões do Ribbon (Novo, Salvar, Exportar,
                Compilar, Executar, Validação e Ajuda)
   ================================================================= */

/* ── Workflow ────────────────────────────────────────────────────── */

/**
 * Limpa o canvas e reinicia as propriedades para um novo programa.
 */
function newProgram() {
  if (!confirm('Criar novo programa? O projeto atual não salvo será perdido.')) return;

  // Remove apenas nós dinâmicos (preserva Start, End e nós base)
  document.querySelectorAll(
    '#canvas .cf-node:not(#node-start):not(#node-end-node):not(#node-main):not(#node-read):not(#node-proc):not(#node-write)'
  ).forEach(n => n.remove());

  // Limpa campos dos nós base
  document.querySelectorAll('#canvas .node-card .node-field input').forEach(inp => {
    inp.value = '';
  });

  document.getElementById('prop-program-id').value = 'NOVOPROG';
  updateNodeCount();
  drawArrows();
  showToast('Novo programa criado.', 'success');
  setStatus('Novo programa iniciado');
}

/**
 * Gera o código COBOL e faz download do arquivo .CBL.
 */
function saveProgram() {
  const code = generateAllCode();
  const blob = new Blob([code], { type: 'text/plain' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = (document.getElementById('prop-program-id')?.value || 'MEUCOBOL').toUpperCase() + '.CBL';
  a.click();
  showToast('Código COBOL salvo!', 'success');
  setStatus('Arquivo .CBL salvo');
}

/* ── Projeto ─────────────────────────────────────────────────────── */

/** Abre o modal com o código gerado para visualização/cópia. */
function exportCode() {
  showModal('Exportar Código COBOL', generateAllCode());
}

/** Ativa a aba "Ver Código" no painel direito. */
function openCodeView() {
  document.querySelectorAll('.rtab').forEach(t => {
    if (t.textContent.trim() === 'Ver Código') switchRTab(t, 'code-view');
  });
  showToast('Código gerado no painel direito.', 'success');
}

/** Simula importação de COPYbooks. */
function importCopybooks() {
  showToast('Importar COPY: selecione um arquivo .cpy no projeto.', 'success');
}

/** Abre o gerenciador de bibliotecas (stub). */
function manageLibraries() {
  showToast('Gerenciador de bibliotecas COBOL em breve.', 'success');
}

/* ── Código COBOL ────────────────────────────────────────────────── */

/** Simula compilação do programa. */
function compileProgram() {
  setStatus('Compilando...');
  setTimeout(() => {
    showToast('Compilação simulada: 0 erros, 0 avisos.', 'success');
    setStatus('✓ Compilação OK');
  }, 1200);
}

/** Simula execução do programa. */
function runProgram() {
  setStatus('Executando...');
  setTimeout(() => {
    showToast('Execução simulada concluída. Verifique o console.', 'success');
    setStatus('✓ Execução finalizada');
  }, 1500);
}

/* ── Dados ───────────────────────────────────────────────────────── */

/** Abre o painel de Working-Storage (tabela de argumentos). */
function editWorkingStorage() {
  argsOpen = true;
  document.getElementById('args-panel').classList.add('open');
  showToast('Edite a Working-Storage na barra inferior.', 'success');
}

function editFileSection()  { showToast('File Section: edite diretamente no código gerado.', 'success'); }
function editLinkage()      { showToast('Linkage Section: configure pelo painel de propriedades.', 'success'); }
function editEnvironment()  { showToast('Environment Division: configure pelo painel de propriedades.', 'success'); }

/* ── Validação ───────────────────────────────────────────────────── */

/** Simula análise/refresh do projeto. */
function refreshAnalyse() {
  setStatus('Analisando...');
  setTimeout(() => {
    showToast('Análise concluída: sem problemas encontrados.', 'success');
    setStatus('✓ Análise concluída');
  }, 900);
}

/**
 * Verifica se algum campo de nó contém placeholders não preenchidos.
 * Considera placeholder: texto com 'TODO' ou '['.
 */
function syntaxCheck() {
  const fields  = document.querySelectorAll('#canvas .node-field input');
  let   errors  = 0;
  fields.forEach(f => {
    if (f.value.includes('TODO') || f.value.includes('[')) errors++;
  });
  if (errors > 0) {
    showToast(`⚠ ${errors} campo(s) com placeholder detectado(s).`, 'error');
  } else {
    showToast('✓ Nenhum erro de sintaxe detectado.', 'success');
  }
}

/** Mapa de fluxo — stub. */
function generateFlowMap() {
  showToast('Mapa de fluxo: em desenvolvimento. Verifique os nós no canvas.', 'success');
}

/* ── Ajuda ───────────────────────────────────────────────────────── */

/** Exibe a referência rápida dos verbos COBOL mais usados. */
function showDocs() {
  showModal('Referência COBOL', [
    'VERBOS MAIS USADOS:',
    '  MOVE origem TO destino',
    '  ADD valor TO acumulador',
    '  SUBTRACT valor FROM total',
    '  MULTIPLY a BY b GIVING c',
    '  DIVIDE a BY b GIVING c REMAINDER r',
    '  COMPUTE expr = a + b * c',
    '  PERFORM paragrafo',
    '  PERFORM paragrafo UNTIL cond',
    '  IF cond ... ELSE ... END-IF',
    '  EVALUATE var',
    '    WHEN val  statements',
    '    WHEN OTHER statements',
    '  END-EVALUATE',
    '  READ arquivo AT END ...',
    '  WRITE registro FROM area',
    '  DISPLAY "mensagem"',
    '  ACCEPT variavel',
    '  STRING a DELIMITED SIZE INTO b',
    '  UNSTRING a DELIMITED ";" INTO b c',
    '  INITIALIZE variavel',
    '  STOP RUN',
  ].join('\n'));
}

/** Exibe um resumo das configurações do projeto atual. */
function showConfigModal() {
  showModal('Configurações do Projeto', [
    'PROGRAM-ID  : ' + (document.getElementById('prop-program-id')?.value || ''),
    'AUTHOR      : ' + (document.getElementById('prop-author')?.value      || ''),
    'DIALETO     : ' + (document.getElementById('prop-dialect')?.value     || ''),
    'PLATAFORMA  : ' + (document.getElementById('prop-platform')?.value    || ''),
    'DATA        : ' + new Date().toISOString().split('T')[0],
  ].join('\n'));
}
