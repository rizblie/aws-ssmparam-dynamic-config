#!/bin/bash

aws cloudformation deploy --template-file ./packaged-Root.yaml --capabilities CAPABILITY_IAM --profile demo --stack-name $1
