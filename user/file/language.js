export default {
en:{
app_name:"groups management",
failToCall:"Failed",
close:"Close",
ok:"OK"
},
zh:{
app_name:"帐号管理",
authorize:"服务授权",
failToCall:"调用失败",
close:"关闭",
ok:"确定",
setPower:"员工授权",
newUser:"新增用户",
mobilePls:"请输入11位正确的手机号！",
emailPls:"请输入正确的邮箱地址！",
save:"保存",
tmplDef:'扩展字段定义',

user:{
    status:"激活/禁用", 
    account:"帐号",
    email:"邮箱",
    role:"角色",
    power:"服务权限",
    pwd:"密码",
    pwdReseted:"密码已重置，请记住以下密码（区分大小写）:",
    resetPwd:"重置密码",
    nickName:"昵称",
    mobile:"电话",
    loginAt:"登录时间",
    createAt:"创建时间",
    birthday:"生日",
    sex:"性别",
    type:"类别",
    powerNull:"无",
    serviceExt:"服务扩展信息",
    statusTypes:{N:"正常",L:"锁定",R:"删除"},
	sexTitles:{"M":"男","F":"女","U":"未知"},
    typeTitles:{"I":"内部员工","O":"外部人员","D":"设备"},
	sexOpts:[{label:"男",value:"M"},{label:"女",value:"F"}],
	typeOpts:[{label:"内部员工",value:"I"},{label:"外部人员",value:"O"},{label:"设备",value:"D"}]
},
power:{
    service:"服务名",
    role:"角色",
    pubAccess:"公网访问",
    ext:"扩展权限"
},
cfgTags:{
    changeNotSaved:"修改的内容尚未保存，请确认是否放弃修改？",
    needAz:'字段必须是a-z、A-Z字符的组合',
    segTypes:{'s':'文字','n':"数值",'d':'日期'},
    asMap:'模板格式',
    segKey:'字段',
    segName:"名称",
    segType:"类型",
    val:'配置内容'
},
errMsgs:{
  'unknown':"未知错误",
}
}
}