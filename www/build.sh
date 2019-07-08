#!/bin/bash

# Package template
aws s3 cp --profile demo ./images s3://micharizdemo/ssmparam-dynamic-config/images --recursive

