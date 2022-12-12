export default {
inject:['service', 'tags'],
data(){return {
    cid:'',
    inPublicCloud:false,
    companyName:'',
    saveAt:0,
    selfSet:false,
    changed:false,
    serverAddr:''
}},
created() {
    this.cid=Http.cid();
    this.companyName=Http.companyName();
    this.serverAddr=Http.serverAddr();
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
        this.$refs.alertDlg.show(this.tags.companySaved);
    });

    if(this.inPublicCloud) {//在公网环境
        Http.saveCid(this.cid, true, "", jsCbId);
    } else if(this.selfSet) { //自定义
        Http.saveCid(this.cid, false, this.serverAddr, jsCbId);
    } else {
        Http.saveCid(this.cid, false, "", jsCbId);
    }
},
enableSelfSet() {
    if(!this.inPublicCloud) {
        this.selfSet=!this.selfSet;
    } else {
        this.selfSet=false;
    }
},
setPublic() {
    if(this.inPublicCloud) {
        this.selfSet=false;
    }
    this.changed=true;
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.home.company}}</q-toolbar-title>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">  
<q-list class="q-pa-md">
  <q-item>
   <q-item-section>{{tags.companyId}}</q-item-section>
   <q-item-section><q-input v-model="cid" dense @update:model-value="changed=true"></q-input></q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.inPubCloud}}</q-item-section>
   <q-item-section>
    <q-checkbox v-model="inPublicCloud" @update:model-value="setPublic"></q-checkbox>
   </q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.serverAddr}}</q-item-section>
   <q-item-section>
    <q-input v-model="serverAddr" dense :disable="!selfSet" label-slot @update:model-value="changed=true">
     <template v-slot:after>
      <q-btn round dense flat icon="mode_edit" @click="enableSelfSet" :color="selfSet?'primary':'grey'"></q-btn>
     </template>
    </q-input>
   </q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.companyName}}</q-item-section>
   <q-item-section>{{companyName}}</q-item-section>
  </q-item>
  <q-item v-show="changed">
     <q-item-section><q-btn :label="tags.save" @click="save" color="primary" :loading="saveAt>0" rounded></q-btn></q-item-section>
  </q-item>  
</q-list>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="alertDlg"></component-alert-dialog>
`
}