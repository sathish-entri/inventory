FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm install
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push && if [ -f 'dist/main.js' ]; then node dist/main.js; else node dist/src/main.js; fi"]
