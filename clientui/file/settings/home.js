export default {
inject:['service', 'tags'],
data(){return{
    authorized:false,
    account:'',
    nickName:'',
	companyName:'',
    companies:[],
    curCompanyId:-1,
    regComDta:{creditCode:'',name:'',pwd:'',cfmPwd:'',verifyCode:'',session:'',addr:'',vcImg:'',pwdVis:false},
    newComDta:{id:'',accessCode:'',insideAddr:'',needInside:false,dlg:false,tab:'checkin'},
    newUsrDta:{account:'',pwd:'',confirmPwd:'',verifyCode:'',session:'',pwdVis:false,vc:'',dlg:false},
    doing:false //是否正在添加公司，用于显示进度条
}},
created() {
    this.init();
},
methods:{
init() {
    var company=this.service.curCompany();
    this.newComData={id:'',accessCode:'',insideAddr:'',needInside:false};
    Companies.list(__regsiterCallback(resp=>{
		this.companies=resp.data.list;
		//必须用let，否则在循环中使用异步闭包会用最后一个
		//安卓7部分实现let
        for(let c of this.companies) {
            Companies.getLogo(c.id, __regsiterCallback(png=>{
                if(png) {
                    c['logo']="img:"+png;
                } else {
                    c['logo']="/assets/imgs/logo_example.png";
                }
            }));
            if(c.id==0) {
                c.name=this.tags.personalAcc;
            }
        }
        this.service.cid=company.id;
        this.curCompanyId=company.id;
    }));

	this.account=this.tags.account;
	this.nickName=this.tags.nickName;
    if(company.authorized) {
		this.authorized=true;
        this.service.getUserInfo().then(userInfo=>{
            this.account=userInfo.account;
            this.nickName=userInfo.nickName;
        });
    } else {
		this.authorized=false;
    }
    this.companyName=company.name;
},
about() {
    App.openApp("clientui");
},
jump(pg) {
    this.$router.push(pg)
},
logInOrOut() {
    if(this.service.curCompany().authorized) {
        Companies.logout(__regsiterCallback(resp => {
            this.account=this.tags.account;
            this.nickName=this.tags.nickName;
            this.authorized=false;
            this.service.clrUserInfo();
        }));
    } else {
        this.$refs.loginDlg.show(resp => {
            this.init()
        });
    }
},
company_btn_act() {
    if(this.newComDta.tab=='login') {
        this.addCompany()
    } else {
        this.regCompany();
    }
},
addCompany(){
    var dta=this.newComDta;
    this.doing=true;
    Companies.add(dta.id, dta.accessCode, dta.insideAddr,
    __regsiterCallback(resp=>{
        this.doing=false;
        if(resp.code==RetCode.OK) {
			this.newComDta.dlg=false;
            this.init();
            return;
        }
        if(!dta.insideAddr) { //端侧无法外网访问，httpdns无法探测到，则直接用内网IP探测
            dta.needInside=true;
        } else {
            this.$refs.errDlg.showErr(resp.code, resp.info);
        }
    }))
},
regCompany() {
    this.doing=true;
    var jsCbId=__regsiterCallback(resp=>{
        this.doing=false;
        if(resp.code!=RetCode.OK) {
            this.message="Code:" + resp.code + ",Info:" + resp.info;
            return;
        }
        this.newComDta.dlg=false;
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
setCurCompany(cid) {
    Companies.setCur(cid);
	this.service.cid=cid;
    this.init();
},
exitCompany(){
    if(Companies.remove(this.curCompanyId)) {
        this.init();
    }
},
showRegister() {
    this.newUsrDta.dlg=true;
    this.refreshUsrVc();
},
registerAcc() { //注册个人账号
    if(this.newUsrDta.pwd=='' || this.newUsrDta.pwd!=this.newUsrDta.confirmPwd) {
        this.$refs.errDlg.show(this.tags.invalidPwd);
        return;        
    }
    this.doing=true;
    var opts={method:"POST",url:"/user/register", private:false, data:{
        account:this.newUsrDta.account,
        accType:'N',
        password:this.newUsrDta.pwd,
        confirmPassword:this.newUsrDta.confirmPwd,
        session:this.newUsrDta.session,
        verifyCode:this.newUsrDta.verifyCode
    },cloud:true};
    request(opts, SERVICE_UNIUSER).then(resp=>{
        this.doing=false;
        if(resp.code!=RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.newUsrDta.dlg=false;
        this.newUsrDta={account:'',pwd:'',confirmPwd:'',verifyCode:'',session:'',pwdVis:true,vc:''};
    })
},
refreshUsrVc(){
    var url="/image?w=120&h=40&session="+this.newUsrDta.session;
    request({method:"GET",url:url,private:false,cloud:true},"verifycode").then(resp=>{
        if(resp.code==RetCode.OK) {
            this.newUsrDta.vc=resp.data.img;
            this.newUsrDta.session=resp.data.session;
        }
    })
},
refreshRegVc(){
    var url="/image?w=120&h=40&session="+this.regComDta.session;
    request({method:"GET",url:url,private:false,cloud:true},"verifycode").then(resp=>{
        if(resp.code==RetCode.OK) {
            this.regComDta.vcImg=resp.data.img;
            this.regComDta.session=resp.data.session;
        }
    })
},
newComTabChged(v) {
    if(v=='register'){
        this.refreshRegVc();
    }
},
chkCredit(code) {
    return JStr.chkCreditCode(code);
}
},
template: `
<q-layout view="lHh lpr lFf" container style="height:100vh">
 <q-header class="bg-grey-1">
  <q-list class="q-pa-sm">
   <q-item>
    <q-item-section top thumbnail class="q-ml-none">
     <q-btn-dropdown color="primary" icon="group" push no-caps no-wrap fab-mini flat dense>
      <q-list dense>
        <q-item v-for="c in companies" clickable v-close-popup @click="setCurCompany(c.id)">
          <q-item-section avatar>
            <q-avatar square :icon="c.logo" :color="c.id==curCompanyId?'primary':'green-1'" text-color="white"></q-avatar>
          </q-item-section>
          <q-item-section no-wrap>{{c.name}}</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="newComDta.dlg=true">
          <q-item-section avatar>
            <q-avatar icon="add" color="teal-3" text-color="white"></q-avatar>
          </q-item-section>
          <q-item-section no-wrap>{{tags.addCompany}}</q-item-section>
        </q-item>
      </q-list>
     </q-btn-dropdown>
    </q-item-section>
    <q-item-section>
      <q-item-label caption>{{account}}</q-item-label>
      <q-item-label caption>{{companyName}}/{{nickName}}</q-item-label>
    </q-item-section>
    <q-item-section side top>
      <div class="row no-wrap">
       <q-btn flat color="indigo" :label="tags.home.register"
        @click="showRegister" v-show="curCompanyId==0&&!authorized"></q-btn>
       <q-btn flat dense color="primary" :label="authorized?tags.logout:tags.login" @click="logInOrOut"
        :icon-right="authorized?'logout':'login'"></q-btn>
      </div>
    </q-item-section>
   </q-item>
  </q-list>
 </q-header>
 <q-page-container>
    <q-page class="q-pa-md">
<q-list class="q-pa-md">
  <q-item clickable v-ripple @click="jump('/company')" v-show="curCompanyId!=0">
    <q-item-section avatar>
      <q-icon color="primary" name="business"></q-icon>
    </q-item-section>
    <q-item-section>{{tags.home.company}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>

  <q-item clickable v-ripple @click="jump('/personal')" v-show="authorized">
    <q-item-section avatar>
      <q-icon color="primary" name="person_pin_circle"></q-icon>
    </q-item-section>
    <q-item-section>{{tags.home.personal}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>

  <q-item clickable v-ripple @click="jump('/advice')">
    <q-item-section avatar>
      <q-icon color="brown" name="mail_outline"></q-icon>
    </q-item-section>
    <q-item-section>{{tags.home.advice}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>

  <q-item clickable v-ripple @click="about">
    <q-item-section avatar>
      <q-icon color="primary" name="error"></q-icon>
    </q-item-section>

    <q-item-section>{{tags.home.about}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="open_in_new" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>
  
  <q-item clickable v-ripple v-show="curCompanyId!=0" @click="exitCompany">
    <q-item-section avatar>
      <q-icon color="red" name="cancel"></q-icon>
    </q-item-section>
    <q-item-section class="text-red">{{tags.home.exitCompany}}</q-item-section>
    <q-item-section avatar>
    </q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="newComDta.dlg">
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{tags.addCompany}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
  <q-tabs v-model="newComDta.tab" dense class="text-grey" active-color="primary"
   indicator-color="primary" align="justify" narrow-indicator
   @update:model-value="newComTabChged">
   <q-tab name="checkin" :label="tags.checkin"></q-tab>
   <q-tab name="register" :label="tags.register"></q-tab>
  </q-tabs>
  <q-separator></q-separator>
  <q-tab-panels v-model="newComDta.tab" animated>
   <q-tab-panel name="checkin">
    <q-input dense v-model="newComDta.id" autofocus :label="tags.cfg.id"></q-input>
    <q-input dense v-model="newComDta.accessCode" :label="tags.cfg.accessCode"></q-input>
    <q-input dense v-model="newComDta.insideAddr" :label="tags.insideAddr" v-show="newComDta.needInside"></q-input>
   </q-tab-panel>
   <q-tab-panel name="register">
    <q-input autofocus v-model="regComDta.creditCode" :label="tags.cfg.creditCode" dense maxlength=18
    :rules="[v=>chkCredit(v)||tags.creditCodePls]"></q-input>
    <q-input v-model="regComDta.name" :label="tags.cfg.name" maxlength=50 dense></q-input>
    <q-input v-model="regComDta.pwd" :label="tags.pwd" dense maxlength=20 :type="regComDta.pwdVis ? 'text':'password'">
     <template v-slot:append>
      <q-icon :name="regComDta.pwdVis ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="regComDta.pwdVis=!regComDta.pwdVis"></q-icon>
     </template>
    </q-input>
    <q-input v-model="regComDta.cfmPwd" :label="tags.cfmPwd" dense maxlength=20
     :type="regComDta.pwdVis ? 'text':'password'" :rules="[v=>v==regComDta.pwd||tags.invalidCfmPwd]">
     <template v-slot:append>
      <q-icon :name="regComDta.pwdVis ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="regComDta.pwdVis=!regComDta.pwdVis"></q-icon>
     </template>
    </q-input>
    <q-input v-model="regComDta.verifyCode" :label="tags.verifyCode">
      <template v-slot:append><img :src="regComDta.vcImg" @click="refreshRegVc"></template>
    </q-input>
    <address-dialog :label="tags.cfg.address" v-model="regComDta.addr"></address-dialog>
   </q-tab-panel>
  </q-tab-panels>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" :label="tags.ok" @click="addCompany" :disable="doing"></q-btn>
      <q-btn color="primary" flat :label="tags.cancel" v-close-popup :disable="doing"></q-btn>
    </q-card-actions>
    <q-linear-progress indeterminate rounded color="pink"
    class="q-mt-sm" v-show="doing"></q-linear-progress>
  </q-card>
</q-dialog>

<q-dialog v-model="newUsrDta.dlg">
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{tags.home.registerAcc}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-input dense v-model="newUsrDta.account" autofocus :label="tags.account"></q-input>
      <q-input dense v-model="newUsrDta.pwd" autofocus :type="newUsrDta.pwdVis?'password':'text'" :label="tags.pwd">
        <template v-slot:append>
          <q-icon :name="newUsrDta.pwdVis ? 'visibility_off':'visibility'"
            class="cursor-pointer" @click="newUsrDta.pwdVis=!newUsrDta.pwdVis"></q-icon>
        </template>
      </q-input>
      <q-input dense v-model="newUsrDta.confirmPwd" autofocus :type="newUsrDta.pwdVis?'text':'password'" :label="tags.cfmPwd">
        <template v-slot:append>
          <q-icon :name="newUsrDta.pwdVis ? 'visibility':'visibility_off'"
            class="cursor-pointer" @click="newUsrDta.pwdVis=!newUsrDta.pwdVis"></q-icon>
        </template>
      </q-input>
      <q-input v-model="newUsrDta.verifyCode" autofocus :label="tags.verifyCode">
        <template v-slot:append><img :src="newUsrDta.vc" @click="refreshUsrVc"></template>
      </q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" :label="tags.ok" @click="registerAcc" :disable="doing"></q-btn>
      <q-btn color="primary" flat :label="tags.cancel" v-close-popup :disable="doing"></q-btn>
    </q-card-actions>
    <q-linear-progress indeterminate rounded color="pink"
    class="q-mt-sm" v-show="doing"></q-linear-progress>
  </q-card>
</q-dialog>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errDlg"></component-alert-dialog>
<component-login-dialog ref="loginDlg" :title="tags.login" :login="tags.login" 
 :cancel="tags.cancel" :close="tags.close" :failToCall="tags.failToCall"
 :account="tags.account" :pwd="tags.pwd" :accType="N">
</component-login-dialog>
`}