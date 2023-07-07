export default {
inject:['service', 'tags'],
data(){return {
    cid:'',
    companyName:'',
    accessCode:'',
    changed:false,
    saveAt:0,
    insideAddr:'',
	outsideAddr:''
}},
created() {
    this.cid=Companies.cid();
    this.companyName=Companies.name();
    this.insideAddr=Companies.insideAddr();
    this.outsideAddr=Companies.outsideAddr();
    this.accessCode=Companies.accessCode();
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
        this.insideAddr=Companies.insideAddr();
        this.outsideAddr=Companies.outsideAddr();
        this.companyName=Companies.name();
        this.changed=false;
        this.$refs.alertDlg.show(this.tags.successToConnect);
    }));
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
<q-markup-table bordered="false" flat class="q-pa-md">
  <tr>
   <td>{{tags.companyId}}</td>
   <td>{{cid}}</td>
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
<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="alertDlg"></component-alert-dialog>
`}