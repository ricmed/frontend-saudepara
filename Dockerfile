# Stage 1: Build do aplicativo
FROM node:18-alpine AS build

WORKDIR /app

# Só o lock primeiro → cache de `npm ci` quando só o código muda
COPY package.json package-lock.json ./
RUN npm ci && npm rebuild esbuild

# Restante do projeto (inclui .env.producao / .env.homologacao usados pelo --mode do Vite)
COPY . .

# Padrão: `build:producao` (vite --mode producao → .env.producao).
# Homologação: docker build --build-arg NPM_BUILD_SCRIPT=build:homologacao
ARG NPM_BUILD_SCRIPT=build:producao
RUN npm run ${NPM_BUILD_SCRIPT}

# Stage 2: Servidor de produção
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
