export default {
inject:['service', 'tags'],
data() {return {
    outsideAddr:'',
    backup:{
        at:-1,
        atObj:'',
        recent:'',
        balance:0,
        buckets:[] //id list
    },
    addrList:[],
	bucketOpts:[]//[{label:'xxx',value:123}...]
}},
created(){
    this.init();
},
methods:{
init() {
    request({method:"GET",url:"/api/oss/allbuckets",cloud:true}, 'company').then(resp => {
        if(resp.code != RetCode.OK) {
            this.bucketOpts=[];
            return;
        }
        var opts=[];
        for(var b of resp.data.buckets) {
            opts.push({label:b.city, value:''+b.id});
        }
        this.bucketOpts=opts;
    });
    Server.query("backupAt", __regsiterCallback(resp => {
        var info=resp.data;
        if(info.recent<=0) {
            this.backup.recent=this.tags.neverBackup;
        } else {
            this.backup.recent=new Date(info.recent).toLocaleString();
        }
        this.backup.at=info.backupAt;
        if(info.backupAt >= 0) {
            var at = info.backupAt - (new Date()).getTimezoneOffset();
            if(at < 0) { //转成UTC
                at += 1440;
            } else if(at >= 1440) {
                at -= 1440;
            }
            var h=parseInt(at / 60);
            var m=parseInt(at % 60);
            this.backup.atObj=(h<10 ? ('0'+h) : (''+h))+ ':' + (m<10 ? ('0'+m) : (''+m));
        } else {
            this.backup.atObj='';
        }
    }));
    //从云侧获取已选中的bucket
    request({method:"GET",url:"/api/service/getinfo?service=backup", cloud:true}, 'company').then(resp => {
        if(resp.code != RetCode.OK) return;
        this.backup.balance=resp.data.balance;
        this.backup.buckets=resp.data.ext.split(',');
    });
},
switchBackup() {
    if(this.backup.at<0) {
        var at=120+(new Date()).getTimezoneOffset(); //默认凌晨2点
        if(at < 0) { //转成UTC
            at += 1440;
        } else if(at >= 1440) {
            at -= 1440;
        }
        this.backup.at=at;
        this.backup.atObj='02:00';
        this.turnOn('backup');
    } else {
        this.backup.at=-1;
		this.backup.atObj='';
        if(this.backup.balance<=0) {
            this.turnOff('backup');
        }
    }
    this.saveBackupAt();
},
turnOn(service) {
	//只是在服务侧登记服务，并没有充值
	request({method:"PUT",url:"/api/service/turnon", data:{service:service}, cloud:true}, 'company').then(resp => {
		if(resp.code != RetCode.OK) {
			this.$refs.alertDlg.showErr(resp.code, resp.info);
		}
    })
},
turnOff(service) {
	request({method:"DELETE",url:"/api/service/turnoff?service="+service, cloud:true}, 'company').then(resp => {
		if(resp.code != RetCode.OK) {
			this.$refs.alertDlg.showErr(resp.code, resp.info);
		}
    })
},
bucketChanged() {
    var buckets='';
    for(var b of this.backup.buckets) { //转为字符串
        if(buckets!='') buckets += ',';
        if(b!='') buckets += b;
    }
    if(buckets.length==0) {
        this.$refs.alertDlg.show(this.tags.needBuckets);
        return;
    }
    var opts={method:"PUT",url:"/api/oss/setmybuckets",
        data:{service:'backup',buckets:buckets},cloud:true};
    request(opts, 'company').then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        };
    });
},
backupAtChanged(v, details) {
    if(this.backup.at<0)return;//尚未从服务器查询到时，不必保存，因为刚进页面时，会触发设置为当前时间
    this.backup.at=details.minute + details.hour*60;
    this.saveBackupAt();
},
saveBackupAt() {
    var at = this.backup.at;
    if(at>=0) {
        at += (new Date()).getTimezoneOffset(); //java中时区偏移是正值,js中是负值
        if(at < 0) { //转成UTC，在端侧才有效
            at += 1440;
        } else if(at >= 1440) {
            at -= 1440;
        }
    }
    Server.setBackupAt(at, __regsiterCallback(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
        };
    }));
},
backupNow() {
  this.$refs.procDlg.show(this.tags.backup,
    this.tags.backupAlert, 'backup',
    (dlg)=> {
      dlg.setInfo('');
      return new Promise(resolve=>{
        Server.backup(__regsiterCallback(resp=>{resolve(resp)}));
      })
    },
    (dlg,resp)=> {
      if(resp.code!=RetCode.OK) {
        dlg.setInfo(formatErr(resp.code, resp.info));
      } else {
        dlg.setInfo(this.tags.backupSuccess);
        this.backup.recent=(new Date()).toLocaleString();
      }
    }
  )
},
restore() {
  this.$refs.procDlg.show(this.tags.restore,
    this.tags.restoreAlert, 'cloud_download',
    (dlg)=> {
      dlg.setInfo('');
      return new Promise(resolve=>{
        Server.restore(__regsiterCallback(resp=>{resolve(resp)}));
      })
    },
    (dlg,resp)=> {
      if(resp.code!=RetCode.OK) {
        dlg.setInfo(formatErr(resp.code, resp.info));
      } else {
        dlg.setInfo(this.tags.restoreSuccess);
      }
    }
  )
}
},
template: `
<q-layout view="hHh lpr fFf">
<q-header elevated class="primary">
   <q-toolbar>
     <q-avatar square><q-icon name="arrow_back" @click="service.go_back"></q-icon></q-avatar>
     <q-toolbar-title>{{tags.backup}}</q-toolbar-title>
     <q-btn icon="power_settings_new" :label="backup.at<0?tags.startup:tags.shutdown"
       @click="switchBackup" dense rounded color="primary"></q-btn>
   </q-toolbar>
</q-header>
<q-page-container>
 <q-page>
<q-markup-table bordered="false" flat>
 <tr>
  <td>{{tags.backupTime}}</td>
  <td>{{backup.recent}}</td>
 </tr>
 <tr>
  <td>
   <q-btn flat icon="cloud_download" :label="tags.restore"
    @click="restore" color="primary" dense class="q-ml-md"
    :disable="backup.at<0"></q-btn>
  </td><td>
   <q-btn outline icon="backup" :label="tags.backupNow"
    @click="backupNow" color="primary" dense
    :disable="backup.at<0"></q-btn>
  </td>
 </tr>
 <tr>
  <td>{{tags.backupAt}}</td>
  <td>
   <time-input v-model="backup.atObj" :showSecond="false"
    @update:model-value="backupAtChanged"
    :disable="backup.at<0"></time-input>
  </td>
 </tr>
 <tr>
  <td>{{tags.buckets}}</td>
  <td>
   <q-option-group type="checkbox" :options="bucketOpts" v-model="backup.buckets"
   @update:model-value="bucketChanged" :disable="backup.at<0"></q-option-group>
  </td>
 </tr>
</q-markup-table>

 </q-page>
</q-page-container>
</q-layout>

<component-process-dialog ref="procDlg"></component-process-dialog>
<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs" ref="alertDlg"></component-alert-dialog>
`
}