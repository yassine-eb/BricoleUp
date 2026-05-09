FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx ng build --configuration production

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist/bricoleup/browser ./public
EXPOSE 3000
CMD ["serve", "-s", "public", "-l", "3000"]
