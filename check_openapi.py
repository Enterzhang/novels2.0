import requests
import json

# 获取OpenAPI文档
url = "http://localhost:8000/openapi.json"
print(f"获取OpenAPI文档: {url}")

try:
    response = requests.get(url)
    print(f"响应状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        # 打印API路径
        print("\nAPI路径:")
        for path, methods in data.get("paths", {}).items():
            print(f"  {path} - 方法: {', '.join(methods.keys())}")
            
        # 检查是否有用户路由
        user_paths = [path for path in data.get("paths", {}) if "users" in path]
        if user_paths:
            print("\n找到用户路由:")
            for path in user_paths:
                print(f"  {path}")
        else:
            print("\n未找到用户路由!")
            
except Exception as e:
    print(f"请求错误: {str(e)}") 