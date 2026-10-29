---
title: Arch Linux Wi-Fi 断网问题解决方案
published: 2026-10-28
description: "Wi-Fi 断网、NetworkManager 缺失又无法在线安装时，用 pacman 本地缓存包离线恢复的过程。"
tags: ["Arch Linux", "NetworkManager", "Wi-Fi"]
category: Linux
draft: false
---

## 问题概述

我在 Arch Linux（Wayland 桌面）上遇到过一次 Wi-Fi 完全无法连接的问题。最开始我以为是无线网卡故障，但实际排查发现：**无线网卡仍能被系统识别，真正的障碍是 NetworkManager 服务缺失，系统又处于断网状态，无法通过正常在线安装方式补回。**

**最终结果：Wi-Fi 问题已经解决。** 下面是这次故障实际找到的关键线索，以及针对这些线索的恢复方法，方便以后重装、迁移或再次出现相同症状时直接照做。

## 1. 故障表现

尝试启动网络管理服务：

```
sudo systemctl enable --now NetworkManager
```

报错：

```
Unit NetworkManager.service does not exist
```

尝试安装：

```
sudo pacman -S networkmanager
```

报错：

```
error: target not found: networkmanager
```

同时，`iwctl`、`wpa_supplicant` 等常用无线连接工具在当时的环境中也没有找到，所以无法用它们临时接入 Wi-Fi。`pacman` 的 `target not found` 也提示本地软件包数据库或仓库配置可能存在问题，不等于官方仓库没有这个包。

## 2. 确认网卡并没有消失

我用以下命令查看了网卡：

```
ip -br link
ip -br addr
```

识别到的无线网卡是：

```
wlp0s20f3
```

网卡原先显示 `DOWN`。执行：

```
sudo ip link set wlp0s20f3 up
```

后可以看到标志中含有 `UP`，但仍显示 `NO-CARRIER`，也没有获取到 Wi-Fi IP。

这里的区别是：**网卡启用 ≠ 已连接无线网络。** 仅执行 `ip link set ... up` 并不会自动扫描 Wi-Fi、输入密码或获得地址。

## 3. 关键突破：发现 Pacman 的本地缓存安装包

由于当时没有网络，我没有继续反复使用在线安装，而是检查了 Pacman 的包缓存：

```
ls /var/cache/pacman/pkg/networkmanager*
```

查到了本地安装包：

```
/var/cache/pacman/pkg/networkmanager-1.58.1-2-x86_64.pkg.tar.zst
```

## 这是解决问题的关键：安装包其实还保留在本机，不需要先恢复互联网才能安装它。

## 4. 离线恢复 NetworkManager

用已经找到的缓存包进行安装：

```
sudo pacman -U /var/cache/pacman/pkg/networkmanager-1.58.1-2-x86_64.pkg.tar.zst
```

`pacman -U` 是 Arch Linux 正常的本地软件包安装方式。若提示缺少依赖，要继续查找 `/var/cache/pacman/pkg/` 中对应的依赖缓存，不能用 `--nodeps` 硬装。

安装成功后，启动并设置开机自动启动：

```
sudo systemctl enable --now NetworkManager
```

确认服务：

```
systemctl is-active NetworkManager
nmcli device status
```

预期服务状态是 `active`，无线接口可以由 NetworkManager 管理。

## 5. 重新连接 Wi-Fi

使用系统内的终端界面：

```
nmtui
```

进入 **Activate a connection（激活连接）**，选中自己的 Wi-Fi，输入密码并连接。也可以通过 KDE Plasma 的网络菜单连接。

确认获取地址和网络连通：

```
ip -br addr
ip route
ping -c 3 1.1.1.1
ping -c 3 archlinux.org
```

第一条检查无线网卡是否拿到 IP；第二条检查默认路由；第三条检查外网 IP 连通；最后一条同时检查 DNS 解析。到这就彻底恢复了我的网络了。
