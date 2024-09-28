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
  app_name:"人力资源管理",
  ok:"确定",
  cancel:"取消",
  close:"关闭",
  modify:"修改",
  remove:"删除",
  add:"增加",
  save:"保存",
  search:"搜索",
  errMsgs:{
    '6001':'请假时间必须是在工作日',
    '6002':'无权执行此操作',
    '6003':'起止时间不正确',
    '6004':'年休假必须请整天',
    '6005':'福利假不能打散请',
    '6006':'没有足够的年休假',
    '6007':'没有足够的福利假',
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