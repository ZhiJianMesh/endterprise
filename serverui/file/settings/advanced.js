export default {
inject:['service', 'tags'],
data() {return {
    changed:false,
    wan:{
        state:0, //0:未开启，1：自有外网IP，2：网桥代理，
        addr:'', //自有外网地址，state为2时由公有云分配，1时需要填写
        balance:0
    },
    backup:{
        at:-1,
        recent:'',
        balance:0,
        buckets:[] //id list
    },
	bucketOpts:[],//[{label:'xxx',value:123}...]
    backupAt:"", //备份时间点，用于控件显示
    progress:{
        dlg:false,
        state:0,//0:初始，1:进行中，2：结束
        icon:'backup',
        title:'',
        info:'',
        act:null
    }
}},
created(){
    this.init();
},
methods:{
init() {
    this.service.get_buckets().then(opts => {
       this.bucketOpts = opts;
    });
    
    Server.backupInfo(__regsiterCallback(resp=>{
        var info=resp.data;
        if(info.recent<=0) {
            this.backup.recent=this.tags.neverBackup;
        } else {
            this.backup.recent=new Date(info.recent).toLocaleString();
        }
        this.backup.at=info.at;
        if(info.at >= 0) {
            var h=parseInt(info.at/60);
            var m=parseInt(info.at % 60);
            this.backupAt= (h<10 ? ('0'+h) : (''+h))+ ':' + (m<10 ? ('0'+m) : (''+m));
        } else {
            this.backupAt='';
        }
        request({method:"GET",url:"/api/service/getinfo?service=backup"}, 'company').then(resp => {
            if(resp.code != RetCode.OK) return;
            this.backup.balance=resp.data.balance;
            this.backup.buckets=resp.data.ext.split(',');
        })
    }));

    Server.outsideGwInfo(__regsiterCallback(r=>{
        this.wan = {addr:r.data.addr, state:''+r.data.state, balance:0};
        request({method:"GET",url:"/api/service/getinfo?service=bridge"}, 'company').then(resp => {
            if(resp.code != RetCode.OK) {
                this.wan.state=0;
            } else {
                this.wan.balance=resp.data.balance;
            }
         })
    }));
},
switchWan() {
	if(this.wan.state!=0) {
		this.wan.state=0;
		if(this.wan.bridge<=0) {
		    this.turnOff('bridge');
		}
	} else {
		this.wan.state='1';
		this.turnOn('bridge');
	}
	this.changed=true;
},
switchBackup() {
	if(this.backup.at<0) {
		this.backup.at=120;
		this.backupAt='02:00';
		this.turnOn('backup');
	} else {
		this.backup.at=-1;
		this.backupAt='';
		if(this.backup.balance<=0) {
		    this.turnOff('backup');
		}
	}
	this.changed=true;
},
turnOn(service) {
	//只是在服务侧登记服务，并没有充值
	request({method:"PUT",url:"/api/service/turnon", data:{service:service}}, 'company').then(resp => {
		if(resp.code != RetCode.OK) {
			this.$refs.alertDlg.showErr(resp.code, resp.info);
		}
    });
},
turnOff(service) {
	request({method:"PUT",url:"/api/service/turnoff", data:{service:service}}, 'company').then(resp => {
		if(resp.code != RetCode.OK) {
			this.$refs.alertDlg.showErr(resp.code, resp.info);
		}
    });
},
backupAtChanged(c, details) {
	this.backup.at=details.minute + details.hour*60;
	this.changed=true;
},
bucketChanged() {
    if(this.backup.at<0) {
        this.backup.at=120;
        this.backupAt='02:00';
    }
    this.changed=true;
},
isValidWanIp(addr) {
    var pos=addr.indexOf(':');
    if(pos<=0) {
        return false;
    }
    var ip=addr.substring(0, pos);
    return !Http.isLanIp(ip);
},
save(){
    //自有公网IP的情况，需要填写外网地址
    if(this.wan.state==1) {
        if(!this.isValidWanIp(this.wan.addr)) {
            this.$refs.alertDlg.show(this.tags.needWanIp);
            return;
        }
        Server.setOutsideAddr(this.wan.addr, __regsiterCallback(resp=>{
            if(resp.code != RetCode.OK) {
                this.$refs.alertDlg.showErr(resp.code, resp.info);
            }
        }));
    }


    if(this.backup.at>=0) {
        if(this.backup.buckets.length==0) {
            this.$refs.alertDlg.show(this.tags.needBuckets);
            return;
        }
        var buckets='';
        for(var b of this.backup.buckets) { //转为字符串
            if(buckets!='') {buckets += ','}
            buckets += b;
        }
        var reqData={service:'backup', buckets:buckets};
        request({method:"PUT",url:"/api/oss/setmybuckets", data:reqData}, 'company').then(resp => {
            if(resp.code != RetCode.OK) {
                this.$refs.alertDlg.showErr(resp.code, resp.info);
            }
        });
    }
    Server.saveAdvancedCfg(JSON.stringify({backup:this.backup, wan:this.wan}),
        __regsiterCallback(resp=>{
            this.changed=false;
        })
    );
},
backupNow() {
    this.progress.dlg=true;
    this.progress.state=0;
    this.progress.icon='backup';
    this.progress.title=this.tags.backup;
    this.progress.info=this.tags.backupAlert;
    this.progress.act=()=>{
        this.progress.state=1;
        Server.backup(__regsiterCallback(resp=>{
            this.progress.state=2;
            if(resp.code != RetCode.OK) {
                this.progress.info=this.$refs.alertDlg.fmtErr(resp.code, resp.info);
            } else {
                this.progress.info=this.tags.backupSuccess;
           }
        }));
    }
},
restore() {
    var jsCbId = __regsiterCallback(resp=>{
        this.progress.state=2;
        if(resp.code != RetCode.OK) {
            this.progress.info=this.$refs.alertDlg.fmtErr(resp.code, resp.info);
        } else {
            this.progress.info=this.tags.restoreSuccess;
        }
    });
    this.progress.dlg=true;
    this.progress.state=0;
    this.progress.icon='cloud_download';
    this.progress.title=this.tags.restore;
    this.progress.info=this.tags.restoreAlert;
    this.progress.act=()=>{
        this.progress.state=1;
        Server.restore(jsCbId);
    }
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
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold"><td>{{tags.wanAccess}}</td><td></td></tr>
 <tr>
  <td>{{tags.state}}</td>
  <td>
   {{wan.state==0?tags.notStart:tags.running}}
   <q-btn outline icon="power_settings_new" :label="wan.state==0?tags.startup:tags.shutdown"
   color="primary" dense class="q-ml-md" @click="switchWan"></q-btn>
  </td>
 </tr>
 <tr v-show="wan.state!=0">
  <td>{{tags.wanType}}</td>
  <td>
   <q-option-group v-model="wan.state" :options="tags.wanTypeOpts"
     inline @update:model-value="changed=true"></q-option-group>
  </td>
 </tr>
 <tr v-show="wan.state==1">
  <td>{{tags.gwIp}}</td>
  <td><q-input v-model="wan.addr" dense @update:model-value="changed=true"
     :rules="[v=>isValidWanIp(v)||tags.needWanIp]"></q-input></td>
 </tr>
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold"><td>{{tags.backup}}</td><td></td></tr>
 <tr>
  <td>{{tags.state}}</td>
  <td>
   {{backup.at<0?tags.notStart:tags.running}}
   <q-btn outline icon="power_settings_new" :label="backup.at<0?tags.startup:tags.shutdown"
   @click="switchBackup" color="primary" dense class="q-ml-md"></q-btn>
  </td>
 </tr>
 <tr v-show="backup.at>=0">
  <td>{{tags.backupTime}}</td>
  <td>{{backup.recent}}</td>
 </tr>
 <tr v-show="backup.at>=0">
  <td>
   <q-btn flat icon="cloud_download" :label="tags.restore"
    @click="restore" color="primary" dense class="q-ml-md"></q-btn>
  </td><td>
   <q-btn outline icon="backup" :label="tags.backupNow"
    @click="backupNow" color="primary" dense></q-btn>
  </td>
 </tr>
 <tr v-show="backup.at>=0">
  <td>{{tags.backupAt}}</td>
  <td>{{backupAt}}
    <q-btn icon="access_time" flat color="primary">
      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
        <q-time v-model="backupAt" format24h @update:model-value="backupAtChanged"></q-time>
      </q-popup-proxy>
    </q-btn>
  </td>
 </tr>
 <tr>
  <td>{{tags.buckets}}</td>
  <td>
   <q-option-group type="checkbox" :options="bucketOpts" v-model="backup.buckets"
   @update:model-value="bucketChanged"></q-option-group>
  </td>
 </tr>
</q-markup-table>
<div style="text-align:center;" class="q-pa-md" v-show="changed">
 <q-btn :label="tags.save" @click="save" color="primary" icon="save"></q-btn>
</div>

 </q-page>
</q-page-container>
</q-layout>

<q-dialog v-model="progress.dlg" persistent>
  <q-card style="width:80vw" class="q-pa-lg">
   <q-card-section>
     <div class="text-h6">{{progress.title}}</div>
   </q-card-section>
   <q-card-section>
     <div v-show="progress.state!=1" style="height:7em;" v-html="progress.info"></div>
     <div class="text-center" v-show="progress.state==1">
     <q-circular-progress indeterminate size="7em" show-value
      :thickness="0.2" color="lime" center-color="grey-8"
      track-color="transparent" class="text-white q-ma-md" dense>
      <q-icon :name="progress.icon" size="2em" color="white"></q-icon>
     </q-circular-progress>
     </div>
    </q-card-section>
    <q-separator></q-separator>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="progress.act" v-show="progress.state==0"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup :disable="progress.state==1"></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></component-alert-dialog>
`
}