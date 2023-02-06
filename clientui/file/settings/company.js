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
connect() {
    var cur = new Date().getTime();
    if(this.saveAt>0) {
        if(cur-this.saveAt<10000) {
            return;
        }
        this.saveAt=0;
    }
    this.saveAt=cur;
    var jsCbId=__regsiterCallback(resp => {
        this.saveAt=0;
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.serverAddr=Http.serverAddr();
        this.companyName=Http.companyName();
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
<q-markup-table bordered="false" flat>
  <tr>
   <td>{{tags.companyId}}</td>
   <td><q-input v-model="cid" dense @update:model-value="changed=true"></q-input></td>
  </tr>
  <tr v-show="cid>0">
   <td>{{tags.companyName}}</td>
   <td>{{companyName}}</td>
  </tr>
  <tr>
   <td>{{tags.accessCode}}</td>
   <td><q-input v-model="accessCode" dense @update:model-value="changed=true"></q-input></td>
  </tr>
  <tr>
   <td>{{tags.serverAddr}}</td>
   <td><q-input v-model="serverAddr" dense label-slot @update:model-value="changed=true"></q-input></td>
  </tr>
  <tr>
   <td>{{tags.inPubCloud}}</td>
   <td>
    <q-checkbox v-model="inPublicCloud" @update:model-value="changed=true"></q-checkbox>
   </td>
  </tr>
</q-markup-table>
<div align="center" v-show="changed">
 <q-btn :label="tags.connect" @click="connect" color="primary" :loading="saveAt>0" rounded></q-btn>
</div>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="alertDlg"></component-alert-dialog>
`
}