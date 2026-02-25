#!/bin/bash
set -e

NAME="albumbeam"
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
OUT="${NAME}-${VERSION}.xpi"

zip -r "$OUT" manifest.json content.js popup.js popup.html background.js icons/

echo "Created: $OUT"
