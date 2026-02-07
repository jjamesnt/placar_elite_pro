# Regras de Deploy - Placar Elite Pro

**ESTRITA PROIBIÇÃO DE DEPLOY AUTOMÁTICO.**

Para evitar erros em produção, o fluxo de trabalho deve ser:

1.  **Desenvolvimento**: Todas as alterações são feitas e testadas no branch `develop`.
2.  **Validação do Usuário**: O usuário testa as mudanças rodando o projeto localmente (`npm run dev`).
3.  **Push para Develop**: Após os testes locais, as mudanças são enviadas para o GitHub apenas no branch `develop`.
    ```bash
    git push origin develop
    ```
4.  **Aprovação**: O usuário deve dar o "OK" explícito para subir para produção.
5.  **Merge para Main**: Somente após o OK, as mudanças são mescladas e enviadas para o `main`.
    ```bash
    git checkout main
    git merge develop
    git push origin main
    git checkout develop
    ```
