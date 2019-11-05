FROM node:10

ARG NPM_TOKEN
WORKDIR /usr/src/app

# Wild card for package.json & package-lock.json
# Seperate command for cp package.json so that it doesn't reinstall every source change
COPY ci-install.sh ./
COPY .npmrc* ./
COPY package*.json ./

# Use creds, installs, then forgets them
RUN bash ci-install.sh

# Copy source
COPY . .

ENV NODE_ENV production

RUN npm run build

USER node

CMD ["npm", "start"]
