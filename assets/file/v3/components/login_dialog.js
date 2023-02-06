import AlertDialog from "/assets/v3/components/alert_dialog.js"
//一边输入地址，一边过滤地址的组件
export default {
data() {return {
    loginDlg:false,
    hidePwd:true,
    loginAcc:'',
    loginPwd:'',
    callback:null
}},
props: {
    label:{type:String,required:true, default:"登录"},
    account:{type:String,required:true, default:"账号"},
    pwd:{type:String,required:true, default:"密码"},
    userType:{type:String,required:true,default:"company"},
    login:{type:String,default:"登录"},
    close:{type:String,default:"关闭"},
    failToCall:{type:String,default:"调用失败"},
    cancel:{type:String,default:"取消"}
},
components:{
    "alert-dialog":AlertDialog
},
methods:{
actLogin() {
    var jsCbId=__regsiterCallback(resp => {
        if(resp.code!=0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.loginAcc='';
        this.loginPwd='';
        this.loginDlg=false;
        if(this.callback&&typeof(this.callback)=='function'){
            this.callback(resp);
        }
        this.loginDlg=false;
    });
    Http.login(this.loginAcc, this.loginPwd, this.userType, jsCbId);
},
show(cb) {
    this.loginDlg=true;
    this.callback=cb;
}
},
template: `
<q-dialog v-model="loginDlg">
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{label}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-input dense v-model="loginAcc" autofocus :label="account"></q-input>
      <q-input dense v-model="loginPwd" autofocus :type="hidePwd?'password':'text'" :label="pwd">
         <template v-slot:append>
          <q-icon :name="hidePwd ? 'visibility_off':'visibility'"
            class="cursor-pointer" @click="hidePwd=!hidePwd"></q-icon>
        </template>
      </q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" :label="label" @click="actLogin"></q-btn>
      <q-btn color="primary" flat :label="cancel" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
<alert-dialog :title="failToCall" :close="close" ref="errMsg"></alert-dialog>
`
}