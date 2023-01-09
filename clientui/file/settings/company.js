export default {
inject:['service', 'tags'],
data(){return {
    cid:'',
    inPublicCloud:false,
    companyName:'',
    accessCode:'',
    saveAt:0,
    changed:false,
    serverAddr:''
}},
created() {
    this.cid=Http.cid();
    this.companyName=Http.companyName();
    this.serverAddr=Http.serverAddr();
    this.accessCode=Http.accessCode();
    this.changed=!this.cid||!this.serverAddr;
},
methods:{
save() {
    var cur = new Date().getTime();
    if(this.saveAt>0) {
        if(cur-this.saveAt<10000) {
            return;
        }
        this.saveAt=0;
    }
    this.saveAt=cur;
    var jsCbId=__regsiterCallback(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.serverAddr=Http.serverAddr();
        this.companyName=Http.companyName();
        this.saveAt=0;
        this.changed=false;
        this.$refs.alertDlg.show(this.tags.successToConnect);
    });

    Http.saveCid(this.cid, false, this.serverAddr, this.accessCode, jsCbId);
},
scan() {
    var jsCbId=__regsiterCallback(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        var data = JSON.parse(resp.data.value);
        this.serverAddr=data.addr;
        this.accessCode=data.code;
        this.cid=data.id;
        this.inPublicCloud=false;
        this.changed=true;
    });
    OS.scanCode(jsCbId);
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.home.company}}</q-toolbar-title>
      <q-btn round dense flat icon="svguse:/assets/imgs/meshicons.svg#scan" @click="scan" color="primary"></q-btn>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list>
  <q-item>
   <q-item-section side>{{tags.companyId}}</q-item-section>
   <q-item-section><q-input v-model="cid" dense @update:model-value="changed=true"></q-input></q-item-section>
  </q-item>
  <q-item v-show="cid>0">
   <q-item-section side>{{tags.companyName}}</q-item-section>
   <q-item-section>{{companyName}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section side>{{tags.accessCode}}</q-item-section>
   <q-item-section><q-input v-model="accessCode" dense @update:model-value="changed=true"></q-input></q-item-section>
  </q-item>
  <q-separator spaced></q-separator>
  <q-item>
   <q-item-section side>{{tags.inPubCloud}}</q-item-section>
   <q-item-section>
    <q-checkbox v-model="inPublicCloud" @update:model-value="changed=true"></q-checkbox>
   </q-item-section>
  </q-item>
  <q-item>
   <q-item-section side>{{tags.serverAddr}}</q-item-section>
   <q-item-section>
    <q-input v-model="serverAddr" dense label-slot @update:model-value="changed=true"></q-input>
   </q-item-section>
  </q-item>
</q-list>
<div align="center" v-show="changed">
 <q-btn :label="tags.connect" @click="save" color="primary" :loading="saveAt>0" rounded></q-btn>
</div>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="alertDlg"></component-alert-dialog>
`
}