#!/usr/bin/env bash

# Exit on first error
set -euo pipefail

echo "Installing FFmpeg..."
# Update package lists
apt-get update -y
# Install ffmpeg
apt-get install -y ffmpeg

echo "Running npm install..."
npm install

