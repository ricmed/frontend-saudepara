# Stage 1: Build do aplicativo
FROM node:18-alpine AS build

# Configuração do diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração do package
COPY package.json package-lock.json ./

# Copia todos os arquivos do projeto
COPY . .

# Instala as dependências e reconstrói o esbuild para garantir compatibilidade
RUN npm ci && \
    npm rebuild esbuild

# Compila o aplicativo. Padrão: build:producao (explícito). `npm run build` usa .env.production (produção).
# Imagem de homologação: docker build --build-arg NPM_BUILD_SCRIPT=build:homologacao
ARG NPM_BUILD_SCRIPT=build:producao
RUN npm run ${NPM_BUILD_SCRIPT}

# Stage 2: Servidor de produção
FROM nginx:alpine

# Copia os arquivos de build para o diretório do Nginx (Vite usa 'dist' como padrão)
COPY --from=build /app/dist /usr/share/nginx/html

# Copia uma configuração personalizada do Nginx para lidar com rotas SPA (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]