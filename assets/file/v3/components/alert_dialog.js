//告警窗口组件,component-alert-dialog
export default {
data() {return {
    alertDlg:false,
    message:'',
    errors:{
    '100':"内部错误",
    '101':"网络请求失败",
    '102':"请求令牌错误",
    '103':"请求为空",
    '104':"数据库异常",
    '105':"回话异常",
    '106':"服务不存在",
    '107':"系统繁忙",
    '108':"请求超时",
    '109':"不支持所需的功能",
    '110': "接口不存在",
    '111':"没有相应的权限",
    '112':"找不到可以使用的服务节点",
    '150':"未知错误",
    '2000':"数据已存在",
    '2001':"数据不存在",
    '3000':"接口错误",
    '3001':"请求消息体错误",
    '3002':"版本不匹配",
    '3003':"数据状态不正确",
    '4000':"请求参数错误",
    '5000':"服务异常",
    '5001':"服务状态异常",
    'unknown':"未知错误"
  }
}},
props: {
    errMsgs:{type:Object,default:{}},
    title:{type:String,default:"警告"},
    close:{type:String,default:"关闭"}
},
created(){
    for(var c in this.errMsgs){
        this.errors[c]=this.errMsgs[c];
    }
},
methods:{
show(msg) {
    this.message=msg;
    this.alertDlg=true;
},
fmtErr(code,info){
    var err=this.errors[''+code];
    if(!err){
        if(code>=4000&&code<5000) {
            err=this.errors['4000'];
        } else if(code>=5000){
            err=this.errors['5000']
        } else {
            err=this.errors['unknown'];
        }
    }
    return err + ":" + code + "->" + info;
},
showErr(code,info) {
    this.show(this.fmtErr(code, info));
}
},
template: `
<q-dialog v-model="alertDlg">
  <q-card>
    <q-card-section><div class="text-h6">{{title}}</div></q-card-section>
    <q-card-section class="q-pt-none">{{message}}</q-card-section>
    <q-card-actions align="right" class="q-pr-md">
     <q-btn flat :label="close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}