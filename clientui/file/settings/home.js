const CFG_USERTYPE="user_type";
export default {
inject:['service', 'tags'],
data(){return{
    authorized:false,
    account:'',
    nickName:'',
    userType:'company'
}},
created() {
    this.userType=storage_get(CFG_USERTYPE, "company");
    this.init();
},
methods:{
init() {
    var userInfo = this.service.user[this.userType];
    this.authorized=Http.authorized(this.userType);
    if(this.authorized) {
        if(userInfo.nickName==''||userInfo.account=='') {
            this.get_userbase();
        } else {
            this.nickName=userInfo.nickName;
            this.account=userInfo.account;
        }
    } else {
        this.account=this.tags.account;
        this.nickName=this.tags.nickName;
        userInfo.nickName='';
        userInfo.account='';
    }
},
about() {
    App.openApp("about");
},
jump(pg) {
    this.$router.push('/' + pg)
},
get_userbase() {
    var service=this.userType=='personal'?SERVICE_UNIUSER : SERVICE_USER;
    request({method:"GET",url:"/api/getBaseInfo"}, service).then(resp => {
        if(resp.code != 0) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.account=resp.data.account;
        this.nickName=resp.data.nickName;
        this.service.user.nickName=this.nickName; //免得每次都请求
        this.service.user.account=this.account;
    });
},
btn_click() {
    if(Http.authorized()) {
        var jsCbId=__regsiterCallback(resp => {this.init()});
        Http.logout(this.userType, jsCbId);
    } else {
        this.$refs.loginDlg.show(resp => {this.init()});
    }
},
switchUser() {
    storage_set(CFG_USERTYPE, this.userType)
    this.init();
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh">
 <q-header class="bg-grey-1">
  <q-list class="q-pa-sm">
   <q-item>
    <q-item-section top thumbnail class="q-ml-none">
      <q-icon :color="authorized?'primary':'grey'" name="person" style="font-size:4em;" @click="person"></q-icon>
    </q-item-section>
    <q-item-section>
      <q-item-label caption>{{account}}</q-item-label>
      <q-item-label caption>{{nickName}}</q-item-label>
    </q-item-section>
    <q-item-section side top>
      <q-btn flat color="primary" :label="authorized?tags.logout:tags.login" @click="btn_click"
       :icon-right="authorized?'logout':'login'"></q-btn>
    </q-item-section>
   </q-item>
  </q-list>
 </q-header>
 <q-footer class="bg-grey-1">
  <q-tabs v-model="userType" class="text-grey"  active-color="primary"
   switch-indicator inline-label @update:model-value="switchUser">
    <q-tab name="company" :label="tags.utCompany" icon="svguse:/assets/imgs/meshicons.svg#company"></q-tab>
    <q-tab name="personal" :label="tags.utPersonal" icon="person_pin_circle"></q-tab>
  </q-tabs>
 </q-footer>
 <q-page-container>
    <q-page class="q-pa-md">
<q-list class="q-pa-md">
  <q-item clickable v-ripple @click="jump('company')" v-show="userType=='company'">
    <q-item-section avatar>
      <q-icon color="primary" name="business"></q-icon>
    </q-item-section>
    <q-item-section>{{tags.home.company}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>
  <q-item clickable v-ripple @click="jump('personal')" v-show="authorized">
    <q-item-section avatar>
      <q-icon color="primary" name="person_pin_circle"></q-icon>
    </q-item-section>
    <q-item-section>{{tags.home.personal}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>

  <q-item clickable v-ripple @click="jump('advice')">
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
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errDlg"></component-alert-dialog>
<component-login-dialog ref="loginDlg" :title="tags.login" :login="tags.login" 
 :cancel="tags.cancel" :close="tags.close" :failToCall="tags.failToCall"
 :account="tags.account" :pwd="tags.pwd" :userType="userType">
 </component-login-dialog>
`
}