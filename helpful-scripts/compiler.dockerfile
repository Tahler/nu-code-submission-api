FROM ubuntu:16.04

MAINTAINER Tyler Berry

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
# Necessary for add-apt-repository
RUN apt-get install -y software-properties-common

# Tools

RUN apt-get install -y bc

# Compilers / Runtimes

RUN apt-get install -y gcc

# Java
# Borrowed Dockerfile commands mostly from:
# https://github.com/dockerfile/java/blob/master/oracle-java8/Dockerfile
RUN echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | debconf-set-selections
RUN add-apt-repository -y ppa:webupd8team/java
RUN apt-get update -y
RUN apt-get install -y oracle-java8-installer
RUN rm -rf /var/cache/oracle-jdk8-installer
ENV JAVA_HOME /usr/lib/jvm/java-8-oracle

RUN apt-get install -y nodejs

# Cleanup

RUN rm -rf /var/lib/apt/lists/*
