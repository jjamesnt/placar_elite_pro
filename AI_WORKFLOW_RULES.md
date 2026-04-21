# Regras de Trabalho e Interação com a IA (Antigravity)

**Projeto: Placar Elite Pro**
**Objetivo:** Evitar quebras de código, efeitos colaterais em módulos estáveis e garantir a proteção da arquitetura do projeto.

A partir da criação deste arquivo, TODAS as interações da IA com este repositório devem respeitar rigorosamente as diretrizes abaixo:

## 1. Modo de Planejamento Socrático (Obrigatório)
*   **Investigação Silenciosa Primeira:** Ao receber um comando, a IA deve analisar o problema usando leitura de arquivos e buscas, SEM fazer NENHUMA alteração de código.
*   **Diagnóstico e Definição de Escopo:** A IA deve elaborar um "Plano de Implementação" listando EXATAMENTE quais os arquivos/módulos serão alterados e explicar de forma clara o porquê.
*   **Autorização Prévia:** A IA deve interromper a execução e aguardar o "Ok" explícito do Usuário antes de iniciar a edição de qualquer arquivo.

## 2. Escopo Cirúrgico e Compartimentalizado
*   **Isolamento de Responsabilidades:** A solução de um problema deve ficar restrita ao seu próprio domínio (ex: uma mudança na TV afeta apenas regras de TV).
*   **Separação UI vs. Lógica Global:** Mudanças visuais (Modais, Telas, CSS) têm tolerância zero para tocar em arquivos que gerenciam estado global ou conectividade, a menos que seja o alvo da tarefa.
*   Se a tarefa exigir alterar um código modular que funciona perfeitamente, a IA tem a obrigação de emitir um "Alerta de Risco Socrático".

## 3. Avanço em Passos Curtos (Baby Steps)
*   A IA deve evitar refatorações gigantes de múltiplos arquivos em uma única rodada.
*   O fluxo dever ser: Isolar O problema -> Alterar apenas os alvos previstos -> Pedir para o usuário testar.

## 4. Evolução para Código Blindado
*   Sempre que a lógica central do jogo for tocada (Score, TieBreak, Vantagens, Sincronização), a IA deve trabalhar pensando na testabilidade daquele bloco, sugerindo separar regras puras das engrenagens de interface (React).

## 5. Deploy e Atualizações em Produção (Rigor Absoluto)
*   A IA é **terminantemente proibida** de executar rotinas de build, merge para a branch principal (main/master) ou rodar qualquer script de deploy para produção por vontade própria.
*   A promoção de qualquer código para o ambiente de Produção só pode ocorrer mediante uma **ordem explícita e inequívoca** do usuário (Ex: "Pode subir para produção").
*   Na dúvida, a IA deve pressupor que as alterações são apenas para o ambiente de desenvolvimento/teste local.

## 6. Recomendação de Agentes/Modelos por Complexidade
*   Antes de iniciar uma tarefa, a IA deve avaliar a complexidade técnica e o risco da mesma.
*   De forma proativa, a IA deve usar o seu "Plano de Implementação Socrático" para recomendar qual **Agente ou Modelo de IA** o usuário deveria selecionar para a tarefa em questão.
*   **Exemplo Prático:** Se a tarefa envolver alterar a sincronização da TV via WebSocket (Alta complexidade), a IA deve recomendar o uso do modelo mais poderoso disponível (ex: *Gemini Pro* / *High*). Se for apenas alterar a cor de um texto (Baixa Complexidade), a IA pode sugerir um agente mais ágil e econômico.

---
*Instrução interna para Antigravity: Ao ser inicializado neste projeto para uma nova sessão ou tarefa, você deve sempre operar regido por estas Regras de Proteção.*
