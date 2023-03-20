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

set -e

#define build parameters
WORKSPACE=/tmp/nodejsless
DATE=`date +%H%M-%d%m%Y`
VERSION="0062"

#clean old files if any
rm -rf $WORKSPACE

mkdir -p $WORKSPACE

cp -r compiler.mjs $WORKSPACE
cp -r worker.mjs $WORKSPACE
cp -r server.mjs $WORKSPACE
cp -r undici-file-manager.mjs $WORKSPACE
cp -r package.json $WORKSPACE
cp -r Dockerfile $WORKSPACE

cd $WORKSPACE

#build docker container
run_as_sudo docker build -t nodejs-less-server .

export AWS_PROFILE=kademi-prod
# aws ecr get-login-password --region=us-east-1 | docker login --username AWS --password-stdin 359893553251.dkr.ecr.us-east-1.amazonaws.com

#tag it.
run_as_sudo docker tag nodejs-less-server 359893553251.dkr.ecr.us-east-1.amazonaws.com/nodejsless:$VERSION

run_as_sudo docker push 359893553251.dkr.ecr.us-east-1.amazonaws.com/nodejsless:$VERSION

rm -rf $WORKSPACE

exit 0
