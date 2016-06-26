FROM ubuntu:14.04

MAINTAINER Tyler Berry

RUN apt-get update

# Tools

RUN apt-get install -y bc

# Compilers / Runtimes

RUN apt-get install -y gcc

RUN apt-get install -y openjdk-8-jre
RUN apt-get install -y openjdk-8-jdk

RUN apt-get install -y nodejs
