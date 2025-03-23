# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all files
COPY . .

# Build the React app
RUN npm run build

# Serve the build folder using a lightweight web server
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3001"]

# Expose port
EXPOSE 3000
