#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查MySQL是否运行
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}[Error] MySQL not detected. Please install MySQL 8.0 or above first.${NC}"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}[Error] Node.js not detected. Please install Node.js 18 or above first${NC}"
    exit 1
fi

echo -e "${GREEN}[Success] Environment check passed${NC}"
echo ""

# 启动后端
echo -e "${YELLOW}[Info] Starting the backend service...${NC}"
cd backend

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "[Info] Installing backend dependencies..."
    npm install
fi

# 启动后端（后台运行）
npm start &
BACKEND_PID=$!
echo -e "${GREEN}[Success] The backend service has been started (PID: $BACKEND_PID)${NC}"
echo ""

cd ..

# 启动前端
echo -e "${YELLOW}[Info] Starting the frontend service...${NC}"
cd frontend

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "[Info] Installing frontend dependencies..."
    npm install
fi

# 启动前端（后台运行）
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}[Success] The frontend service has been started (PID: $FRONTEND_PID)${NC}"
echo ""

cd ..

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '[Info] Service has been stopped'; exit 0" INT
wait
