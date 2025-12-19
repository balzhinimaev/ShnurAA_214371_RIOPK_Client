# ./ShnurAA_214371_RIOPK_Client/Dockerfile

# --- Build Stage ---
FROM node:22.13.1

# Принимаем аргумент сборки
ARG NUXT_PUBLIC_API_BASE

# Устанавливаем его как переменную окружения для процесса сборки
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

# Выводим переменную для проверки во время сборки (опционально)
RUN echo "Building with NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}"

# Запускаем сборку Nuxt
# RUN npm run build

EXPOSE 3002

ENV PORT=3002

CMD ["npm", "run", "preview"]