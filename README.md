[English version below](#faro-english)

# Faro

O **Faro** é um aplicativo para aproximar animais disponíveis para adoção e pessoas que querem adotar, tornando o processo mais simples, humano e transparente.

Este repositório é um app **React Native** com **Expo**, usando roteamento baseado em arquivos (**Expo Router**).

## Ambiente de desenvolvimento

O projeto foi configurado e testado num **PC Linux (Ubuntu 24)**; o app é executado no **iPhone** (com **Expo Go**), na mesma rede que o computador.

## Começar

1. Instale as dependências: `pnpm install`
2. Inicie o servidor de desenvolvimento: `pnpm start`
3. No celular, instale o **Expo Go** e leia o QR code do terminal com a câmera do telefone (PC e telefone tem que estar na mesma rede Wi‑Fi).

Instruções detalhadas, pré-requisitos e scripts úteis estão na [versão em inglês](#faro-english) abaixo.

## Executando com Docker

É possível rodar o build web de produção e o servidor de desenvolvimento dentro de containers Docker, sem precisar instalar Node ou pnpm localmente. Detalhes completos em [Running with Docker](#running-with-docker) na versão em inglês abaixo.

---

<a id="faro-english"></a>

# Faro

**Faro** is an app that connects animals looking for a home with people who want to adopt — making adoption easier, kinder, and clearer.

This repo is a **React Native** app built with **Expo** and file-based routing (**Expo Router**).

## Development setup

The app is developed on **Linux (Ubuntu 24)** and run on an **iPhone** (with **Expo Go**), on the **same Wi‑Fi network** as your machine.

## Get started

### Prerequisites

Pick **one** of the following:

- **Local toolchain** — for native iOS/Android development:
  - [Node.js](https://nodejs.org/) (LTS recommended)
  - [pnpm](https://pnpm.io/installation)
  - On your smartphone: install [Expo Go](https://expo.dev/go) from the App Store (or Play Store)

- **Docker** — for the web build only (dev server or production bundle):
  - [Docker](https://docs.docker.com/get-docker/) 24+ with the [Compose plugin](https://docs.docker.com/compose/install/)

### Install and run

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start the dev server**

   ```bash
   pnpm start
   ```

3. **Open on your smartphone**
   - Scan the QR code from the terminal with the **Expo Go Camera** (for Android) or **iPhone Camera** (for iOS).
   - Ensure the phone and your machine are on the **same network**; if the connection fails, try tunnel mode in the Expo CLI when prompted.

### Useful scripts

| Command        | Description             |
| -------------- | ----------------------- |
| `pnpm start`   | Start Expo (dev server) |
| `pnpm android` | Start for Android       |
| `pnpm ios`     | Start for iOS (macOS)   |
| `pnpm web`     | Start for web           |
| `pnpm lint`    | Run ESLint              |

### Running with Docker

The web build can be run end-to-end in containers — no local Node or pnpm required. Two profiles are provided via `docker-compose.yml`:

| Profile  | Target      | Port | Use case                                 |
| -------- | ----------- | ---- | ---------------------------------------- |
| `dev`    | `dev` stage | 8081 | Hot-reloading web dev server             |
| `prod`   | `prod` stage| 8080 | Static web bundle served by nginx        |
| `both`   | both stages | both | Spin up dev and prod side-by-side        |

#### Prerequisites (web only)

- [Docker](https://docs.docker.com/get-docker/) 24+
- Docker Compose v2 (`docker compose`, bundled with Docker Desktop / `docker-compose-plugin`)

#### 1. Configure environment

Copy the example file and fill in your Supabase credentials. Both Compose services read them via variable substitution.

```bash
cp .env.example .env
# edit .env and set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY
```

> The `EXPO_PUBLIC_*` values are **inlined into the JS bundle at build time** by Metro, so the production container needs no env vars at runtime — but you still need them at build time.

#### 2. Run the production web bundle (recommended for first try)

```bash
docker compose --profile prod up --build
```

Then open <http://localhost:8080>. The image is multi-stage: a `node:24-bookworm-slim` builder produces the static bundle, and a small `nginx:1.27-alpine` image serves it (with SPA history-API fallback and long-lived caching for hashed assets).

To stop and remove the container:

```bash
docker compose --profile prod down
```

#### 3. Run the dev server with hot reload

```bash
docker compose --profile dev up --build
```

Then open <http://localhost:8081> for the web build. The service bind-mounts the source on top of the image so edits in `app/`, `features/`, etc. reload automatically. Press `Ctrl+C` to stop.

> iOS/Android builds are **not** supported from the dev container (they need native toolchains). Use the local toolchain or [EAS Build](https://docs.expo.dev/build/introduction/) for native targets.

#### 4. Useful Docker commands

| Command                                                                       | Description                              |
| ----------------------------------------------------------------------------- | ---------------------------------------- |
| `docker compose --profile prod up --build`                                    | Build and start the production web image |
| `docker compose --profile dev  up`                                            | Start the dev server (no rebuild)        |
| `docker compose --profile both up --build`                                    | Start both dev and prod together         |
| `docker compose --profile prod down`                                          | Stop and remove the production container |
| `docker image rm faro:web`                                                    | Free disk space by removing the image    |
| `docker build --target prod -t faro:web .`                                    | Build only the production image (no Compose) |

### Project layout

Screens and navigation under the **`app`** directory, this project uses [Expo Router](https://docs.expo.dev/router/introduction/).

### Reset to a blank app (optional)

When you want a clean slate:

```bash
pnpm run reset-project
```

This moves the starter code to **`app-example`** and creates a fresh **`app`** folder.

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)
