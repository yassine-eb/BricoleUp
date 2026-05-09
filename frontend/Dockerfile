FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx ng build --configuration production

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/bricoleup/browser ./public
COPY server.js .
RUN npm install express
CMD ["node", "server.js"]
