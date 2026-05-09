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
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
