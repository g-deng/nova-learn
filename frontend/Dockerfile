FROM node:18-slim

WORKDIR /app

# Install dependencies using npm
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app code
COPY . .

# Build the app using npm
# RUN npm run build

# Serve the production build
# RUN npm install -g serve
# CMD ["serve", "-s", "dist", "-l", "3000"]

# Run the Vite dev server (with hot reload)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
