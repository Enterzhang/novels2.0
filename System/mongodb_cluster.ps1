# Set MongoDB paths
$MONGODB_BIN = "D:\mongodb\mongodb1\bin"
$RS0_PATH = "D:\mongodb\shard\rs0"
$RS1_PATH = "D:\mongodb\shard\rs1"
$CONFIG_PATH = "D:\mongodb\shard\config"

function Start-Cluster {
    Write-Host "Starting MongoDB Sharded Cluster..." -ForegroundColor Green
    
    Write-Host "Starting RS0 nodes..." -ForegroundColor Yellow
    Start-Process -FilePath "$MONGODB_BIN\mongod" -ArgumentList "--dbpath $RS0_PATH\db1 --replSet rs0 --port 1000 --shardsvr" -WindowStyle Normal
    Start-Process -FilePath "$MONGODB_BIN\mongod" -ArgumentList "--dbpath $RS0_PATH\db2 --replSet rs0 --port 1001 --shardsvr" -WindowStyle Normal
    Start-Process -FilePath "$MONGODB_BIN\mongod" -ArgumentList "--dbpath $RS0_PATH\db3 --replSet rs0 --port 1002 --shardsvr" -WindowStyle Normal

    Write-Host "Starting RS1 nodes..." -ForegroundColor Yellow
    Start-Process -FilePath "$MONGODB_BIN\mongod" -ArgumentList "--dbpath $RS1_PATH\db1 --replSet rs1 --port 2000 --shardsvr" -WindowStyle Normal
    Start-Process -FilePath "$MONGODB_BIN\mongod" -ArgumentList "--dbpath $RS1_PATH\db2 --replSet rs1 --port 2001 --shardsvr" -WindowStyle Normal
    Start-Process -FilePath "$MONGODB_BIN\mongod" -ArgumentList "--dbpath $RS1_PATH\db3 --replSet rs1 --port 2002 --shardsvr" -WindowStyle Normal

    Write-Host "Starting Config Servers..." -ForegroundColor Yellow
    Start-Process -FilePath "$MONGODB_BIN\mongod" -ArgumentList "--dbpath $CONFIG_PATH\config0 --replSet config --port 3000 --configsvr" -WindowStyle Normal
    Start-Process -FilePath "$MONGODB_BIN\mongod" -ArgumentList "--dbpath $CONFIG_PATH\config1 --replSet config --port 3001 --configsvr" -WindowStyle Normal

    Write-Host "Starting Mongos..." -ForegroundColor Yellow
    Start-Process -FilePath "$MONGODB_BIN\mongos" -ArgumentList "--configdb config/localhost:3000,localhost:3001 --port 4000" -WindowStyle Normal

    Write-Host "Cluster started successfully!" -ForegroundColor Green
}

function Stop-Cluster {
    Write-Host "Stopping MongoDB Sharded Cluster..." -ForegroundColor Yellow
    Get-Process | Where-Object { $_.MainWindowTitle -like "MongoDB*" } | Stop-Process -Force
    Write-Host "Cluster stopped successfully!" -ForegroundColor Green
    Write-Host "`nPress any key to return to menu..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Get-NodeStatus {
    param (
        [string]$port,
        [string]$replSet
    )
    
    $result = & "$MONGODB_BIN\mongo" --port $port --eval "rs.status()" --quiet
    $primary = $result | Select-String -Pattern '"stateStr"\s*:\s*"PRIMARY"'
    $secondaries = $result | Select-String -Pattern '"stateStr"\s*:\s*"SECONDARY"'
    $health = $result | Select-String -Pattern '"health"\s*:\s*1'
    
    return @{
        ReplSet = $replSet
        Primary = if ($primary) { "Running" } else { "Not Found" }
        Secondaries = if ($secondaries) { $secondaries.Count } else { 0 }
        Health = if ($health) { "Healthy" } else { "Unhealthy" }
    }
}

