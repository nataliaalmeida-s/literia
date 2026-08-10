# 📚 LiterIA

**Aplicação de Inteligência Artificial no Ensino e Análise de Literatura Brasileira **

O **LiterIA** é uma aplicação web desenvolvida como parte de um Trabalho de Conclusão de Curso (TCC), com o objetivo de explorar possibilidades de utilização da Inteligência Artificial como recurso de apoio à leitura, compreensão e análise de textos literários.

A plataforma permite que o usuário insira trechos de obras literárias e utilize Inteligência Artificial para gerar sínteses, além de organizar os conteúdos produzidos em uma biblioteca pessoal.

🌐 **Aplicação:** https://literia.tech

---

## 🎓 Informações acadêmicas

- **Instituição:** UNINTER
- **Curso:** Engenharia de Software
- **Trabalho:** Trabalho de Conclusão de Curso (TCC)
- **Orientador:** Allan Christian Krainski Ferrari
- **Desenvolvedora:** Natália Almeida Santos

---

## 🎓 Sobre o projeto

O projeto está relacionado ao estudo da **aplicação da Inteligência Artificial no ensino e na análise da Literatura Brasileira**, investigando de que maneira recursos baseados em IA podem auxiliar estudantes durante o contato com textos literários.

A proposta do LiterIA não é substituir a leitura ou a interpretação realizada pelo estudante, mas oferecer uma ferramenta complementar que possa contribuir para a compreensão do texto e para a organização das leituras realizadas.

A aplicação prática desenvolvida para o TCC demonstra a integração entre recursos de Inteligência Artificial, desenvolvimento web e dados bibliográficos de obras literárias.

---

## ✨ Funcionalidades

O LiterIA possui atualmente:

- 🔐 Cadastro e autenticação de usuários;
- 👤 Perfil individual;
- ✨ Geração de resumos de trechos literários com Inteligência Artificial;
- 📖 Identificação da obra por título e autor;
- 🔎 Pesquisa de obras em catálogos bibliográficos;
- 🖼️ Exibição de capa e informações da obra;
- 📚 Biblioteca pessoal de resumos;
- 🕘 Histórico de conteúdos gerados;
- ❤️ Sistema de favoritos;
- 🔔 Notificações;
- ⚙️ Configurações da conta;
- 🔑 Alteração de senha;
- ✉️ Recuperação de senha por e-mail;
- 📱 Interface responsiva para desktop e dispositivos móveis.

---

## 🤖 Inteligência Artificial

A geração das sínteses é realizada por meio da **API do Google Gemini**.

O usuário informa:

- título da obra;
- autor;
- trecho literário que deseja analisar.

A aplicação consulta também serviços externos de dados bibliográficos para permitir que o usuário selecione a obra correspondente antes da geração do resumo.

---

## 📖 Dados bibliográficos

Para complementar as informações das obras, o LiterIA utiliza:

- **Google Books API**
- **Open Library**

Esses serviços podem fornecer dados como:

- título;
- autor;
- capa;
- ISBN;
- ano de publicação;
- edição consultada;
- fonte dos metadados.

---

## 🛠️ Tecnologias utilizadas

### Frontend

- React
- Vite
- JavaScript
- CSS
- React Router
- Lucide React

### Backend

- Node.js
- Express
- Prisma ORM
- JWT para gerenciamento de sessão

### Banco de dados

- PostgreSQL
- Neon

### Inteligência Artificial

- Google Gemini API

### APIs e serviços externos

- Google Books API
- Open Library
- Resend

### Hospedagem

- **Frontend:** Vercel
- **Backend:** Render
- **Banco de dados:** Neon
- **Domínio:** `literia.tech`

---

## 🏗️ Arquitetura

A aplicação está organizada em frontend e backend dentro do mesmo repositório:

```text
literia/
│
├── src/                    # Frontend React
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── public/                 # Arquivos públicos
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   │
│   └── server.js
│
├── package.json
├── vite.config.js
└── vercel.json
```

O funcionamento geral pode ser representado da seguinte forma:

