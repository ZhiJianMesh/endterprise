export default {
inject:['service', 'tags'],
data(){return {
    cid:'',
    companyName:'',
    accessCode:'',
    authorized:false,
    changed:false,
    saveAt:0,
    insideAddr:'',
	outsideAddr:'',
	auth:{dlg:false,pwd:'',visible:false}
}},
created() {
    var c=this.service.curCompany();
    this.cid=c.id;
    this.companyName=c.name;
    this.insideAddr=c.insideAddr;
    this.outsideAddr=c.outsideAddr;
    this.accessCode=c.accessCode;
    if(c.authorized && c.uid=='1'){
        this.authorized=true;
    }
},
methods:{
refresh() {
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
onAuth() {
    var shaPwd=Secure.sha256(this.auth.pwd);
    var dta={pwd:shaPwd, services:['httpdns','company']};
    request({method:"POST",url:"/company/token", data:dta, private:false},"company").then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        for(var i in resp.data) {
            Http.setCompanyToken(i, resp.data[i]);
        }
        this.auth.dlg=false;
        this.service.go_to('/advanced');
    });
}
},
template: `
<q-layout view="hHh lpr fFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.home.company}}</q-toolbar-title>
      <q-btn flat icon="settings" dense @click="auth.dlg=true" v-if="authorized"></q-btn>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-markup-table bordered="false" flat class="q-pa-md">
  <tr>
   <td>{{tags.company.id}}</td>
   <td>{{cid}}</td>
  </tr>
  <tr v-show="cid>0">
   <td>{{tags.company.name}}</td>
   <td>{{companyName}}</td>
  </tr>
  <tr>
   <td>{{tags.company.accessCode}}</td>
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
<div align="center" v-show="changed">
 <q-btn :label="tags.refresh" @click="refresh" color="primary" :loading="saveAt>0" rounded></q-btn>
</div>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="auth.dlg"> <!-- admin登录公司获得公司级token -->
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{tags.company.auth}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-input dense v-model="auth.pwd" autofocus :type="auth.visible?'text':'password'" :label="tags.company.pwd">
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