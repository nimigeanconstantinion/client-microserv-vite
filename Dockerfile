FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist/ui /usr/share/nginx/html/ui
COPY config/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
