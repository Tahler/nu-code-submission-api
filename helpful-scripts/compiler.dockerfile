FROM ubuntu:16.04

MAINTAINER Tyler Berry

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update

################################################################################
# Tools
################################################################################

RUN apt-get install -y bc

################################################################################
# Compilers / Runtimes
################################################################################

# C
RUN apt-get install -y gcc

# Java
# Borrowed Dockerfile commands mostly from:
# https://github.com/dockerfile/java/blob/master/oracle-java8/Dockerfile
RUN echo oracle-java8-installer \
  shared/accepted-oracle-license-v1-1 select true \
  | debconf-set-selections
RUN apt-get install -y software-properties-common
RUN add-apt-repository -y ppa:webupd8team/java
RUN apt-get update -y
RUN apt-get install -y oracle-java8-installer
RUN rm -rf /var/cache/oracle-jdk8-installer
ENV JAVA_HOME /usr/lib/jvm/java-8-oracle

# JavaScript
RUN apt-get install -y nodejs

# Python 2.7
RUN apt-get install -y python2.7

# Python 3 (Comes installed but kept for clarity)
RUN apt-get install -y python3.5

# C#
RUN apt-get install -y mono-mcs
RUN apt-get install -y mono-runtime

# C++ (Comes installed but kept for clarity)
RUN apt-get install -y g++-5

################################################################################
# Cleanup
################################################################################

RUN rm -rf /var/lib/apt/lists/*

WORKDIR /
