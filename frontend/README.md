# VetOn — Frontend de autenticação

Frontend React + TypeScript + Vite com login, cadastro e recuperação de senha, estilizado com base nas referências visuais enviadas.

## Onde colocar

Coloque a pasta `frontend` no mesmo nível da pasta `backend`:

```text
veton/
  backend/
  frontend/
```

## Como executar

1. Mantenha o backend em execução. No repositório atual, `backend/src/index.ts` usa a porta `3000` por padrão.
2. Abra outro terminal na pasta `frontend`.
3. Execute `npm install`.
4. Execute `npm run dev`.
5. Abra o endereço exibido pelo Vite (normalmente `http://localhost:5173`).

O arquivo `vite.config.ts` encaminha as chamadas `/api/...` para `http://localhost:3000/...`, removendo o prefixo `/api`. Assim, o frontend conversa com o backend pelo proxy do Vite durante o desenvolvimento.

Se o backend estiver em outra porta, altere `target` no `vite.config.ts`.

## Foto do painel lateral

Coloque uma imagem na pasta `public/images` com o nome `cachorro-veton.jpg`.

## Campos do cadastro

O formulário exige nome, e-mail, tipo de usuário, senha e confirmação, RG e endereço (cidade, estado, bairro, número e CEP). Para Tutor, exige CPF. Para Veterinário, exige CRMV e especialidade.

O frontend envia esses campos para `POST /auth/register` com os mesmos nomes esperados por `backend/src/controllers/authController.ts`. A confirmação de senha é validada no navegador e não é enviada à API. O campo `situacao` é enviado como `Ativo`.

## Rotas utilizadas

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/esqueci-senha`
- `POST /auth/redefinir-senha`

O login salva o JWT retornado em `localStorage` (`veton_token`) para ser utilizado nas próximas telas autenticadas.

Para recuperação de senha, o backend precisa estar com `EMAIL_USER` e `EMAIL_PASSWORD` configurados no `.env` e com acesso ao serviço de e-mail.
