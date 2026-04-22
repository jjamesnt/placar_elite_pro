# DIRETRIZES DE DESENVOLVIMENTO (AI INSTRUCTIONS)

Este arquivo contém regras mandatórias para qualquer IA atuando neste repositório.

## 1. Idioma e Comunicação
- **Sempre PT-BR**: Toda a comunicação com o usuário deve ser em Português do Brasil.
- **Interface 100% PT-BR**: Todos os textos, botões, modais e mensagens de erro exibidos na interface do usuário (UI) devem ser em Português.
- **Tradução Obrigatória**: Se introduzir uma nova biblioteca ou componente, garanta que as strings padrão sejam traduzidas.

## 2. Governança de Deploy
- **Proibido Push Direto**: Nunca faça `git push origin main` ou merge para a `main` sem autorização explícita e específica para aquele conjunto de mudanças.
- **Ambiente Local Primeiro**: Sempre rode `npm run build` localmente e verifique se o ambiente de desenvolvimento (`npm run dev`) está estável antes de sugerir um deploy.

## 3. Compatibilidade
- **TV Box / Hardware Legado**: Manter o foco em compatibilidade com navegadores antigos (Chrome 50+). Evitar o uso de CDN externo para Tailwind ou Import Maps que quebrem o carregamento inicial.

---
*Assinado: James Rizo*
