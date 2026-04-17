FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --omit=optional

COPY . .

EXPOSE 3000

CMD ["npm", "start"]