#!/bin/sh
npx prisma db push
node dist/apps/api/src/main.js
