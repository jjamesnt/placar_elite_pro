---
description: Como realizar o deploy seguro para produção sincronizando os ramos develop e main
---

# Workflow de Deploy Seguro

Para evitar que as alterações fiquem apenas no ambiente de desenvolvimento, siga estes passos para subir para produção:

1. **Certifique-se de que está no branch develop e tudo está commitado:**
   ```powershell
   git checkout develop
   git status
   ```

2. **Envie as alterações do develop para o GitHub:**
   ```powershell
   git push origin develop
   ```

3. **Mude para o branch principal (main):**
   ```powershell
   git checkout main
   ```

4. **Traga as alterações do develop para o main:**
   ```powershell
   git merge develop -m "Comentário sobre o que está subindo"
   ```

5. **Envie o main para o GitHub (isso dispara o deploy real):**
   ```powershell
   git push origin main
   ```

6. **Volte para o develop para continuar trabalhando:**
   ```powershell
   git checkout develop
   ```

// turbo
7. **Dica:** Você pode rodar `npm run build` antes do passo 3 para garantir que nada quebrou.
