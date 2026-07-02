# ====== build del frontend ======
FROM node:20-alpine AS webbuilder
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm ci
COPY ./frontend .
# Inyecta rutas relativas para un solo puerto (sin CORS)
ARG VITE_API_BASE=/api
ARG VITE_WS_BASE=/ws
ARG VITE_MP_PUBLIC_KEY

ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_WS_BASE=$VITE_WS_BASE
ENV VITE_MP_PUBLIC_KEY=$VITE_MP_PUBLIC_KEY
RUN npm run build

# ====== nginx final ======
FROM nginx:1.27-alpine
COPY ./gateway/nginx.conf /etc/nginx/nginx.conf
COPY --from=webbuilder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://127.0.0.1/ || exit 1
