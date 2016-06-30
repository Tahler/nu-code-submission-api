FROM ubuntu:16.04

MAINTAINER Tyler Berry

RUN apt-get update

# Install Nodejs
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -
RUN apt-get install -y nodejs

# Install Docker
# docker.io is used rather than the docker-engine because it starts the docker service automatically
RUN apt-get install -y docker.io

# Copy and install the necessary web files
COPY . /var/www
WORKDIR /var/www
RUN npm install

# Startup command
ENTRYPOINT npm start
