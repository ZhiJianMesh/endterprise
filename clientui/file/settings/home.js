export default {
inject:['service', 'tags'],
data(){return{
    authorized:false,
    account:'',
    nickName:'',
    loginDlg:false,
    hidePwd:true,
    loginAcc:'',
    loginPwd:''
}},
created() {
    this.init();
},
methods:{
init() {
    this.authorized=Http.authorized();
    if(this.authorized) {
        if(this.service.user.nickName==''||this.service.user.account=='') {
            this.get_userbase();
        } else {
            this.nickName=this.service.user.nickName;
            this.account=this.service.user.account;
        }
    } else {
        this.account=this.tags.account;
        this.nickName=this.tags.nickName;
        this.service.user.nickName='';
        this.service.user.account='';
    }
},
about() {
    App.openApp("about");
},
jump(pg) {
    this.$router.push('/' + pg)
},
get_userbase() {
    request({method:"GET",url:"/api/getBaseInfo"}, SERVICE_USER).then(function(resp) {
        if(resp.code != 0) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.account=resp.data.account;
        this.nickName=resp.data.nickName;
        this.service.user.nickName=this.nickName; //免得每次都请求
        this.service.user.account=this.account;
    }.bind(this));
},
login() {
    var jsCbId=__regsiterCallback(function(resp){
        if(resp.code!=0) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.loginAcc='';
        this.loginPwd='';
        this.loginDlg=false;
        this.init();
    }.bind(this));
    Http.login(this.loginAcc, this.loginPwd, jsCbId);
},
logout() {
    var jsCbId=__regsiterCallback(function(resp){
        this.init();
    }.bind(this));
    Http.logout(jsCbId);
},
btn_click() {
    if(Http.authorized()) {
        this.logout();
    } else {
        this.loginDlg=true;
    }
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh">
 <q-header class="bg-grey-1">
  <q-list class="q-pa-md">
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
       :icon-right="authorized?'highlight_off':'exit_to_app'"></q-btn>
    </q-item-section>
   </q-item>
  </q-list>
 </q-header>
 <q-page-container>
    <q-page class="q-pa-md">
 <q-list class="q-pa-md">
  <q-item clickable v-ripple @click="jump('personal')" v-show="authorized">
    <q-item-section avatar>
      <q-icon color="primary" name="person_pin_circle"></q-icon>
    </q-item-section>
    <q-item-section>{{tags.home.personal}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>
  <q-item clickable v-ripple @click="jump('company')">
    <q-item-section avatar>
      <q-icon color="primary" name="business"></q-icon>
    </q-item-section>
    <q-item-section>{{tags.home.company}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>

  <q-item clickable v-ripple @click="jump('faultreport')">
    <q-item-section avatar>
      <q-icon color="brown" name="sync_problem"></q-icon>
    </q-item-section>

    <q-item-section>{{tags.home.faultreport}}</q-item-section>
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
<!-- login dialog -->
<q-dialog v-model="loginDlg">
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{tags.login}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-input dense v-model="loginAcc" autofocus :label="tags.account"></q-input>
      <q-input dense v-model="loginPwd" autofocus :type="hidePwd?'password':'text'"  :label="tags.pwd">
         <template v-slot:append>
          <q-icon :name="hidePwd ? 'visibility_off':'visibility'"
            class="cursor-pointer" @click="hidePwd=!hidePwd"></q-icon>
        </template>
      </q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" :label="tags.login" @click="login"></q-btn>
      <q-btn color="primary" flat :label="tags.cancel" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}