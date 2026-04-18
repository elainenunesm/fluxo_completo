/* =================================================================
   state.js — Estado global compartilhado entre os módulos JS
   Importe este arquivo ANTES dos demais scripts.
   ================================================================= */

/** Nó atualmente selecionado no canvas (id string ou null) */
let selectedNode = null;

/** Tipo de atividade sendo arrastado do painel de atividades */
let draggingType = null;

/** Contador total de nós no canvas */
let nodeCounter = 7;

/** Controla se o painel de argumentos está aberto */
let argsOpen = false;

/**
 * Contadores sequenciais por tipo de atividade.
 * Usados para gerar IDs únicos nos nós criados dinamicamente.
 */
let nodeSeqCounter = {
  READ: 0, WRITE: 0, DISPLAY: 0, ACCEPT: 0,
  MOVE: 0, INITIALIZE: 0,
  ADD: 0, SUBTRACT: 0, MULTIPLY: 0, DIVIDE: 0, COMPUTE: 0,
  IF: 0, EVALUATE: 0, PERFORM: 0, PERFORM_UNTIL: 0,
  GO_TO: 0, STOP_RUN: 0, STRING_OP: 0, UNSTRING: 0,
};

/**
 * Metadados das atividades COBOL disponíveis no painel de atividades.
 * Cada entrada define: ícone, rótulo, cor do cabeçalho e campos padrão.
 * Adicione novos verbos COBOL aqui para expandir o painel.
 */
const activityMeta = {
  READ:          { icon: '📖', label: 'READ',          color: 'green',  fields: ['READ [arquivo]', '  AT END MOVE "S" TO WS-FIM'] },
  WRITE:         { icon: '✍️', label: 'WRITE',         color: 'purple', fields: ['WRITE [registro] FROM WS-REG'] },
  DISPLAY:       { icon: '🖥️', label: 'DISPLAY',       color: 'blue',   fields: ['DISPLAY WS-MENSAGEM'] },
  ACCEPT:        { icon: '⌨️', label: 'ACCEPT',        color: 'green',  fields: ['ACCEPT WS-VARIAVEL'] },
  MOVE:          { icon: '➡️', label: 'MOVE',          color: '',       fields: ['MOVE [origem] TO [destino]'] },
  INITIALIZE:    { icon: '🔄', label: 'INITIALIZE',    color: '',       fields: ['INITIALIZE WS-VARIAVEL'] },
  ADD:           { icon: '➕', label: 'ADD',           color: 'orange', fields: ['ADD 1 TO WS-CONTADOR'] },
  SUBTRACT:      { icon: '➖', label: 'SUBTRACT',      color: 'orange', fields: ['SUBTRACT WS-A FROM WS-B'] },
  MULTIPLY:      { icon: '✖️', label: 'MULTIPLY',      color: 'orange', fields: ['MULTIPLY WS-A BY WS-B GIVING WS-C'] },
  DIVIDE:        { icon: '➗', label: 'DIVIDE',        color: 'orange', fields: ['DIVIDE WS-A BY WS-B GIVING WS-C'] },
  COMPUTE:       { icon: '🧮', label: 'COMPUTE',       color: 'orange', fields: ['COMPUTE WS-RESULT = WS-A + WS-B'] },
  IF:            { icon: '❓', label: 'IF / ELSE',     color: 'purple', fields: ['IF WS-COND = "S"', '  PERFORM [paragraf]', 'ELSE', '  PERFORM [outro]', 'END-IF'] },
  EVALUATE:      { icon: '🔀', label: 'EVALUATE',      color: 'purple', fields: ['EVALUATE WS-TIPO', '  WHEN "A" PERFORM [para-A]', '  WHEN OTHER PERFORM [outro]', 'END-EVALUATE'] },
  PERFORM:       { icon: '🔁', label: 'PERFORM',       color: 'blue',   fields: ['PERFORM [paragrafo]'] },
  PERFORM_UNTIL: { icon: '🔂', label: 'PERFORM UNTIL', color: 'blue',   fields: ['PERFORM [paragrafo]', '  UNTIL WS-FIM = "S"'] },
  GO_TO:         { icon: '↪️', label: 'GO TO',         color: '',       fields: ['GO TO [paragrafo]'] },
  STOP_RUN:      { icon: '⏹️', label: 'STOP RUN',      color: '',       fields: ['STOP RUN'] },
  STRING_OP:     { icon: '🔤', label: 'STRING',        color: 'blue',   fields: ['STRING WS-A DELIMITED SIZE', '  INTO WS-DESTINO', 'END-STRING'] },
  UNSTRING:      { icon: '✂️', label: 'UNSTRING',      color: 'blue',   fields: ['UNSTRING WS-ORIGEM DELIMITED ";"', '  INTO WS-A WS-B', 'END-UNSTRING'] },
};

/**
 * Conexões dinâmicas entre nós.
 * Cada entrada é um objeto { from: 'node-id', to: 'node-id' }.
 */
let connections = [];

/**
 * ID (completo do DOM) do nó de origem quando o usuário está
 * em modo de conexão (clicou no botão "→" de algum nó).
 * Null quando não está conectando.
 */
let connectingFrom = null;
