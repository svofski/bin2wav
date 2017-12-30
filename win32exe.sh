#!/usr/bin/env sh
mv bin2wav.js bin2wav.js.orig
sed 1d bin2wav.js.orig >bin2wav.js
nexe -t win32-x86-8.6.0 -o bin2wav.exe
mv bin2wav.js.orig bin2wav.js
