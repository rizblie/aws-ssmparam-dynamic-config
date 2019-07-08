#!/bin/bash

# Package template
aws cloudformation package \
  --profile demo \
  --template-file ./Root.yaml \
  --s3-bucket micharizdemo-scratchbucket \
  --output-template-file packaged-Root.yaml
