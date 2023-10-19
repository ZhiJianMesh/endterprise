export default {
inject:['service', 'tags'],
data() {return {
 creditCode:"",
 companyName:"",
 location:"",
 cid:"",
 dnsAccessCode:"",
 logoDlg:false,
 logo:"/assets/imgs/logo_example.png",
 width:0,

 loading:false,
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
    fixedNumber: [1, 1] 
 }
}},
created(){
    var w=document.documentElement.clientWidth;
    var h=document.documentElement.clientHeight;
    if(w>h) {
        this.width=parseInt(h*0.6);
    }else{
        this.width=parseInt(w*0.6);
    }
    this.init();
},
methods:{
init() {
    this.creditCode=Company.creditCode();
    this.companyName=Company.companyName();
    this.cid=Company.companyId();
    this.location=Company.location();
    this.dnsAccessCode=Server.getDnsAccessCode();
    var logoUrl=Http.cloudFileUrl("/logo?cid="+this.cid, "company");
    getExternal({url:logoUrl}).then(png=> {
        if(!png) {
            Console.debug("url:" + logoUrl + ",png:" + png);
            this.logo="./imgs/logo_example.png"
        } else {
            this.logo=png;
            Server.saveFile("company", "logo.txt", png);
        }
    });
},
register(){
    this.$refs.regDlg.show(()=>{
        this.init()
    });
},
resetAccessCode() {
    this.dnsAccessCode = Server.resetDnsAccessCode();
},
selectImg() {
  this.$refs.logoImg.dispatchEvent(new MouseEvent('click'))
},
startCropLogo(e) {
  this.loading=true;
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
	this.loading=false;
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
    var opts={method:"PUT",url:"/api/company/setLogo",data:{logo:data}};
    request(opts, "company").then(resp=>{
      if(resp.code!=RetCode.OK) {
        this.$refs.alertDlg.showErr(resp.code, resp.info);
        return;
      }
      this.logoDlg=false;
      this.$refs.cropper.stopCrop()
    });
  })
},
jump(pg) {
    this.$router.push('/' + pg)
}
},
template: `
<q-layout view="lHh lpr lFf" container style="height:100vh" v-cloak>
<q-header elevated>
   <q-toolbar>
      <q-avatar square><q-icon name="settings"></q-icon></q-avatar>
      <q-toolbar-title>{{tags.settings}}</q-toolbar-title>
      <q-btn round dense flat icon="bug_report" @click="jump('debug')"></q-btn>
   </q-toolbar>
</q-header>
<q-page-container>
 <q-page>
<q-markup-table bordered="false" flat class="q-pa-md">
 <tr>
   <td>{{tags.creditCode}}</td>
   <td>{{creditCode}}</td>
 </tr>
 <tr>
   <td>{{tags.companyName}}</td>
   <td>{{companyName}}</td>
 </tr>
 <tr>
   <td>{{tags.companyId}}</td>
   <td>{{cid}}</td>
 </tr>
 <tr>
   <td>{{tags.address}}</td>
   <td>{{location}}</td>
 </tr>
 <tr>
  <td>{{tags.logo}}</td>
  <td>
   <q-img :src="logo" style="width:5em;height:5em;" @click="logoDlg=true"></q-img>
  </td>
 </tr>
 <tr>
   <td>{{tags.dnsAccessCode}}</td>
   <td>
      {{dnsAccessCode}}
      <q-icon name="refresh" class="q-ml-md" color="primary" @click="resetAccessCode" size="1.5em"></q-icon>
   </td>
 </tr>
 <tr v-show="cid>0">
   <td>{{tags.advanced}}</td>
   <td @click="jump('advanced')">{{tags.wanAccess}}/{{tags.backup}}
      <q-icon name="miscellaneous_services" color="primary"
       size="2em" class="q-ml-md"></q-icon>
   </td>
 </tr>
 <tr><td></td><td></td></tr>
 <tr><td></td>
   <td>
    <q-btn icon="beenhere" :label="cid?tags.reRegister:(tags.login+'/'+tags.register)" @click="register" color="primary"></q-btn>
   </td>
 </tr>
</q-markup-table>
 </q-page>
</q-page-container>
</q-layout>

<q-dialog v-model="logoDlg">
 <q-card bordered>
   <q-card-section>
    <div class="row no-wrap">
     <div>
      <!-- logoOpts必须用v-bind不能用v-model -->
      <vue-cropper ref="cropper" v-bind="logoOpts" :style="{width:width+'px',height:width+'px'}"></vue-cropper>
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
   <q-inner-loading :showing="loading"><q-spinner-gears size="4em" color="primary"></q-spinner-gears></q-inner-loading>
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
<register-dialog :tags="tags" ref="regDlg"></register-dialog>
<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></component-alert-dialog>
`}