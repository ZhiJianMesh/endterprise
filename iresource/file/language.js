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
  app_name:"资源管理",
  ok:"确定",
  cancel:"取消",
  close:"关闭",
  modify:"修改",
  remove:"删除",
  add:"增加",
  save:"保存",
  search:"搜索",
  errMsgs:{
    '6001':'存在SKU关联了供应商',
    '6002':'供应商联系人不为空',
    '6003':'仓库不为空',
    '6004':'入库清单不为空，不可以删除',
    '6005':'出库单不存在，或未启动',
    '6006':'要发货的资产已添加，或不在发货列表中',
    '6007':'入库资源与申请的资源不一致',
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