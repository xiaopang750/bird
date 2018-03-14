### 纯前端渲染的项目deploy到测试机上，通过nginx访问

## 使用

1. npm install git+ssh://https://github.com/xiaopang750/bird.git -g -d

2. 进入你的project目录, 你的目录必须包含package.json且需要有name字段代表项目名称

3. 在项目目录下执行 bird ge 生成project nginx conf

```
server {
  listen <%= port %>;
  location / {
    try_files $uri /index.<%= port %>.html;
  }
  location ^~ /static/<%= projectName %> {
    root /home/data;
  }

  location /api1 {
    proxy_pass http://xxxx.com;
  }

  location ~.*\.(html)$ {
    add_header Cache-Control no-cache;
  }
}

模板是可以修改的，模板文件在~/.bird下，其中提供port和projectName两个变量名
port是nginx监听的端口，可以理解为不同的项目监听不同的端口号,比如ip:port1 对应A项目 ip:port2就对应B项目
projectName 可以用来存放build后的代码用于区分 比如 A项目存储在 /data/A B项目存储在 /data/B 用于区分不同项目的存放路径
有了这两个变量就可以按实际情况来修改nginx配置
```

4. 执行 bird deploy -p port 把本地打包后的代码同步到测试机 修改nginx配置重启nginx, ~/.bird/config.json中可以修改deploy配置
```
{
  "username": "root",
  "host": "192.168.1.1",
  "distDirName": "public本地要deploy的文件目录"
  "entryHtmlName": "index.html入口文件名称",
  "remoteDir": "/home/op/data/static 要存放的remote目录",
  "remoteNginxDir": "/etc/nginx/conf.d nginx配置目录"
}
```
