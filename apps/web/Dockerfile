FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm install
WORKDIR /app/apps/web
RUN npm run build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
