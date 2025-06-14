FROM node:18-slim

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

# Serve static build (or use dev server for dev)
CMD ["yarn", "preview", "--host", "0.0.0.0"]