function Show-Summary {
    Write-Host "`n=== Cluster Status Summary ===" -ForegroundColor Green
    
    # Check RS0
    $rs0Status = Get-NodeStatus -port 1000 -replSet "RS0"
    Write-Host "`nRS0 Status:" -ForegroundColor Yellow
    Write-Host "  Primary: $($rs0Status.Primary)"
    Write-Host "  Secondaries: $($rs0Status.Secondaries)"
    Write-Host "  Health: $($rs0Status.Health)"
    
    # Check RS1
    $rs1Status = Get-NodeStatus -port 2000 -replSet "RS1"
    Write-Host "`nRS1 Status:" -ForegroundColor Yellow
    Write-Host "  Primary: $($rs1Status.Primary)"
    Write-Host "  Secondaries: $($rs1Status.Secondaries)"
    Write-Host "  Health: $($rs1Status.Health)"
    
    # Check Config Server
    $configStatus = Get-NodeStatus -port 3000 -replSet "Config"
    Write-Host "`nConfig Server Status:" -ForegroundColor Yellow
    Write-Host "  Primary: $($configStatus.Primary)"
    Write-Host "  Secondaries: $($configStatus.Secondaries)"
    Write-Host "  Health: $($configStatus.Health)"
    
    # Check Mongos
    $mongosStatus = & "$MONGODB_BIN\mongo" --port 4000 --eval "sh.status()" --quiet
    $balancerEnabled = $mongosStatus | Select-String -Pattern "Currently enabled:\s*yes"
    $balancerRunning = $mongosStatus | Select-String -Pattern "Currently running:\s*yes"
    
    Write-Host "`nMongos Status:" -ForegroundColor Yellow
    Write-Host "  Balancer Enabled: $(if ($balancerEnabled) { 'Yes' } else { 'No' })"
    Write-Host "  Balancer Running: $(if ($balancerRunning) { 'Yes' } else { 'No' })"
    
    # Overall Status
    $overallStatus = if ($rs0Status.Health -eq "Healthy" -and 
                        $rs1Status.Health -eq "Healthy" -and 
                        $configStatus.Health -eq "Healthy") {
        "Healthy"
    } else {
        "Unhealthy"
    }
    
    Write-Host "`nOverall Cluster Status: $overallStatus" -ForegroundColor $(if ($overallStatus -eq "Healthy") { "Green" } else { "Red" })
}

function Check-Status {
    Write-Host "Checking MongoDB Cluster Status..." -ForegroundColor Yellow
    
    Write-Host "`nRS0 Status:" -ForegroundColor Cyan
    & "$MONGODB_BIN\mongo" --port 1000 --eval "rs.status()"
    
    Write-Host "`nRS1 Status:" -ForegroundColor Cyan
    & "$MONGODB_BIN\mongo" --port 2000 --eval "rs.status()"
    
    Write-Host "`nConfig Server Status:" -ForegroundColor Cyan
    & "$MONGODB_BIN\mongo" --port 3000 --eval "rs.status()"
    
    Write-Host "`nSharding Status:" -ForegroundColor Cyan
    & "$MONGODB_BIN\mongo" --port 4000 --eval "sh.status()"
    
    # Show summary after detailed status
    Show-Summary
    
    Write-Host "`nPress any key to return to menu..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-Menu {
    Clear-Host
    Write-Host "MongoDB Sharded Cluster Management" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host "1. Start Cluster" -ForegroundColor White
    Write-Host "2. Stop Cluster" -ForegroundColor White
    Write-Host "3. Check Status" -ForegroundColor White
    Write-Host "4. Exit" -ForegroundColor White
    Write-Host "================================" -ForegroundColor Green
    
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" { 
            Start-Cluster
            Write-Host "`nPress any key to return to menu..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            Show-Menu
        }
        "2" { 
            Stop-Cluster
            Show-Menu
        }
        "3" { 
            Check-Status
            Show-Menu
        }
        "4" { exit }
        default {
            Write-Host "Invalid choice! Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-Menu
        }
    }
}

# Start the menu
Show-Menu