#!/bin/bash

# Check is user is in the Docker group
IS_DOCKER_USER=false

if id -nG | grep -qw "docker"; then
    IS_DOCKER_USER=true
fi

function run_as_sudo {
    if $IS_DOCKER_USER; then
        $@
    else
        sudo $@
    fi
}

# login to docker
run_as_sudo $(aws ecr get-login --no-include-email --region=us-east-1)

# Remove old images and containers
run_as_sudo docker rm `sudo docker ps -qa`
run_as_sudo docker rmi --force `sudo docker images -qa`

set -ex

#define build parameters
WORKSPACE=/tmp/nodejsless
DATE=`date +%H%M-%d%m%Y`

#clean old files if any
rm -rf $WORKSPACE

mkdir -p $WORKSPACE

cp -r compiler.js $WORKSPACE
cp -r worker.js $WORKSPACE
cp -r server.js $WORKSPACE
cp -r package.json $WORKSPACE
cp -r Dockerfile $WORKSPACE

cd $WORKSPACE

#build docker container
run_as_sudo docker build -t nodejs-less-server .

#tag it.
run_as_sudo docker tag nodejs-less-server 359893553251.dkr.ecr.us-east-1.amazonaws.com/nodejsless:0051

run_as_sudo docker push 359893553251.dkr.ecr.us-east-1.amazonaws.com/nodejsless

rm -rf $WORKSPACE

exit 0
