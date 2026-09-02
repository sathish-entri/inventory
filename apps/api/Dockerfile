FROM node:20-alpine AS build
WORKDIR /app

COPY . ./

RUN npm install --include=dev
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate --schema=prisma/schema.prisma; else npx prisma generate --schema=apps/api/prisma/schema.prisma; fi
RUN if [ -f "tsconfig.build.json" ]; then npx tsc -p tsconfig.build.json; else npm run build -w apps/api; fi

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3001
CMD ["sh", "-c", "if [ -d 'prisma' ]; then npx prisma db push && node dist/src/main.js; else cd apps/api && npx prisma db push && node dist/src/main.js; fi"]
