//引用组件，address_input,address_select在安卓7上无法使用，所以使用address_dialog
import AddressDialog from "/assets/v3/components/addr_dialog.js"
export default {
components: {AddressDialog},
data() {return {
    addr:{province:'',city:'',county:''},
    registerDlg:false,
    creditCode:'',
    pwd:'',
    name:'',
    message:'',
    pwdVisible:false,
    cb:null
}},
props: {
    title:{type:String,required:true},
    tags:{type:Object,default:{ok:"注册",cancel:"取消",seperator:' ',creditCode:"统一信用码",
     companyName:"公司名称", pwd:"密码", creditCodePls:"请输入18位正确的统一信用码!",address:"地址"}}
},
created() {
    this.creditCode=Server.creditCode();
},
methods:{
show(callback) {
    this.registerDlg=true;
    this.cb=callback;
},
confirm(){
    /*if(!JStr.chkCreditCode(this.creditCode)) {
        this.message=this.tags.creditCodePls;
        return;
    }*/
    var jsCbId = __regsiterCallback(resp=>{
        if(resp.code!=RetCode.OK) {
            this.message="Code:" + resp.code + ",Info:" + resp.info;
        } else {
            this.registerDlg=false;
            if(this.cb&&typeof(this.cb)=='function'){
                this.cb();
            }
        }
    });
    Server.register(this.creditCode,this.pwd,this.name,
        '86',this.addr.province,this.addr.city,this.addr.county,'',jsCbId);
},
chkCredit(code) {
    return JStr.chkCreditCode(code);
}
},
template: `
<q-dialog v-model="registerDlg">
 <q-card style="min-width:60vw" bordered>
  <q-card-section><div class="text-h6">{{title}}</div></q-card-section>
  <q-card-section class="q-pt-none">
   <q-input v-model="creditCode" :label="tags.creditCode" dense maxlength=18
   :rules="[v=>chkCredit(v)||tags.creditCodePls]"></q-input>
   <q-input v-model="name" :label="tags.companyName" maxlength=50 dense></q-input>
   <q-input v-model="pwd" :label="tags.pwd" dense maxlength=20 :type="pwdVisible ? 'text':'password'">
    <template v-slot:append>
      <q-icon :name="pwdVisible ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="pwdVisible = !pwdVisible"></q-icon>
    </template>
   </q-input>
   <AddressDialog :label="tags.address" v-model="addr"></AddressDialog>
  </q-card-section>
  <q-card-section class="q-pt-none" style="color:red">{{message}}</q-card-section>
  <q-card-actions align="right" class="q-pr-md">
   <q-btn :label="tags.ok" color="primary" @click="confirm"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>
`
}