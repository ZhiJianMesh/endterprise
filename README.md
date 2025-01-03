# 至简网格服务仓库
至简网格致力于为中小企业提供各类边缘云上服务。
将服务部署在企业自己的私有服务器上，而服务却可以全网访问。
即使使用一部旧安卓机，也可以实现私有云部署，只要会下载安装手机应用，就会安装您自己的云服务。

#### 介绍
此库存放至简网格为中小企业提供的各种服务的源码，以及相应的发布版本。
至简网格致力于以下四个方面，试图简化中小企业服务的应用、开发、维护成本：

1.使用方便，且极大降低部署运行成本：
企业维持独立的IT开发、运维团队，成本极其高昂，使用至简网格，可以像使用普通手机应用一样安装、设置复杂的企业应用；
一部旧安卓手机即可运行服务侧程序，当然也可以在PC上运行，在阿里、华为等云上分布式部署也毫无障碍，甚至可以跨AZ多活、跨Region备份；
端侧程序可以运行在安卓/鸿蒙、Windows系统上。

2.减少代码量：
代码即成本，服务的发布包大多不足100K，基础服务，比如工作流、配置、定时任务等，已内置在发布包中，极大减少开发工作量。
比如，极简CRM业务逻辑与界面实现代码各三千来行，总共七千来行，
而它的功能却并不简陋，实现了客户、联系人、订单、服务、回款，以及简易的月度/年度报表等一系列功能，
甚至内置了工作流，工作可以流程化管理与数据按流程授权。

3.解决个性化定制问题：
超过95%业务代码是json配置，以及极少的js代码片段即可实现；
界面部分基于vue+quasar实现，容易理解与定制；所有业务代码都以APL协议开源，可以自由定制修改，无法律风险。

4.高可靠、高安全性：
至简网格按大型互联网企业的可靠性、安全性设计；
提供每日数据远程加密备份，使得在地震、火灾等极端情况下，最多丢失一天数据；
在保证易用性的前提下，对数据存储、传输中的安全性做了周密的设计，对数据库字段的加密，可以实现定期自动更换密钥。

更多信息，请访问 http://www.zhijian.net.cn
网站中有服务端、客户端的使用指南与服务开发指导。

#### 软件架构
本系列软件服务侧技术网格化思路实现，服务间通讯基于https协议；端云之间使用https协议，将可靠性、安全性内置于底层。
端侧采用hybrid思路，用网页开发交互界面，简化开发难度；界面部分在安装时即已下载至本地，使用体验与原生实现并无差异。


#### 安装教程
服务侧安装：
1.  对于小微企业、个体户，推荐使用安卓版本，与普通安卓应用一样安装设置，如需独立部署，请联系我们；
2.  服务程序安装后，打开其中的应用市场中就可以下载所需的服务；
3.  在服务程序的首页点击红色按钮，就启动了服务器；
4.  开通数据云端备份功能，数据每天自动备份一次；
5.  提供独立外网IP，或使用IPv6+UPnP实现外网穿透，即可以全球访问。

端侧安装：
下载端侧应用程序安装即可，当前已实现安卓、PC版本；


#### 参与贡献

使用至简网格，并提出建议或新的需求，就是在帮助我们。
如果您有余力，欢迎Fork修改、发布您自己的服务，方便自己的同时也在帮助别人。
