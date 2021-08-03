# Koishi Bots

用于部署生产环境的 bot ，并集合已有的 koishi bot。

通过 gitignore 以及一些使用规则保护你的隐私信息，保证你的 bot 在开源的同时具备一定的信息安全。

集成 go-cqhttp ，方便部署运行你的机器人。在使用 go-cqhttp 的前提下再对目录进行控制，支持运行多个 gocq 服务。

# 如何使用

## 认识目录

* `.config` 储存你自己的 bot 的一些基础信息，例如 bot 的账号。

  该目录下的文件名应改为 `bot的名字.yml`

* `.env` 储存你自己的 bot 指定环境的隐私数据，例如密码以及 access token 等。

  该目录下的文件名应改为 `bot的名字.环境.yml`

* `go-cqhttp/.temp` 储存 go-cqhttp 的运行数据

  该目录下的指定 bot 名字的文件夹，就是你的 bot 的 go-cqhttp 运行数据。

## 认识指令

* `go-cqhttp` 运行指定环境下的 gocq 服务器，支持运行多个。默认运行环境为 windows，具体使用 --help 参数查看帮助信息
* `start:dev` 开发环境启动并带有自动重启，会合并 .env 下的带有 dev 关键词的配置
* `start:pro` 生产环境启动，会合并 .env 下的带有 pro 关键词的配置

## 编写你自己的配置文件

* 给你的 `bot` 想一个名字
* 在 `.config` 目录下创建自己的 `gocq bot` 可公布信息，比如账号配置信息
> 请不要将自己的隐私数据填放在该配置文件中
```yaml
# bot-name.yml
account:
  uin: bot 的账号
```
* 在 `.env` 目录下创建环境配置文件，例如下面的配置（该文件不会提交到你的版本仓库）。
```yaml
# bot-name.env-name.yml
account:
  password: 你的 bot 密码

servers:
  - ws:
      host: 127.0.0.1
      port: 18080
```
