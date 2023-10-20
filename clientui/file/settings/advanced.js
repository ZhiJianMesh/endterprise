export default {
inject:['service', 'tags'],
data() {return {
company:{
    id:0,
    creditCode:"",
    name:"",
    location:{province:'',city:'',county:''},
    accessCode:"",
    logLevel:'DEBUG',
    accessToken:"",
    logo:"/assets/imgs/logo_example.png"
},
outsideAddr:'', //为空时，表示未开启
addrList:[],
backup:{
    at:-1,
    atStr:'',
    recent:'',
    balance:0,
    buckets:[] //id list
},
bucketOpts:[],
logoOpts:{
    img: "/assets/imgs/logo_example.png",
    size: 1,
    full: false,
    outputType: "png",
    canMove: true,
    fixedBox: true,
    original: false,
    canMoveBox: true,
    autoCrop: true,
    // 只有自动截图开启 宽度高度才生效
    autoCropWidth: 150,
    autoCropHeight: 150,
    centerBox: false,
    high: false,
    cropData: {},
    enlarge: 1,
    mode: 'contain',
    maxImgSize: 3000,
    limitMinSize: [50, 50],
    fixed: true,
    fixedNumber: [1, 1],
    
    dlg:false,
    width:'60vw',
    loading:false
},
logLevels:['DEBUG','INFO','WARN','ERROR'],
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
    var w=document.documentElement.clientWidth;
    var h=document.documentElement.clientHeight;
    if(w>h) {
        this.logoOpts.width=parseInt(h*0.6);
    }else{
        this.logoOpts.width=parseInt(w*0.6);
    }
    this.init();
},
methods:{
init() {
    var dta = {cmd:"query", items:[
        "accessCode", "backupAt", "creditCode",
        "companyName", "companyId",
        "province", "city", "county",
        "logLevel", "outsideAddr", "externAddrs"
    ]};
    request({method:"POST",url:"/command", data:dta}, "company").then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        var info=resp.data;
        this.company.accessCode=info.accessCode;
        this.company.name=info.companyName;
        this.company.id=info.companyId;
        this.company.creditCode=info.creditCode;
        this.company.location={province:info.province,city:info.city,county:info.county};
        this.logLevel=info.logLevel;
        this.outsideAddr=info.outsideAddr;
        
        var l=[];
        for(var addr of info.externAddrs) {
            l.push({label:addr, value:addr})
        }
        l.push({label:this.tags.dontSet, value:""});
        this.addrList=l;
        
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
            var h=parseInt(at/60);
            var m=parseInt(at % 60);
            this.backup.atStr=(h<10 ? ('0'+h) : (''+h))+ ':' + (m<10 ? ('0'+m) : (''+m));
        } else {
            this.backup.atStr='';
        }
        this.reqCompany({method:"GET",url:"/api/service/getinfo?service=backup"}).then(resp => {
            if(resp.code != RetCode.OK) {
                return;
            };
            this.backup.balance=resp.data.balance;
            this.backup.buckets=resp.data.ext.split(',');
        });
        Companies.getLogo(this.company.id, __regsiterCallback(png=> {
            if(png) {
                this.company.logo=png;
            }
        }));
    });
    
    this.reqCompany({method:"GET",url:"/oss/allbuckets"}).then(resp => {
        if(resp.code != RetCode.OK) {
            this.bucketOpts=[];
            return;
        }
        var opts=[];
        for(var b of resp.data.buckets) {
            opts.push({label:b.city,value:''+b.id});
        }
        this.bucketOpts=opts;
    })
},
reqCompany(opts) {
   opts.cloud=true;
   if(this.company.id>0) {
       opts.cid=this.company.id;
   } else {
       var company=this.service.curCompany();
       opts.cid=company.id;
   }

   return request(opts, 'company');
},
resetAccessCode() { //用于访问公司服务的接入码
    this.command({cmd:"resetAccessCode"}).then(resp=>{
        if(resp.code==RetCode.OK) {
            this.company.accessCode=resp.data.code;
        }
    });
},
resetAccessToken(){//用于访问公司调测服务的令牌
    this.command({cmd:"resetAccessToken"}).then(resp=>{
        if(resp.code==RetCode.OK) {
            this.company.accessToken=resp.data.token;
        }
    });
},
selectImg() {
  this.$refs.logoImg.dispatchEvent(new MouseEvent('click'))
},
startCropLogo(e) {
  this.logoOpts.loading=true;
  this.$refs.cropper.startCrop();
  //选择图片
  var file = e.target.files[0];
  if (!/\.(gif|jpg|jpeg|png|bmp|GIF|JPG|PNG)$/.test(e.target.value)) {
    this.$refs.alertDlg.show(this.tags.invalidImg);
    return false;
  }
  var reader = new FileReader()
  reader.onload = (e) => {
    var data
    if (typeof e.target.result === 'object') {
      // 把Array Buffer转化为blob 如果是base64不需要
      data = window.URL.createObjectURL(new Blob([e.target.result]))
    } else {
      data = e.target.result
    }
    this.logoOpts.img = data
    this.logoOpts.loading=false;
  }
  // reader.readAsDataURL(file)// 转化为base64
  reader.readAsArrayBuffer(file)// 转化为blob
},
zoom(in_out) {
  this.$refs.cropper.changeScale(in_out)
},
rotate(dir) {
  if(dir==1) {
    this.$refs.cropper.rotateLeft();
  } else {
    this.$refs.cropper.rotateRight();
  }
},
setLogo() {
  this.$refs.cropper.getCropData(logo => {
    this.company.logo=logo;
    this.reqCompany({method:"PUT",url:"/company/setLogo",data:{logo:logo}}).then(resp=>{
      if(resp.code!=RetCode.OK) {
        this.$refs.alertDlg.showErr(resp.code, resp.info);
        return;
      }
      Companies.saveLogo(this.company.id, logo);
      this.logoOpts.dlg=false;
      this.$refs.cropper.stopCrop()
    });
  })
},
switchBackup() {
    if(this.backup.at<0) {
        var at=120 + (new Date()).getTimezoneOffset();
        if(at < 0) { //转成UTC
            at += 1440;
        } else if(at >= 1440) {
            at -= 1440;
        }
        this.backup.at=at;
        this.backup.atStr='02:00';
        this.turnOn('backup');
    } else {
        this.backup.at=-1;
        this.backup.atStr='';
        if(this.backup.balance<=0) {
            this.turnOff('backup');
        }
    }
},
turnOn(service) {
    //只是在服务侧登记服务，并没有充值
    this.reqCompany({method:"PUT",url:"/api/service/turnon", data:{service:service}}).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
        }
    });
},
turnOff(service) {
    this.reqCompany({method:"PUT",url:"/api/service/turnoff",data:{service:service}}).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
        }
    });
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
        data:{service:'backup',buckets:buckets}};
    this.reqCompany(opts, 'company').then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        };
        this.command({cmd:'setBackup', at:this.backup.at}).then(resp => {
            if(resp.code != RetCode.OK) {
                this.$refs.alertDlg.showErr(resp.code, resp.info);
            }
        });
    });
},
backupAtChanged(v, details) {
    var at=details.minute + details.hour*60;
    at += (new Date()).getTimezoneOffset();
    if(at < 0) { //转成UTC，在端侧才有效
        at += 1440;
    } else if(at >= 1440) {
        at -= 1440;
    }
    this.backup.at=at;
    this.bucketChanged();
},
command(reqDta) {
    var opts={method:"POST", url:"/command", data:reqDta};
    return request(opts, 'company').then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
        }
        return resp;
    });
},
outsideAddrChged() {
    if(!Http.isIPv4(this.outsideAddr) && !Http.isIPv6(this.outsideAddr)) {
        return;
    }
    if(Http.isLanIP(this.outsideAddr)) {
        this.$refs.alertDlg.show(this.outsideAddr + this.tags.invalidExtIP);
        return;
    }
    //自有公网IP的情况，需要选择外网地址
    this.command({addr:this.outsideAddr,cmd:"setOutsideAddr"})
},
logLevelChged() {
    this.command({level:this.company.logLevel,cmd:"setLogLevel"})
},
addrChged() {
    this.command({cmd:"setInfo",
        province:this.company.location.province,
        city:this.company.location.city,
        county:this.company.location.county
    });
},
nameChged() {
    this.command({cmd:"setInfo", name:this.company.name});
},
backupNow() {
    this.progress.dlg=true;
    this.progress.state=0;
    this.progress.icon='backup';
    this.progress.title=this.tags.company.backup;
    this.progress.info=this.tags.backupAlert;
    this.progress.act=()=>{
        this.progress.state=1;
        request({method:"POST",url:"/command", data:{cmd:"backup"}}, 'company').then(resp => {
            this.progress.state=2;
            if(resp.code != RetCode.OK) {
                this.progress.info=this.$refs.alertDlg.fmtErr(resp.code, resp.info);
            } else {
                this.progress.info=this.tags.backupSuccess;
            }
        });
    }
},
restore() {
    this.progress.dlg=true;
    this.progress.state=0;
    this.progress.icon='cloud_download';
    this.progress.title=this.tags.company.restore;
    this.progress.info=this.tags.restoreAlert;
    this.progress.act=()=>{
        this.progress.state=1;
        this.command({cmd:"restore"}).then(resp => {
            this.progress.state=2;
            if(resp.code != RetCode.OK) {
                this.progress.info=this.$refs.alertDlg.fmtErr(resp.code, resp.info);
            } else {
                this.progress.info=this.tags.restoreSuccess;
            }
        });
    }
}
},
template: `
<q-layout view="hHh lpr fFf" container style="height:100vh" v-cloak>
<q-header class="bg-grey-1 text-primary">
   <q-toolbar>
      <q-btn flat icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.company.title}}</q-toolbar-title>
   </q-toolbar>
</q-header>
<q-page-container>
 <q-page>
<q-markup-table bordered="false" flat>
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold">
  <td>{{tags.company.baseSettings}}</td><td></td>
 </tr>
 <tr>
   <td>{{tags.company.id}}</td>
   <td>{{company.id}}</td>
 </tr>
 <tr>
   <td>{{tags.company.creditCode}}</td>
   <td>{{company.creditCode}}</td>
 </tr>
 <tr>
   <td>{{tags.company.name}}</td>
   <td class="cursor-pointer">{{company.name}}
    <q-popup-edit v-model="company.name" auto-save v-slot="scope" @update:model-value="nameChged">
      <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set"></q-input>
    </q-popup-edit>
   </td>
 </tr>
 <tr>
   <td>{{tags.company.address}}</td>
   <td class="cursor-pointer">
    <address-input v-model="company.location"
     @update:model-value="addrChged"></address-input>
  </td>
 </tr>
 <tr>
   <td>{{tags.company.logLevel}}</td>
   <td>
    <q-select v-model="company.logLevel" :options="logLevels"
     @update:model-value="logLevelChged" dense></q-select>
   </td>
 </tr>
 <tr>
  <td>{{tags.company.logo}}</td>
  <td>
   <q-img :src="company.logo" style="width:5em;height:5em;" @click="logoOpts.dlg=true"></q-img>
  </td>
 </tr>
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold">
  <td>{{tags.company.security}}</td><td></td>
 </tr>
 <tr>
   <td>{{tags.company.accessCode}}</td>
   <td>{{company.accessCode}}
      <q-icon name="refresh" class="q-ml-md" color="primary" @click="resetAccessCode" size="1.5em"></q-icon>
   </td>
 </tr>
 <tr>
   <td>{{tags.company.accessToken}}<q-icon name="key"></q-icon></td>
   <td>{{company.accessToken}}
      <q-icon name="refresh" class="q-ml-md" color="primary" @click="resetAccessToken" size="1.5em"></q-icon>
   </td>
 </tr>
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold">
  <td>{{tags.company.wanAccess}}</td><td></td>
 </tr>
 <tr>
  <td>{{tags.company.pubGwIp}}</td>
  <td>
    <q-select v-model="outsideAddr" :options="addrList" emit-value
     @update:model-value="outsideAddrChged" dense></q-select>
  </td>
 </tr>
 <tr>
  <td>{{tags.company.setGwIp}}</td>
  <td>
   <q-input v-model="outsideAddr">
    <template v-slot:append>
     <q-btn icon="done_all" @click="outsideAddrChged" flat></q-btn>
    </template>
   </q-input>
  </td>
 </tr>
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold">
  <td>{{tags.company.backup}}</td>
  <td align="right">
   <q-btn flat icon="power_settings_new" :label="backup.at<0?tags.startup:tags.shutdown"
   @click="switchBackup" color="primary" dense class="q-ml-md"></q-btn>
  </td>
 </tr>
 <tr v-show="backup.at>=0">
  <td>{{tags.company.recentBackup}}</td>
  <td>{{backup.recent}}</td>
 </tr>
 <tr v-show="backup.at>=0">
  <td>
   <q-btn flat icon="cloud_download" :label="tags.company.restore"
    @click="restore" color="primary" dense class="q-ml-md"></q-btn>
  </td><td>
   <q-btn outline icon="backup" :label="tags.company.backupNow"
    @click="backupNow" color="primary" dense></q-btn>
  </td>
 </tr>
 <tr v-show="backup.at>=0">
  <td>{{tags.company.backupAt}}</td>
  <td>{{backup.atStr}}
    <q-btn icon="access_time" flat color="primary">
      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
        <q-time v-model="backup.atStr" format24h @update:model-value="backupAtChanged"></q-time>
      </q-popup-proxy>
    </q-btn>
  </td>
 </tr>
 <tr v-show="backup.at>=0">
  <td>{{tags.company.buckets}}</td>
  <td>
   <q-option-group type="checkbox" :options="bucketOpts"
    v-model="backup.buckets" @update:model-value="bucketChanged"></q-option-group>
  </td>
 </tr>
</q-markup-table>

 </q-page>
</q-page-container>
</q-layout>

<q-dialog v-model="logoOpts.dlg">
 <q-card bordered>
   <q-card-section>
    <div class="row no-wrap">
     <div>
      <!-- logoOpts必须用v-bind不能用v-model -->
      <vue-cropper ref="cropper" v-bind="logoOpts"
       :style="{width:logoOpts.width+'px',height:logoOpts.width+'px'}">
      </vue-cropper>
     </div>
     <div class="column items-start">
        <q-btn flat icon="burst_mode" color="primary" @click="selectImg" size="1.4em"></q-btn>
        <q-btn flat icon="zoom_in" color="accent" @click="zoom(1)" size="1.2em"></q-btn>
        <q-btn flat icon="zoom_out" color="accent" @click="zoom(-1)" size="1.2em"></q-btn>
        <q-btn flat icon="rotate_left" color="accent" @click="rotate(1)" size="1.2em"></q-btn>
        <q-btn flat icon="rotate_right" color="accent" @click="rotate(-1)" size="1.2em"></q-btn>
     </div>
    </div>
   </q-card-section>
   <q-inner-loading :showing="logoOpts.loading"><q-spinner-gears size="4em" color="primary"></q-spinner-gears></q-inner-loading>
   <q-card-actions align="right" class="text-primary">
    <q-btn flat :label="tags.ok" @click="setLogo"></q-btn>
    <q-btn flat :label="tags.cancel" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
 <input type="file" ref="logoImg" v-show="false"
   style="position:absolute;clip:rect(0 0 0 0);"
   accept="image/png, image/jpeg, image/gif, image/jpg"
   @change="startCropLogo($event)">
</q-dialog>

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

<register-dialog :tags="tags" ref="regDlg"></register-dialog>
<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></component-alert-dialog>
`}