# Demo - Parameter Store Change Propagation to ECS

This repo contains source for a demo that shows how Cloudwatch Events can
be used to propagate Parameter Store changes to ECS Containers running in
a private subnet.

# Pre-requisites

To install this demo you will need
- Docker to create the docker images
- access to an AWS account, including Cloudformation, ECR, ECS
- a public bucket to host images for web site

# Installation

The installation process comprises the following steps
- Build docker images and register with ECR
- Copy graphic images to public S3 bucket
- Build CloudFormation stack

## Build docker image for proxy


## Build docker image for Greeting service

