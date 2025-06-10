import subprocess
import time
import os
import sys
import signal
import threading
import uvicorn

def run_powershell_script(script_path, command):
    """运行PowerShell脚本中的特定命令"""
    print(f"执行PowerShell脚本: {script_path} 命令: {command}")
    
    # 构建PowerShell命令
    ps_command = f'powershell -File "{script_path}" -Command {command}'
    
    # 执行PowerShell命令
    process = subprocess.Popen(ps_command, shell=True)
    return process

def start_backend():
    """启动后端服务"""
    print("正在启动后端服务...")
    backend_process = subprocess.Popen("uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload", shell=True)
    return backend_process

def start_frontend():
    """启动前端服务"""
    print("正在启动前端服务...")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))  # 确保在项目根目录
    frontend_process = subprocess.Popen("npm run dev", shell=True)
    return frontend_process

def handle_exit(frontend_process, mongodb_process, backend_process):
    """处理程序退出，确保所有进程都被终止"""
    def signal_handler(sig, frame):
        print("\n正在关闭所有服务...")
        
        # 关闭前端进程
        if frontend_process:
            frontend_process.terminate()
            try:
                frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                frontend_process.kill()
        
        # 关闭MongoDB集群
        if mongodb_process:
            # 调用停止MongoDB集群的脚本
            stop_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "System", "mongodb_cluster.ps1")
            subprocess.run(f'powershell -File "{stop_script}" -Command "Stop-Cluster"', shell=True)
        
        # 关闭后端服务
        if backend_process:
            backend_process.terminate()
            try:
                backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                backend_process.kill()
        
        print("所有服务已关闭，程序退出")
        sys.exit(0)
    
    # 注册信号处理程序
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

def main():
    """主函数，启动整个应用"""
    print("=== 一键启动Novel2.0项目 ===")
    
    # 1. 启动MongoDB集群
    mongodb_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "System", "mongodb_cluster.ps1")
    mongodb_process = run_powershell_script(mongodb_script, "Start-Cluster")
    print("MongoDB集群启动中，等待30秒让集群初始化...")
    time.sleep(50)  # 等待MongoDB集群完全启动
    
    # 2. 启动后端服务
    backend_process = start_backend()
    print("后端服务启动中，等待10秒让API服务初始化...")
    time.sleep(10)  # 等待后端服务完全启动
    
    # 3. 启动前端服务
    frontend_process = start_frontend()
    print("前端服务启动中...")
    
    # 4. 设置退出处理
    handle_exit(frontend_process, mongodb_process, backend_process)
    
    print("\n=== 所有服务已启动 ===")
    print("- 前端访问地址: http://localhost:5173")
    print("- 后端API地址: http://localhost:8000")
    print("- API文档地址: http://localhost:8000/docs")
    print("\n按Ctrl+C可以一键关闭所有服务")
    
    # 保持主程序运行
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main() 