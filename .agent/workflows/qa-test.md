---
description: Teste de QA completo (Navegação, Interação e Layout)
---

# Teste de QA

Este workflow descreve os passos para realizar um teste de QA completo na aplicação.

## Passos

1. **Iniciar Servidor Local**: Se o servidor não estiver rodando, execute `npm run dev -- --port 3001` para garantir que estamos no projeto correto.
2. **Abrir Navegador**: Navegue para a URL local (http://localhost:3001).
3. **Exploração de Páginas**:
   - Navegue por todas as rotas visíveis no menu ou abas (Placar, Histórico, Ranking, etc.).
   - Verifique se cada página carrega corretamente sem erros de console ou travamentos.
4. **Interação com Elementos**:
   - Teste a pontuação (Score A/B).
   - Teste os temporizadores e botões de ação (Undo, Reset).
   - Abra e feche modais (Vitória, Vai a Três).
5. **Verificação de Layout**:
   - Verifique se há elementos sobrepostos.
   - Verifique a responsividade básica.
6. **Relatório**:
   - Relate qualquer erro técnico (crash).
   - Relate inconsistências visuais ou de interface.
