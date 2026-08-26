# imagine mică, stabilă
FROM node:22-alpine3.19

<<<<<<< HEAD
# directorul de lucru
=======
FROM node:22-alpine3.21

# Set the working directory in the container
>>>>>>> feat/keycloak-vite
WORKDIR /app

# copiem doar fișierele pentru instalarea dependențelor
COPY package*.json ./

# instalăm dependențele
RUN npm install --legacy-peer-deps

# copiem restul proiectului
COPY . .

# React/Vite rulează pe port 3000
EXPOSE 3000

# pentru vite, permite acces din exterior
ENV HOST=0.0.0.0

# comanda de development
CMD ["npm", "run", "dev", "--", "--host"]
