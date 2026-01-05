#!/bin/bash

# 2NODE 压力测试脚本
# 使用方法: ./stress-test.sh [并发数] [总请求数]

CONCURRENCY=${1:-10}
TOTAL=${2:-100}
BASE_URL="http://localhost:3000"

echo "🚀 2NODE 压力测试"
echo "================================"
echo "并发数: $CONCURRENCY"
echo "总请求数: $TOTAL"
echo "目标: $BASE_URL"
echo "================================"
echo ""

# 测试 1: 首页加载
echo "📊 测试 1: 首页 GET /"
echo "---"
hey -n $TOTAL -c $CONCURRENCY -m GET "$BASE_URL/" 2>/dev/null || {
  # 如果 hey 不可用，使用简单的 curl 循环
  echo "使用 curl 进行测试..."
  START=$(date +%s.%N)
  for i in $(seq 1 $TOTAL); do
    curl -s -o /dev/null -w "%{time_total}\n" "$BASE_URL/" &
    if [ $((i % CONCURRENCY)) -eq 0 ]; then wait; fi
  done
  wait
  END=$(date +%s.%N)
  echo "总耗时: $(echo "$END - $START" | bc) 秒"
}
echo ""

# 测试 2: API 端点
echo "📊 测试 2: API /api/workspaces"
echo "---"
hey -n $TOTAL -c $CONCURRENCY -m GET "$BASE_URL/api/workspaces" 2>/dev/null || {
  echo "使用 curl 进行测试..."
  START=$(date +%s.%N)
  for i in $(seq 1 $TOTAL); do
    curl -s -o /dev/null -w "%{time_total}\n" "$BASE_URL/api/workspaces" &
    if [ $((i % CONCURRENCY)) -eq 0 ]; then wait; fi
  done
  wait
  END=$(date +%s.%N)
  echo "总耗时: $(echo "$END - $START" | bc) 秒"
}
echo ""

# 测试 3: 静态资源
echo "📊 测试 3: 认证 API"
echo "---"
hey -n $TOTAL -c $CONCURRENCY -m GET "$BASE_URL/api/auth/session" 2>/dev/null || {
  echo "使用 curl 进行测试..."
  START=$(date +%s.%N)
  for i in $(seq 1 $TOTAL); do
    curl -s -o /dev/null -w "%{time_total}\n" "$BASE_URL/api/auth/session" &
    if [ $((i % CONCURRENCY)) -eq 0 ]; then wait; fi
  done
  wait
  END=$(date +%s.%N)
  echo "总耗时: $(echo "$END - $START" | bc) 秒"
}

echo ""
echo "✅ 压力测试完成！"
