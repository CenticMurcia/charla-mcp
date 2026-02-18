FROM node:slim

WORKDIR /app

# Copiar archivos de configuración del proyecto
COPY package*.json ./
COPY tsconfig.json ./
COPY resources/ ./resources/

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]

# docker build -t charlamcp-centic -f Dockerfile .
# docker run --rm -p 3000:3000 charlamcp-centic
