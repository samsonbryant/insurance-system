kill -9 $(lsof -t -i:3000) 2>/dev/null; node server/index.js
