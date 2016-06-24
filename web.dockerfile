FROM node:4.4.6

MAINTAINER Tyler Berry

COPY . /var/www

WORKDIR /var/www

RUN npm install

CMD npm start
