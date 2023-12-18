//引用组件，address_input,address_select在安卓7上无法使用，所以使用address_dialog
import AddressDialog from "/assets/v3/components/addr_dialog.js"
export default {
components: {AddressDialog},
data() {return {
    addr:{province:'',city:'',county:''},
    registerDlg:false,
    message:'',
    pwdVisible:false,
    regDta:{creditCode:'',name:'',pwd:'',cfmPwd:'',verifyCode:'',session:'',vcImg:''},
    lgnDta:{id:''/*公司id或统一信用码*/,pwd:''},
    cb:null,
    tab:'login',
    doing:false
}},
props: {
    tags:{type:Object,
      default:{
        ok:"确定",cancel:"取消",seperator:' ',
        creditCode:"统一信用码",companyName:"公司名称", 
        pwd:"密码",cfmPwd:"确认密码",
        verifyCode:"验证码",address:"地址",
        creditCodePls:"请输入18位正确的统一信用码!",
        invalidCfmPwd:'确认密码必须与密码相同'
      }
    }
},
created() {
},
methods:{
show(callback) {
    this.registerDlg=true;
    this.cb=callback;
},
confirm(){
    if(this.tab=='login') {
        this.login()
    } else {
        this.register();
    }
},
login() {
    this.doing=true;
    var jsCbId = __regsiterCallback(resp=>{
        this.doing=false;
        if(resp.code!=RetCode.OK) {
            this.message="Code:" + resp.code + ",Info:" + resp.info;
            return;
        }
        this.registerDlg=false;
        if(this.cb&&typeof(this.cb)=='function'){
            this.cb();
        }
    });
    var d=this.lgnDta;
    Company.login(d.id,d.pwd,jsCbId);
},
register() {
    /*if(!JStr.chkCreditCode(this.creditCode)) {
        this.message=this.tags.creditCodePls;
        return;
    }*/
    this.doing=true;
    var jsCbId=__regsiterCallback(resp=>{
        this.doing=false;
        if(resp.code!=RetCode.OK) {
            this.message="Code:" + resp.code + ",Info:" + resp.info;
            return;
        }
        this.registerDlg=false;
        if(this.cb&&typeof(this.cb)=='function'){
            this.cb();
        }
    });
    var d=this.regDta;
    Console.debug("register(creditCode:" + d.creditCode + ",name:" + d.name+")");
    Company.register(d.creditCode,d.pwd,d.cfmPwd,d.name,
        '86',this.addr.province,this.addr.city,this.addr.county,'',
        d.verifyCode,d.session,jsCbId);
},
chkCredit(code) {
    return JStr.chkCreditCode(code);
},
chkCreditId(code) {
    if(code.length<10){
        return true;
    }
    return JStr.chkCreditCode(code);
},
refreshVc(){
    var url="/image?w=120&h=40";
    request({method:"GET",url:url,private:false,cloud:true},"verifycode").then(resp=>{
        if(resp.code==RetCode.OK) {
            this.regDta.vcImg=resp.data.img;
            this.regDta.session=resp.data.session;
        }
    })
},
onTabChanged(v) {
    if(v=='register'){
        this.refreshVc();
    }
}
},
template: `
<q-dialog v-model="registerDlg">
 <q-card style="min-width:70vw" bordered>
  <q-card-section>
  <q-tabs v-model="tab" dense class="text-grey" active-color="primary"
   indicator-color="primary" align="justify" narrow-indicator
   @update:model-value="onTabChanged">
   <q-tab name="login" :label="tags.login"></q-tab>
   <q-tab name="register" :label="tags.register"></q-tab>
  </q-tabs>
  <q-separator></q-separator>
  <q-tab-panels v-model="tab" animated>
   <q-tab-panel name="login">
    <q-input v-model="lgnDta.id" :label="tags.companyId+'/'+tags.creditCode"
     dense maxlength=18 :rules="[v=>chkCreditId(v)||tags.creditCodePls]"></q-input>
    <q-input v-model="lgnDta.pwd" :label="tags.pwd" dense maxlength=20 :type="pwdVisible ? 'text':'password'">
     <template v-slot:append>
      <q-icon :name="pwdVisible ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="pwdVisible = !pwdVisible"></q-icon>
     </template>
    </q-input>
   </q-tab-panel>
   <q-tab-panel name="register">
    <q-input autofocus v-model="regDta.creditCode" :label="tags.creditCode" dense maxlength=18
    :rules="[v=>chkCredit(v)||tags.creditCodePls]"></q-input>
    <q-input v-model="regDta.name" :label="tags.companyName" maxlength=50 dense></q-input>
    <q-input v-model="regDta.pwd" :label="tags.pwd" dense maxlength=20 :type="pwdVisible ? 'text':'password'">
     <template v-slot:append>
      <q-icon :name="pwdVisible ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="pwdVisible = !pwdVisible"></q-icon>
     </template>
    </q-input>
    <q-input v-model="regDta.cfmPwd" :label="tags.cfmPwd" dense maxlength=20
     :type="pwdVisible ? 'text':'password'" :rules="[v=>v==regDta.pwd||tags.invalidCfmPwd]">
     <template v-slot:append>
      <q-icon :name="pwdVisible ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="pwdVisible = !pwdVisible"></q-icon>
     </template>
    </q-input>
    <q-input v-model="regDta.verifyCode" :label="tags.verifyCode">
      <template v-slot:append><img :src="regDta.vcImg" @click="refreshVc"></template>
    </q-input>
    <AddressDialog :label="tags.address" v-model="addr"></AddressDialog>
   </q-tab-panel>
  </q-tab-panels>
  </q-card-section>
  <q-card-section class="q-pt-none" style="color:red">{{message}}</q-card-section>
  <q-card-actions align="right" class="q-pr-md">
   <q-btn :label="tags.ok" color="primary" @click="confirm" :disable="doing"></q-btn>
   <q-btn flat :label="tags.cancel" color="primary" v-close-popup :disable="doing"></q-btn>
  </q-card-actions>
  <q-linear-progress indeterminate rounded color="pink"
    class="q-mt-sm" v-show="doing"></q-linear-progress>
 </q-card>
</q-dialog>
`}