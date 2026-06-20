FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY node_modules ./node_modules
RUN npm install --prefer-offline --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
