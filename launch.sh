#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Load NVM and Node environment
export PATH="/home/cyber/.config/nvm/versions/node/v22.23.2/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
if [ -d "$HOME/.config/nvm" ]; then
    export NVM_DIR="$HOME/.config/nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Check if node server is running on port 5000
NODE_BIN=$(command -v node || echo "/home/cyber/.config/nvm/versions/node/v22.23.2/bin/node")
PID=$(lsof -ti :5000 2>/dev/null)
if [ -z "$PID" ]; then
    nohup "$NODE_BIN" server/server.js > "$DIR/server.log" 2>&1 &
    sleep 2
fi

# Launch in user default browser
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5000" >/dev/null 2>&1 &
elif command -v google-chrome >/dev/null 2>&1; then
    google-chrome "http://localhost:5000" >/dev/null 2>&1 &
elif command -v firefox >/dev/null 2>&1; then
    firefox "http://localhost:5000" >/dev/null 2>&1 &
fi
