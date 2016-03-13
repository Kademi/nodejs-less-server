#!/bin/bash

# login to docker
sudo `aws ecr get-login --region=us-east-1`

# Remove old images and containers
sudo docker rm `sudo docker ps -qa`
sudo docker rmi --force `sudo docker images -qa`

set -ex

#define build parameters
WORKSPACE=/tmp/nodejsless
DATE=`date +%H%M-%d%m%Y`

#clean old files if any
rm -rf $WORKSPACE

mkdir -p $WORKSPACE

cp -r compiler.js $WORKSPACE
cp -r server.js $WORKSPACE
cp -r package.json $WORKSPACE
cp -r Dockerfile $WORKSPACE

cd $WORKSPACE

#build docker container
sudo docker build -t nodejs-less-server .

#tag it.
sudo docker tag -f nodejs-less-server 359893553251.dkr.ecr.us-east-1.amazonaws.com/nodejsless:0003

sudo docker push 359893553251.dkr.ecr.us-east-1.amazonaws.com/nodejsless

exit 0