# WVF WD - Windows System Proxy Manager
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("enable", "disable", "status")]
    [string]$Action,
    [string]$ProxyServer = "socks=127.0.0.1:1080"
)

$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"

switch ($Action) {
    "enable" {
        Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 1
        Set-ItemProperty -Path $regPath -Name ProxyServer -Value $ProxyServer
        Write-Host "✓ Системный прокси Windows включен: $ProxyServer" -ForegroundColor Magenta
    }
    "disable" {
        Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 0
        Write-Host "✓ Системный прокси Windows выключен" -ForegroundColor DarkGray
    }
    "status" {
        $enabled = (Get-ItemProperty -Path $regPath -Name ProxyEnable).ProxyEnable
        $server = (Get-ItemProperty -Path $regPath -Name ProxyServer -ErrorAction SilentlyContinue).ProxyServer
        Write-Host "Proxy Status: $(if ($enabled -eq 1) {'ВКЛ (' + $server + ')'} else {'ВЫКЛ'})" -ForegroundColor Cyan
    }
}
