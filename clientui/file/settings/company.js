const OM_PAGES=["/cfg", "/om", "mkt"];
export default {
inject:['service', 'tags'],
data(){return {
    cid:'',
    companyName:'',
    accessCode:'',
    insideAddr:'',
	outsideAddr:'',
    authorized:false,
    changed:false,
    saveAt:0,
	logo:'',
	auth:{dlg:false,pwd:'',visible:false,pg:0},
}},
created() {
    this.init();
},
methods:{
init() {
    var c=this.service.curCompany();
    this.cid=c.id;
    this.companyName=c.name;
    this.insideAddr=c.insideAddr;
    this.outsideAddr=c.outsideAddr;
    this.accessCode=c.accessCode;
    this.authorized=c.authorized;
	Companies.getLogo(c.id, __regsiterCallback(png=>{
		if(png) {
			this.logo="img:"+png;
		} else {
			this.logo="/assets/imgs/logo_example.png";
		}
	}));
},
save() {
    var cur = new Date().getTime();
    if(this.saveAt>0) {
        if(cur-this.saveAt<10000) {
            return; //避免快速的重复点击
        }
        this.saveAt=0;
    }
    this.saveAt=cur;

    Companies.add(this.cid, this.accessCode, this.insideAddr, __regsiterCallback(resp => {
        this.saveAt=0;
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        var c=this.service.curCompany();
        this.companyName=c.name;
        this.insideAddr=c.insideAddr;
        this.outsideAddr=c.outsideAddr;
        this.accessCode=c.accessCode;
        this.changed=false;
        this.$refs.alertDlg.show(this.tags.successToConnect);
    }));
},
showPage(pg) {
    this.auth.pg=pg;
    if(this.service.getToken("company",this.cid)) {
        this.service.go_to(OM_PAGES[pg]+'?id='+this.cid);
    } else {
        this.auth.dlg=true;
    }
},
copy() {
    var txt=this.cid+"\n"
        +this.companyName+"\n"
        +this.accessCode+"\n"
        +this.insideAddr+"\n"
        +this.outsideAddr+"\n";
    this.service.copyToClipboard(txt).then(()=>{
        this.$q.notify(this.tags.copied);
    });
},
onAuth() {
    var shaPwd=Secure.sha256(this.auth.pwd);
    var dta={pwd:shaPwd, services:["company","httpdns","backend"]};
    request({method:"POST",url:"/token", data:dta, private:false},"company").then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        for(var i in resp.data) {
            this.service.setToken(i,resp.data[i]);
        }
        this.auth.dlg=false;
        this.service.go_to(OM_PAGES[this.auth.pg]+'?id='+this.cid);
    });
},
refresh() {
    Companies.refreshEntrance(__regsiterCallback(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.init();
    }));
}
},
template: `
<q-layout view="hHh lpr fFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.home.company}}</q-toolbar-title>
      <q-btn flat dense color="primary" :label="tags.advanced" icon="menu" v-if="authorized">
       <q-menu>
         <q-list style="min-width: 100px">
          <q-item clickable v-close-popup @click="showPage(0)">
            <q-item-section side><q-icon color="primary" name="settings"></q-icon></q-item-section>
            <q-item-section no-wrap>{{tags.cfg.title}}</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="showPage(1)">
            <q-item-section side><q-icon color="primary" name="menu_open"></q-icon></q-item-section>
            <q-item-section no-wrap>{{tags.om.title}}</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="showPage(2)">
            <q-item-section side><q-icon color="primary" name="shop_two"></q-icon></q-item-section>
            <q-item-section no-wrap>{{tags.mkt.title}}</q-item-section>
          </q-item>
         </q-list>
       </q-menu>
      </q-btn>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-card>
 <q-card-section>
  <q-list><q-item>
	<q-item-section avatar>
	  <q-avatar size="3em"><q-icon :name="logo" size="2em"></q-icon></q-avatar>
	</q-item-section>
	<q-item-section class="text-h6">
	  <q-item-label>{{companyName}}</q-item-label>
	  <q-item-label caption>{{tags.cfg.id}}:{{cid}}</q-item-label>
	</q-item-section>
	<q-item-section side v-show="changed">
	  <q-btn icon="save" @click="save" color="primary" :loading="saveAt>0" rounded flat></q-btn>
	</q-item-section>
    <q-item-section side>
      <q-icon name="content_copy" @click="copy" color="secondary"></q-icon>
    </q-item-section>
   	<q-item-section side>
	  <q-icon name="refresh" @click="refresh" color="primary"></q-icon>
	</q-item-section>
  </q-item></q-list>
 </q-card-section>
</q-card>
<q-markup-table bordered="false" flat class="q-pa-md q-mt-lg">
  <tr>
   <td>{{tags.cfg.accessCode}}</td>
   <td><q-input v-model="accessCode" dense @update:model-value="changed=true"></q-input></td>
  </tr>
  <tr>
   <td>{{tags.insideAddr}}</td>
   <td><q-input v-model="insideAddr" dense label-slot @update:model-value="changed=true"></q-input></td>
  </tr>
  <tr>
   <td>{{tags.outsideAddr}}</td>
   <td><q-input v-model="outsideAddr" dense label-slot @update:model-value="changed=true"></q-input></td>
  </tr>
</q-markup-table>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="auth.dlg"> <!-- admin登录公司获得公司级token -->
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{tags.cfg.auth}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-input dense v-model="auth.pwd" autofocus :type="auth.visible?'text':'password'" :label="tags.cfg.pwd">
        <template v-slot:append>
          <q-icon :name="auth.visible ? 'visibility_off':'visibility'"
            class="cursor-pointer" @click="auth.visible=!auth.visible"></q-icon>
        </template>
      </q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" :label="tags.ok" @click="onAuth"></q-btn>
      <q-btn color="primary" flat :label="tags.cancel" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="alertDlg"></component-alert-dialog>
`}