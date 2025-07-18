export default {
inject:['service', 'tags'],
data() {return {
 creditCode:"",
 companyName:"",
 location:{province:'',city:'',county:''},
 cid:"",
 accessCode:"", //8位服务器接入码
 accessToken:'', //10位调测令牌
 outsideAddr:"",
 logo:"/assets/imgs/logo_example.png",
 logLevel:'DEBUG',
 logLevels:[{label:'Debug',value:"DEBUG"},{label:'Info',value:"INFO"},
   {label:'Warn',value:"WARN"},{label:'Error',value:"ERROR"}],
 addrList:[],
 dlgs:{chgPwd:false,setLogo:false,testing:false},
 chgPwdDta:{oldPwd:'',newPwd:'',cfmPwd:'',vis:false,dlg:false},
 testing:false,
 platformVersion:"",

 logoOpts:{
    img: "",
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
    width:0,
    loading:false
 }
}},
created(){
    this.init();
    var w=document.documentElement.clientWidth;
    var h=document.documentElement.clientHeight;
    if(w>h) {
        this.logoOpts.width=parseInt(h*0.6);
    }else{
        this.logoOpts.width=parseInt(w*0.6);
    }
    this.platformVersion=Platform.version();
},
methods:{
init() {
    this.cid=Company.id();
    if(this.cid <=0) {
        return;
    }
    Company.getLogo(this.cid, __regsiterCallback(png=> {
        if(png) {
            this.logo=png;
        }
    }));
    var items = "accessCode,creditCode,companyName,province,city,county,logLevel,outsideAddr,externAddrs";
    Server.query(items, __regsiterCallback(resp => {
        var info=resp.data;
        this.accessCode=info.accessCode;
        this.companyName=info.companyName;
        this.creditCode=info.creditCode;
        this.location={province:info.province, city:info.city, county:info.county};
        this.logLevel=info.logLevel;
        this.outsideAddr=info.outsideAddr;

        var l=[];
        for(var addr of info.externAddrs) {
            l.push({label:addr, value:addr})
        }
        l.push({label:this.tags.dontSet, value:""});
        this.addrList=l;
    }));
},
register(){
    this.$refs.regDlg.show(()=>{
        this.init()
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
    return false
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
  this.$refs.cropper.getCropData(data => {
    this.logo=data;
    var opts={method:"PUT",url:"/api/company/setLogo",data:{logo:data},cloud:true};
    request(opts, "company").then(resp=>{
      if(resp.code!=RetCode.OK) {
        this.$refs.alertDlg.showErr(resp.code, resp.info);
        return;
      }
      Company.saveLogo(this.cid, data);
      this.logoOpts.dlg=false;
      this.$refs.cropper.stopCrop()
    });
  })
},
nameChged(){
    Server.setName(this.companyName,__regsiterCallback(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
        }
    }));
},
outsideAddrAdded(val, initVal) {
    if(!Http.isIPv4(val) && !Http.isIPv6(val)) {
        return;
    }
    //自有公网IP的情况，需要设置外网地址
    if(Http.isLanIP(val)) {
        this.$refs.alertDlg.show(val + this.tags.invalidExtIP);
        return;
    }
    Server.setOutsideAddr(val, __regsiterCallback(resp=>{
      if(resp.code!=RetCode.OK) {
        this.$refs.alertDlg.showErr(resp.code, resp.info);
      }else {
        this.addrList.push({label:val,value:val});
        this.outsideAddr=val;
      }  
    }));
},
outsideAddrChged() {
    Server.setOutsideAddr(this.outsideAddr, __regsiterCallback(resp=>{
      if(resp.code!=RetCode.OK) {
        this.$refs.alertDlg.showErr(resp.code, resp.info);
      }  
    }));
},
saveAccessCode(val, initVal) { //httpdns接入码
    if(Server.startupAt()<=0) { //服务没启动
        this.$refs.alertDlg.show(this.tags.serverNotStart);
        return;
    }
    Server.saveAccessCode(val, __regsiterCallback(resp => {
        if(resp.code!=RetCode.OK) {
			this.$refs.alertDlg.showErr(resp.code, resp.info);
		} else {
            this.accessCode=val;
        }
    }));
},
resetAccessCode() { //远程调测接入码
    if(Server.startupAt()<=0) { //服务没启动
        this.$refs.alertDlg.show(this.tags.serverNotStart);
        return;
    }
    Server.resetAccessCode(__regsiterCallback(resp => {
        if(resp.code==RetCode.OK) {
            this.accessCode=resp.data.code;
        } else {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
        }
    }));
},
setLogLevel() {
    Server.setLogLevel(this.logLevel);
},
resetAccessToken(){//用于重置公司调测服务的令牌
    this.accessToken = Server.resetAccessToken();
},
locationChged() {
    Server.setLocation(this.location.province, this.location.city, this.location.county,
    __regsiterCallback(resp=>{
          if(resp.code!=RetCode.OK) {
              this.$refs.alertDlg.showErr(resp.code, resp.info);
          }
    }));
},
connectionTest() {
    if(Server.startupAt()<=0||this.testing) { //服务没启动
        this.$refs.alertDlg.show(this.tags.serverNotStart);
        return;
    }
    var addr;
    if(Http.isIPv6(this.outsideAddr)) {
        addr='['+this.outsideAddr+']:8523';
    } else {
        addr=this.outsideAddr+':8523';
    }
    this.testing=true;
    var opts={method:"GET",url:"/api/test?addr="+addr,cloud:true};
    request(opts, "httpdns").then(resp=>{
      this.testing=false;
      if(resp.code!=RetCode.OK) {
        this.$refs.alertDlg.show(this.tags.failToConnect + addr);
      } else {
        this.$refs.alertDlg.show(this.tags.succeedToConnect + addr);
      }
    });
},
changePwd() {
    Company.changePwd(this.chgPwdDta.oldPwd,this.chgPwdDta.newPwd,this.chgPwdDta.cfmPwd,
	__regsiterCallback(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
        } else {
    		this.chgPwdDta={oldPwd:'',newPwd:'',cfmPwd:'',vis:false,dlg:false};
	        this.$refs.alertDlg.show(this.tags.successToChgPwd);
		}
    }));
}
},
template: `
<q-layout view="hHh lpr fFf">
<q-header elevated>
   <q-toolbar>
      <q-avatar square><q-icon name="settings"></q-icon></q-avatar>
      <q-toolbar-title>{{tags.settings}}</q-toolbar-title>
      <q-chip clickable color="primary" text-color="white" @click="register">
        <q-avatar><q-icon name="beenhere"></q-icon></q-avatar>
        {{cid?tags.reRegister:(tags.login+'/'+tags.register)}}
      </q-chip>
   </q-toolbar>
</q-header>
<q-page-container>
 <q-page>
<q-markup-table bordered="false" flat>
 <tr class="q-mb-sm text-dark bg-blue-grey-1">
  <td class="text-bold">{{tags.baseSettings}}</td><td></td>
 </tr>
 <tr>
   <td>{{tags.companyId}}</td>
   <td>{{cid}}<q-badge color="primary" @click="chgPwdDta.dlg=true" class="q-ml-md">{{tags.chgPwd}}</q-badge></td>
 </tr>
 <tr>
   <td>{{tags.creditCode}}</td>
   <td>{{creditCode}}</td>
 </tr>
 <tr>
   <td>{{tags.companyName}}</td>
   <td class="cursor-pointer">{{companyName}}
    <q-popup-edit v-model="companyName" v-slot="scope" @update:model-value="nameChged"
     buttons :label-set="tags.ok" :label-cancel="tags.cancel" auto-save>
      <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set"></q-input>
    </q-popup-edit>
   </td>
 </tr>
 <tr>
   <td>{{tags.address}}</td>
   <td class="cursor-pointer">
    <address-dialog v-model="location" @confirm:model-value="locationChged"></address-dialog>
   </td>
 </tr>
 <tr>
  <td>{{tags.logo}}</td>
  <td>
   <q-img :src="logo" style="width:5em;height:5em;" @click="logoOpts.dlg=true"></q-img>
  </td>
 </tr>
 <tr v-show="cid>0">
   <td>{{tags.backup}}</td>
   <td @click="service.jump('/backup')">
    <q-icon name="cloud_sync" color="primary" size="2em" class="q-ml-md"></q-icon>
   </td>
 </tr>
 <tr>
    <td>{{tags.platformVersion}}</td>
    <td>{{platformVersion}}</td>
 </tr>
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold">
  <td>{{tags.nwSettings}}</td><td></td>
 </tr>
 <tr>
   <td>{{tags.accessCode}}</td>
   <td>
    <span>{{accessCode}}
     <q-popup-edit v-slot="scope" @save="saveAccessCode" v-model="accessCode"
      buttons :label-set="tags.ok" :label-cancel="tags.cancel" auto-save>
      <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set"></q-input>
     </q-popup-edit>
    </span>
    <q-btn round dense flat icon="auto_mode" text-color="secondary"
     @click="resetAccessCode" class="q-ml-md"></q-btn>
   </td>
 </tr>
 <tr>
  <td>{{tags.pubGwIp}}</td>
  <td>
   <q-option-group dense color="primary" v-model="outsideAddr" :options="addrList"
    @update:model-value="outsideAddrChged" style="overflow-wrap: break-all;"></q-option-group>
   
   <span>
    <q-btn round dense flat icon="add_circle" color="primary" class="q-ma-none">
    <q-popup-edit v-slot="scope" @save="outsideAddrAdded"
     buttons :label-set="tags.ok" :label-cancel="tags.cancel" auto-save>
     <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set"></q-input>
    </q-popup-edit>
    {{tags.addGw}}</q-btn>
   </span>

   <span v-show="outsideAddr!=''">
    <q-circular-progress :indeterminate="testing" show-value size="3em"
     @click="connectionTest" thickness="0.3" color="yellow"
      track-color="transparent" class="text-white q-ml-lg" dense>
     <q-icon name="leak_add" color="secondary" class="q-ma-none" size="2em"></q-icon>
    </q-circular-progress>{{tags.testGw}}
   </span>
  </td>
 </tr>
 <tr class="q-mb-sm text-dark bg-blue-grey-1 text-bold"><td>{{tags.testSettings}}</td><td></td></tr>
 <tr>
   <td>{{tags.accessToken}}</td>
   <td>
    <q-chip style="min-width:11em" dense>
     <q-avatar color="orange" icon="key" @click="resetAccessToken" size="2em"></q-avatar>{{accessToken}}
    </q-chip>
   </td>
 </tr>
 <tr>
   <td>{{tags.logLevel}}</td>
   <td>
    <q-option-group dense color="primary"
     v-model="logLevel" :options="logLevels" @update:model-value="setLogLevel"></q-option-group>
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
      <vue-cropper ref="cropper" v-bind="logoOpts" :style="{width:logoOpts.width+'px',height:logoOpts.width+'px'}"></vue-cropper>
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
   accept="image/png,image/jpeg,image/gif,image/jpg"
   @change="startCropLogo($event)">
</q-dialog>

<q-dialog v-model="chgPwdDta.dlg">
 <q-card bordered>
   <q-card-section>
    <q-input v-model="chgPwdDta.oldPwd" :label="tags.oldPwd" dense :type="chgPwdDta.vis ? 'text':'password'">
     <template v-slot:append>
      <q-icon :name="chgPwdDta.vis ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="chgPwdDta.vis=!chgPwdDta.vis"></q-icon>
     </template>
    </q-input>
    <q-input v-model="chgPwdDta.newPwd" :label="tags.newPwd" dense :type="chgPwdDta.vis ? 'text':'password'">
     <template v-slot:append>
      <q-icon :name="chgPwdDta.vis ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="chgPwdDta.vis=!chgPwdDta.vis"></q-icon>
     </template>
    </q-input>
    <q-input v-model="chgPwdDta.cfmPwd" :label="tags.cfmPwd" dense :type="chgPwdDta.vis ? 'text':'password'"
     :rules="[v=>chgPwdDta.newPwd==chgPwdDta.cfmPwd||tags.invalidCfmPwd]">
     <template v-slot:append>
      <q-icon :name="chgPwdDta.vis ? 'visibility':'visibility_off'"
        class="cursor-pointer" @click="chgPwdDta.vis=!chgPwdDta.vis"></q-icon>
     </template>
    </q-input>
   </q-card-section>
   <q-card-actions align="right" class="text-primary">
    <q-btn flat :label="tags.ok" @click="changePwd"></q-btn>
    <q-btn flat :label="tags.cancel" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<register-dialog :tags="tags" ref="regDlg"></register-dialog>
<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs" ref="alertDlg"></component-alert-dialog>
`}