FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist/frontend/server ./server
COPY --from=build /app/dist/frontend/browser ./browser
EXPOSE 4000
CMD ["node", "server/server.mjs"]
