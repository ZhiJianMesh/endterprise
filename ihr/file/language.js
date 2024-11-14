export default {
en:{
  app_name:"HR",
  ok:"OK",
  cancel:"Cancel",
  modify:"Modify",
  remove:"Delete",
  add:"Add",
  save:"Save",
  search:"Search"
},
cn:{
  app_name:"人力资源",
  ok:"确定",
  cancel:"取消",
  close:"关闭",
  modify:"修改",
  remove:"删除",
  add:"增加",
  save:"保存",
  search:"搜索",
  age:"岁",

  sex:{
    M:"先生",
    F:"女士",
    O:"未知"
  },
  edu:{
    E0:"无",
    E1:"小学",
    E2:"初中",
    E3:"高中/中专",
    E4:"大专",
    E5:"本科",
    E6:"研究生",
    E7:"博士生",
    E8:"博士后"
  },
  salTp:{
    SALARY:'工资',
    SUBSIDY:'补贴',
    EXPENSE:'报销',
    BONUS:'奖金',
    SHARE:'分红',
    TAX:'个人所得税',
    SECURITY0:'劳动保障(个人)',
    SECURITY1:'劳动保障(公司)',
    OLD:'养老保险',
    MEDICARE:'医疗保险',
    JOB:'失业保险',
    INJURY:'工伤保险',
    PCREATION:'生育保险',
    HOUSE:'住房公积金'
  },
  evtType:{
    JOIN:"入职",
    LEAV:"离职",
    ADDS:"加薪",
    SUBS:"减薪",
    FINE:"罚款",
    WARN:"警告",
    ERR:"记过",
    DIS:"开除",
    PRJ:"项目经历",
    LAUD:"表扬",
    OTH:"其他"
  },
  pool:{
    title:"人才库",
    name:"姓名",
    sex:"性别",
    quali:"任职等级",
    birth:"生日",
    expSalary:"期望的工资",
    maxEdu:"最高学历",
    firstEdu:"第一学历",
    phone:"联系电话",
    email:"邮箱",
    addr:"地址",
    cmt:"备注",
    contact:"联系方式",
    ability:"能力"
  },
  employee:{
    title:"员工"
  },
  grp:{
    title:"部门",
    
  },
  salary:{
    title:"发薪"
  },
  config:{
    title:"HR配置"
  },
  errMsgs:{
    '6001':'请假时间必须是在工作日',
    '6002':'无权执行此操作',
    '6003':'起止时间不正确',
    '6004':'年休假必须请整天',
    '6005':'福利假不能打散请',
    '6006':'没有足够的年休假',
    '6007':'没有足够的福利假',
    '6008':'没有足够的休假指标',
    '6104':'不可能在工作日整天加班',
    '6105':'不能在工作时段加班',
    '6106':'请假时段必须为整小时',
    '6107':'未填工时，或工时未确认',
    '6200':'超过考勤修改次数上限',
    'unknown':'未知错误'
  },
  date2str:function(dt) {
    var s=dt.getFullYear()+'/';
    var v=dt.getMonth()+1;
    if(v<10) {
        s+='0';
    }
    s+=v+'/';
    v=dt.getDate();
    if(v<10) {
        s+='0';
    }
    s+=v;
    return s;
  },
  sta2icon:function(s){
    if(s==0) {
      return 'star_border';
    }
    if(s==100) {
      return 'star';
    }
    return 'star_half';
  }
}
};