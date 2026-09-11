#!/usr/bin/env bash
# Stop 1X-BET Server
PID=$(lsof -ti :5000 2>/dev/null)
if [ -n "$PID" ]; then
    kill -9 $PID 2>/dev/null
    echo "1X-BET Server has been stopped."
else
    echo "1X-BET Server is not running."
fi
