FROM ubuntu:latest

MAINTAINER Tyler Berry

RUN apt-get update

RUN apt-get install -y gcc

RUN apt-get install -y openjdk-8-jre
RUN apt-get install -y openjdk-8-jdk

RUN apt-get install -y nodejs
