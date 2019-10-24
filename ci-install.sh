#!/bin/bash
# In a CI environment, we use a different .npmrc to get a NPM_TOKEN from env
# This script moves this into place, and cleans up afterwards to prevent issues

# Swap npmrc for npmrc.ci
mv .npmrc .npmrc.normal
cp .npmrc.ci .npmrc

npm install

# If we leave the npmrc.ci there, docker build will include that,
# and the production image will run and expect a NPM_TOKEN
mv .npmrc.normal .npmrc
