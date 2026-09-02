FROM node:20-alpine AS build
WORKDIR /app

COPY . ./

RUN npm install --include=dev
RUN if [ -f "vite.config.ts" ]; then npm run build; else npm run build -w apps/web; fi

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html 2>/dev/null || COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
