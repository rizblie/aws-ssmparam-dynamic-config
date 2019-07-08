#!/bin/bash

REGISTRY='845041152230.dkr.ecr.eu-west-1.amazonaws.com/rizblie/greeting'
AWS_PROFILE=demo

docker build -t $REGISTRY .
login_cmd=$(aws ecr --profile $AWS_PROFILE get-login --no-include-email)
eval $login_cmd
docker push $REGISTRY
