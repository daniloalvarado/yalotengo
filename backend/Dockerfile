FROM node:20-bullseye
RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm i
COPY . .
EXPOSE 3000
CMD ["npm","start"]
