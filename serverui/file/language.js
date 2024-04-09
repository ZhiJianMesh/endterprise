export default {
en:{
  ok:"OK",
  cancel:"Cancel",
  app_name:"Server Manager"
},
cn:{
  ok:"确定",
  cancel:"取消",
  close:"关闭",
  app_name:"服务管理",
  home:"服务器",
  license:"许可协议",
  settings:"设置",
  market:"应用市场",
  failToCall:"调用失败",
  cidCantBe0:"公司ID不能为0，请在“设置-公司信息”中设置",
  seperator:' ',
       
  address:"地址",
  creditCode:"统一信用码",
  creditCodePls:"请输入18位正确的统一信用码!",
  companyName:"公司名称",
  companyId:"公司ID",
  accessCode:"接入码",
  pwd:"密码",
  cfmPwd:"确认密码",
  verifyCode:"验证码",
  invalidCfmPwd:"确认密码必须与密码相同",


  advanced:"高级服务",

  backup:"数据备份",
  remoteTest:"调测设置",
  baseSettings:"基本设置",
  nwSettings:"网络接入",
  debug:"调测助手",
  uploadLogs:"上传日志",
  faultreport:"故障上报",
  backupNow:"立即备份",
  restore:"恢复数据",
  accessToken:"访问令牌",
  neverBackup:"尚无备份",
  startup:"启用",
  shutdown:'停用',
  state:"状态",
  backupTime:"最近备份时间",
  backupAt:"每日备份时间点",
  buckets:"备份站点",
  notStart:"未启用",
  running:"已启用",
  ownWan:"自有外网IP",
  bridgeWan:"网桥代理",
  pubGwIp:"公网IP",
  failToOpenPort:"启动外网映射失败！",
  
  locServices:"已安装应用",

  configs:"配置",
  refresh:"刷新",
  logo:"公司图标",

  name:"名称",
  save:"保存",
  register:"注册",
  login:"登录",
  reRegister:"重注册/登录",
  search:"搜索",
  day:"天",
  hour:"时",
  minute:"分",
  logDownloadable:"日志可下载",
  logLevel:"日志级别",
  failToCall:"调用失败",
  alert:"提示",
  errMsgs:{
    '10001':"验证码错误",
    '2000':"信用码已存在",
    'unknown':"未知错误"
  },
  invalidImg:"请选择有效的图片文件",
  needBuckets:"至少需要选择一个备份点",
  needWanIp:"需要填写一个公网IP",
  invalidExtIP:"不是正确的公网地址",
  dontSet:"不设置",
  backupAlert:"<div>每次数据备份将占用一次备份机会。</div><p>请确认是否继续？</p>",
  backupSuccess:"数据已成功备份。",
  restoreSuccess:"已成功恢复数据，请重新启动服务使数据生效。",
  restoreAlert:"<div>恢复数据会首先停止服务器，并使用备份数据覆盖本地数据库，自上个备份时间点到当前时间产生的数据会丢失。</div><p>请确认是否继续？</p>",
  succeedToConnect:"可以从外网访问",
  failToConnect:"不可以从外网访问",
  serverNotStart:"本服务器尚未启动，无法执行此操作",
  mkt:{
    install:"安装",
    waitting:"执行中...",
    update:"更新",
    unInstall:"卸载",
    cfmUpdate:"更新服务",
    cfmInstall:"安装服务",
    cfmUninstall:"卸载服务",
	successToInstall:"安装成功",
	successToUpdate:"更新成功",
	successToUnInstall:"卸载成功",
    displayName:"中文名",
    author:"作者",
    updateAt:"更新于",
    author:"作者",
    version:"版本",
  },
  licenseContent:`<p style="text-indent:2em;">至简网格为信息化、自动化提供端云结合的开发框架。</p>
<p style="text-indent:2em;">企业可将服务部署在自己的私有服务器上，服务可以全网访问。</p>
<p style="text-indent:2em;">即使用一部旧安卓手机，也可以实现私有云部署，只要会下载安装手机应用，就会安装您自己的云服务器。</p>
<p style="text-indent:2em;">至简网格具有简单、开源免费、安全可靠、易扩展、易定制等特点，从以下四个方面的改进系统，尽力简化企业应用的开发、维护与运维工作，以极低成本，甚至零成本实现移动化信息化办公。</p>
<p style="text-indent:2em;">1）<span class="text-weight-bold">部署灵活，极大降低部署运行成本：</span>企业维持独立的IT开发、运维团队，成本极其高昂，使用至简网格，可以像使用普通手机应用一样安装、使用复杂的企业应用；一部旧安卓手机即可运行服务侧程序，当然也可以在PC上运行，在阿里云、华为云等云上分布式部署也毫无障碍，甚至可以跨AZ多活、跨Region备份； 端侧程序可以运行在安卓/鸿蒙、Windows系统上。</p>
<p style="text-indent:2em;">2）<span class="text-weight-bold">解决个性化定制问题：</span>超过95%业务代码是json配置，以及极少的js代码片段；界面部分基于vue+quasar实现，容易理解与定制，且所有业务代码都以APL协议开源，可以自由定制修改。</p>
<p style="text-indent:2em;">3）<span class="text-weight-bold">减少代码量：</span>代码即成本，服务的发布包大多不足100K。比如，极简CRM业务逻辑与界面各三千来行，总共七千来行，而它的功能却并不简陋，实现了客户、联系人、订单、服务、回款等一系列功能，以及简易的月度/年度报表，甚至内置了工作流，可以实现流程化管理，在流程中实现数据授权。</p>
<p style="text-indent:2em;">4）<span class="text-weight-bold">可靠性、安全性提升：</span>提供每日数据远程加密备份，即使在地震、火灾等极端情况下，最多丢失一天数据；在保证易用性的前提下，对数据存储、传输中的安全性做了周密的设计。</p>
<p style="text-indent:2em;">至简网格是一系列开源软件的集合，提供开源免费的业务功能，业务代码以APL协议开源，您可以使用、修改、分发在gitee、gitcode等平台开源的所有业务实现。</p>
<p style="text-indent:2em;" class="text-weight-bold">用户可以自由选择是否使用本产品提供的软件。如果用户下载、安装、使用本产品中所提供的软件，即表明用户信任该软件作者，软件作者对于在任何情况下使用本产品中提供的软件时，可能对用户自己或他人造成的任何形式的损失和伤害不承担责任。</p>
<p style="text-indent:2em;">任何单位或个人认为通过本产品提供的软件可能涉嫌侵犯其合法权益，应该及时向至简网格书面反馈，并提供身份证明、权属证明及详细侵权情况证明，至简网格在收到上述法律文件后，将会尽快移除被控侵权软件。</p>
<p style="text-indent:2em;">因本产品引起的或与本产品有关的任何争议，各方应友好协商解决；协商不成的情况下，任何一方均可将有关争议提交至合适的仲裁委员会，并按照其届时有效的仲裁规则仲裁；仲裁裁决是终局的，对各方均有约束力。</p>
`
}
};
