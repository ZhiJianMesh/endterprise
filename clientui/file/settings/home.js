export default {
inject:['service', 'tags'],
data(){return{
    authorized:false,
    account:'',
    nickName:'',
	companyName:'',
    companies:[],
    curCompanyId:-1,
    newComDta:{id:'',accessCode:'',insideAddr:'',needInside:false},
    newUsrDta:{account:'',pwd:'',confirmPwd:'',verifyCode:'',session:'',hidePwd:true,vc:''},
    dlg:{register:false,company:false}
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
                c['logo']="img:"+png;
            }));
            if(c.id==0) {
                c.name=this.tags.personalAcc;
            }
        }
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
btn_click() {
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
addCompany(){
    var dta=this.newComDta;
    Companies.add(dta.id, dta.accessCode, dta.insideAddr,
    __regsiterCallback(resp=>{
        if(resp.code==RetCode.OK) {
			this.dlg.company=false;
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
setCurCompany(cid) {
    Companies.setCur(cid)
    this.init();
},
exitCompany(){
    if(Companies.remove(this.curCompanyId)) {
        this.init();
    }
},
showRegister() {
    this.dlg.register=true;
    this.refreshVc();
},
register() {
    if(this.newUsrDta.pwd=='' || this.newUsrDta.pwd!=this.newUsrDta.confirmPwd) {
        this.$refs.errDlg.show(this.tags.invalidPwd);
        return;        
    }

    var req={method:"POST",url:"/user/register", private:false, data:{
        account:this.newUsrDta.account,
        accType:'N',
        password:this.newUsrDta.pwd,
        confirmPassword:this.newUsrDta.confirmPwd,
        session:this.newUsrDta.session,
        verifyCode:this.newUsrDta.verifyCode
    }};
    request(req, SERVICE_UNIUSER).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.dlg.register=false;
        this.newUsrDta={account:'',pwd:'',confirmPwd:'',verifyCode:'',session:'',hidePwd:true,vc:''};
    })
},
refreshVc(){
    var url="/image?w=120&h=40&session="+this.newUsrDta.session;
    request({method:"GET",url:url,private:false},"verifycode").then(resp=>{
        if(resp.code==RetCode.OK) {
            this.newUsrDta.vc=resp.data.img;
            this.newUsrDta.session=resp.data.session;
        }
    })
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
          <q-item-section>{{c.name}}</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="dlg.company=true">
          <q-item-section avatar>
            <q-avatar icon="add" color="teal-3" text-color="white"></q-avatar>
          </q-item-section>
          <q-item-section>{{tags.addCompany}}</q-item-section>
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
       <q-btn flat dense color="primary" :label="authorized?tags.logout:tags.login" @click="btn_click"
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

<q-dialog v-model="dlg.company">
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{tags.addCompany}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-input dense v-model="newComDta.id" autofocus :label="tags.companyId"></q-input>
      <q-input dense v-model="newComDta.accessCode" :label="tags.accessCode"></q-input>
      <q-input dense v-model="newComDta.insideAddr" :label="tags.insideAddr" v-show="newComDta.needInside"></q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" :label="tags.ok" @click="addCompany"></q-btn>
      <q-btn color="primary" flat :label="tags.cancel" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<q-dialog v-model="dlg.register">
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{tags.home.register}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-input dense v-model="newUsrDta.account" autofocus :label="tags.account"></q-input>
      <q-input dense v-model="newUsrDta.pwd" autofocus :type="newUsrDta.hidePwd?'password':'text'" :label="tags.pwd">
        <template v-slot:append>
          <q-icon :name="newUsrDta.hidePwd ? 'visibility_off':'visibility'"
            class="cursor-pointer" @click="newUsrDta.hidePwd=!newUsrDta.hidePwd"></q-icon>
        </template>
      </q-input>
      <q-input dense v-model="newUsrDta.confirmPwd" autofocus :type="newUsrDta.hidePwd?'password':'text'" :label="tags.cfmPwd">
        <template v-slot:append>
          <q-icon :name="newUsrDta.hidePwd ? 'visibility_off':'visibility'"
            class="cursor-pointer" @click="newUsrDta.hidePwd=!newUsrDta.hidePwd"></q-icon>
        </template>
      </q-input>
      <q-input v-model="newUsrDta.verifyCode" autofocus :label="tags.verifyCode">
        <template v-slot:append><img :src="newUsrDta.vc" @click="refreshVc"></template>
      </q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" :label="tags.ok" @click="register"></q-btn>
      <q-btn color="primary" flat :label="tags.cancel" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errDlg"></component-alert-dialog>
<component-login-dialog ref="loginDlg" :title="tags.login" :login="tags.login" 
 :cancel="tags.cancel" :close="tags.close" :failToCall="tags.failToCall"
 :account="tags.account" :pwd="tags.pwd" :accType="N">
</component-login-dialog>
`}