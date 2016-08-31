FROM ubuntu:16.04

MAINTAINER Tyler Berry

RUN apt-get update

# Install Nodejs
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs

# Copy and install the necessary web files
# Note that '.' references the first argument in `docker build`
COPY . /var/www
WORKDIR /var/www
RUN npm install --production

# Startup command
ENTRYPOINT node ./index.js