```text
Usuário
   │
   ▼
literia.tech
   │
   ▼
Frontend React
Vercel
   │
   ▼
api.literia.tech
   │
   ▼
Backend Node.js + Express
Render
   │
   ├── Google Gemini
   ├── Google Books
   ├── Open Library
   ├── Resend
   │
   ▼
PostgreSQL
Neon
```

---

## 🔐 Autenticação e segurança

A aplicação possui autenticação individual para que cada usuário tenha acesso apenas aos próprios dados.

Entre os recursos implementados estão:

- sessão autenticada;
- proteção de rotas privadas;
- recuperação de senha por token temporário;
- tokens de recuperação de uso único;
- invalidação de sessões após redefinição de senha;
- limitação de tentativas em rotas sensíveis;
- cookies configurados de acordo com o ambiente;
- variáveis sensíveis armazenadas fora do código-fonte.

Arquivos contendo chaves e credenciais reais não são versionados pelo Git.

---

## ✉️ Recuperação de senha

O sistema utiliza o **Resend** para envio dos e-mails de recuperação.

O domínio de envio configurado é:

```text
mail.literia.tech
```

Os links de redefinição direcionam o usuário novamente para a aplicação:

```text
https://literia.tech/redefinir-senha
```

---

## 🌐 Aplicação em produção

### Frontend

```text
https://literia.tech
```

Hospedado na **Vercel**.

### API

```text
https://api.literia.tech
```

Hospedada no **Render**.

### Health Check

```text
https://api.literia.tech/api/health
```

---

## 💻 Executando o projeto localmente

### Pré-requisitos

É necessário possuir:

- Node.js;
- npm;
- acesso a um banco PostgreSQL;
- credenciais para os serviços externos utilizados pela aplicação.

### 1. Clone o repositório

```bash
git clone URL_DO_REPOSITORIO
cd literia
```

### 2. Instale as dependências do frontend

```bash
npm install
```

### 3. Instale as dependências do backend

```bash
cd backend
npm install
```

### 4. Configure as variáveis de ambiente

Utilize os arquivos:

```text
.env.production.example
backend/.env.example
backend/.env.production.example
```

como referência.

As credenciais reais devem permanecer apenas nos arquivos `.env` locais ou nas configurações seguras das plataformas de hospedagem.

### 5. Execute o backend

Dentro de:

```text
backend/
```

execute:

```bash
npm run dev
```

### 6. Execute o frontend

Em outro terminal, na raiz do projeto:

```bash
npm run dev
```

O frontend local ficará normalmente disponível em:

```text
http://localhost:5173
```

e a API local em:

```text
http://localhost:3000
```

---

## 🔑 Variáveis de ambiente

### Frontend

Exemplo:

```env
VITE_API_URL=http://localhost:3000
```

### Backend

Entre as variáveis utilizadas estão:

```env
NODE_ENV=
PORT=

FRONTEND_URL=
ADDITIONAL_FRONTEND_URLS=

DATABASE_URL=
DIRECT_URL=

JWT_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=

GOOGLE_BOOKS_API_KEY=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

> As chaves reais e credenciais não devem ser adicionadas ao repositório.


---

## 📌 Contexto acadêmico

Este projeto constitui a aplicação prática desenvolvida para um Trabalho de Conclusão de Curso relacionado ao uso da **Inteligência Artificial no ensino e na análise da Literatura Brasileira**.

O desenvolvimento busca associar conceitos estudados durante a pesquisa acadêmica a uma implementação prática, envolvendo:

- Inteligência Artificial;
- processamento de linguagem;
- literatura;
- educação;
- desenvolvimento de aplicações web;
- experiência do usuário;
- organização e recuperação de informações.

---

## 🚧 Projeto acadêmico

O LiterIA foi desenvolvido com finalidade acadêmica e educacional.

As respostas produzidas por modelos de Inteligência Artificial podem apresentar limitações ou imprecisões. Por esse motivo, os conteúdos gerados devem ser utilizados como material complementar de apoio, e não como substitutos da leitura da obra ou da análise crítica realizada pelo estudante.

---

## 👩‍💻 Autoria

Projeto desenvolvido por **Natália Almeida Santos** como parte do Trabalho de Conclusão de Curso.

---

## 📄 Licença

Projeto desenvolvido para fins acadêmicos e educacionais.