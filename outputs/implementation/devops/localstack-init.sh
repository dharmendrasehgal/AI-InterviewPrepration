#!/bin/bash
set -e

echo "Initialising LocalStack S3 buckets..."

awslocal s3 mb s3://interview-prep-recordings-local --region us-east-1
awslocal s3 mb s3://interview-prep-assets-local     --region us-east-1

# Set lifecycle policy: auto-delete recordings after 90 days
awslocal s3api put-bucket-lifecycle-configuration \
  --bucket interview-prep-recordings-local \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "auto-delete-after-90-days",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "Expiration": {"Days": 90}
    }]
  }'

echo "S3 buckets ready:"
awslocal s3 ls
