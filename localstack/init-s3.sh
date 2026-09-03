#!/bin/sh
set -eu

BUCKET_NAME="trini-products-local"

awslocal s3api create-bucket --bucket "$BUCKET_NAME" >/dev/null 2>&1 || true
awslocal s3api put-bucket-acl --bucket "$BUCKET_NAME" --acl public-read >/dev/null 2>&1 || true

echo "[localstack] S3 bucket ready: $BUCKET_NAME"
