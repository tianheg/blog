#!/usr/bin/env bash

if [[ -d "public" && -d "resources" ]]; then
  echo "Directories exist"
  trash public && trash resources && hugo server
else
  echo "Directories do not exist"
fi
