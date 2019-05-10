#!/bin/sh

PROJECT=`node -p "require('./package.json').name"`
egg-scripts start --title=$PROJECT
