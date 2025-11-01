
#FROM node:17.1-alpine as build-stage
#WORKDIR /app
#COPY package*.json ./
#RUN npm install
#COPY . .
#RUN npm run build
#FROM nginx:1.22.1-alpine as prod-stage
#COPY --from=build-stage /app/build /usr/share/nginx/html
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]

FROM node:22-alpine3.21

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application files to the container
COPY . .

# Expose the port on which the app runs
EXPOSE 3000

ENV BROWSER=none

# Command to start the React app
CMD ["npm", "run dev"]
