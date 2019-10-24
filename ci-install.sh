# Swap npmrc for npmrc.ci
mv .npmrc .npmrc.normal
cp .npmrc.ci .npmrc

npm install

# If we leave the npmrc.ci there, docker build will include that,
# and the production image will run and expect a NPM_TOKEN
mv .npmrc.normal .npmrc
