FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files and prisma directory
COPY package*.json ./
COPY prisma ./prisma/

# Install app dependencies
RUN npm install

# Generate Prisma Client
# This is required so the client is available for the build and runtime
RUN npx prisma generate

# Bundle app source
COPY . .

# Build the app
RUN npm run build

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
