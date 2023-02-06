export default {
inject:['service', 'tags'],
data() {return {
    changed:false,
    remoteAccTypes:[
        {label:this.tags.remoteProxy,value:"0"},
        {label:this.tags.remoteMyGw,value:"1"}
    ],
    
    remoteAccState:0,
    remoteAccType:'0', //0长连接，1自有外网IP
    remoteAccAddr:'', //外网地址，0时由公有云分配，1时需要填写
    
    backupState:'',
    backupKey:"",
    backupAt:"", //以分为单位，标识一天中备份的时间点
    recentBackupAt:"" //最近备份时间
}},
created(){
    this.init();
},
methods:{
init() {
    var jsCbId1 = __regsiterCallback(resp=>{
        if(resp.code!=RetCode.OK){
            return;
        }
        var info=resp.data;
        if(info.recent<=0) {
            this.recentBackupAt=this.tags.neverBackup;
        } else {
            this.recentBackupAt=new Date(info.recent).toLocaleString();
        }
        this.backupKey=info.key;
        this.backupAt=info.at;
        this.backupState=info.state;
    });
    Server.backupInfo(jsCbId1);
    var jsCbId2 = __regsiterCallback(resp=>{
        if(resp.code!=RetCode.OK){
            return;
        }
        var info=resp.data;
        this.remoteAccType=''+info.type;
        this.remoteAccAddr=info.addr;
        this.remoteAccState=info.state;
    });
    Server.remoteAccInfo(jsCbId2)
},
switchRemoteAcc() {
},
switchBackup() {
},
backup() {
    Server.backup()
},
save(){
    var jsCbId = __regsiterCallback(resp=>{
        if(resp.code!=RetCode.OK){
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.changed=false;
    });
    var req=[
        {service:'backup',key:this.backupKey, at:this.backupAt},
        {service:'remote',type:this.remoteAccType, addr:this.remoteAccAddr}
    ];
    Server.saveAdvancedCfg(jsCbId, JSON.stringify(req));
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh" v-cloak>
<q-header elevated class="primary">
   <q-toolbar>
      <q-btn icon="arrow_back" dense @click="service.go_back" flat round></q-btn>
      <q-toolbar-title>{{tags.advanced}}</q-toolbar-title>
   </q-toolbar>
</q-header>
<q-page-container>
 <q-page>
<q-markup-table bordered="false" flat>
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold"><td>{{tags.remoteAccess}}</td><td></td></tr>
 <tr>
  <td>{{tags.state}}</td>
  <td>
   {{remoteAccState==0?tags.notStart:tags.running}}
   <q-btn outline icon="power_settings_new" :label="remoteAccState==0?tags.startup:tags.shutdown"
   @click="switchRemoteAcc" color="primary" dense class="q-ml-md"></q-btn>
  </td>
 </tr>
 <tr>
  <td>{{tags.remoteType}}</td>
  <td>
   <q-option-group v-model="remoteAccType" :options="remoteAccTypes"
     inline @update:model-value="changed=true"></q-option-group>
  </td>
 </tr>
 <tr v-show="remoteAccType==='1'">
  <td>{{tags.gwIp}}</td>
  <td><q-input v-model="remoteAccAddr" dense @update:model-value="changed=true"></q-input></td>
 </tr>

 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold"><td>{{tags.backup}}</td><td></td></tr>
 <tr>
  <td>{{tags.state}}</td>
  <td>
   {{backupState==0?tags.notStart:tags.running}}
   <q-btn outline icon="power_settings_new" :label="backupState==0?tags.startup:tags.shutdown"
   @click="switchBackup" color="primary" dense class="q-ml-md"></q-btn>
  </td>
 </tr>
 <tr>
  <td>{{tags.backupKey}}</td>
  <td><q-input v-model="backupKey" dense @update:model-value="changed=true"></q-input></td>
 </tr>
 <tr>
  <td>{{tags.backupAt}}</td>
  <td>{{backupAt}}
    <q-btn icon="access_time" flat color="primary">
      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
        <q-time v-model="backupAt" format24h @update:model-value="changed=true"></q-time>
      </q-popup-proxy>
    </q-btn>
  </td>
 </tr>
 <tr>
  <td>{{tags.backupTime}}</td>
  <td>{{recentBackupAt}}</td>
 </tr>
</q-markup-table>
<div style="text-align:right;" class="q-pa-md" v-show="backupState==1">
 <q-btn flat :label="tags.backupNow" @click="backup" color="primary"></q-btn>
 <q-btn flat :label="tags.restore" @click="restore" color="primary"></q-btn>
</div>

<div style="text-align:center;" class="q-pa-md" v-show="changed">
 <q-btn :label="tags.save" @click="save" color="primary" icon="save"></q-btn>
</div>

 </q-page>
</q-page-container>
</q-layout>

<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="alertDlg"></component-alert-dialog>
`
}