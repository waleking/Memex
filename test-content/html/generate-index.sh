#!/bin/bash
cd `dirname $0`
find . -name '*.html'| cut -d '/' -f2- > index.txt
