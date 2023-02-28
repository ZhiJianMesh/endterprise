export default {
inject: ['service', 'tags'],
data() {return {
    name: this.$route.query.service,
    app: {}, //service,displayName,author,type,level,ver,stars,installs,cmt,recentUpd,baseUrls
    subTitle:'',
    preImgNo:0,
    intro:{descrs:[],images:[]},
    baseUrl:'',
    action: this.tags.waitting,
    imgWidth:'45vw',
    install:{percent:0,info:"",dlg:false,hasNew:false,normal:false}
}},
created() {
    if(document.documentElement.clientWidth>document.documentElement.clientHeight) {
        this.imgWidth="30vw";
    }
    this.app=this.emptyDtl();
    request({method:"GET",url:"/api/service/detail?service="+this.name, private:false},"service").then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.app = resp.data;
        var ss=JSON.parse(resp.data.baseUrls); //随机挑选一个
        var n=Math.floor(Math.random()*ss.length);
        var s=ss[n];
        if(s.substring(s.length-1,s.length)=='/') {
            s=s.substring(0,s.length-1);//去掉结尾的分隔符
        }
        this.app['icon']=s+"/file/favicon.png";
        var v = parseInt(resp.data.ver);
        this.app['intVer']=v;
        this.app.ver=Math.floor(v/1000000)+'.'+(Math.floor(v/1000)%1000)+'.'+(v%1000);
        this.baseUrl=s+"/release/" +this.app.ver;

        var dt=new Date(resp.data.recentUpd);
        this.app['updateAt']=dt.toLocaleDateString();
		this.refreshUI();
        return this.service.getExternal({url:this.baseUrl + "/introduction.json"});
    }).then((s)=> {
        if(!s) {return}
        var o=JSON.parse(s);
        if(!o || !o.introduce) {
            return;
        }
        var intro=o.introduce;
        if(intro.images && intro.images.length>0) {
            for(var i in intro.images) {
                var src=intro.images[i].src;
                if(src.substring(0,1)=="/") {
                    intro.images[i].src=this.baseUrl+src;
                } else {
                    intro.images[i].src=this.baseUrl+'/'+src;
                }
            }
            this.subTitle = intro.images[0].info;
        }
        this.intro=intro;
    });
},
mounted() {
  window.installProgress = this.progress;//用于显示进度
},
methods: {
scroll(event) {
    if(!this.intro||!this.intro.images) {
        return;
    }
    var n=this.intro.images.length;
    var i=parseInt(event.horizontalPercentage*n);
    if(i<n && this.preImgNo!=i) {
        this.subTitle = this.intro.images[i].info;
        this.preImgNo=i;
    }
},
appAction() {
    this.install.dlg=true;
    this.install.percent=0;
    this.install.info="";
    var jsCbId=__regsiterCallback(this.refreshUI);
    var locVer=Server.getServiceVer(this.app.service);
    if (locVer>0) {
        Server.updateService(this.app.service, jsCbId);
    } else {
        Server.installService(this.app.service, jsCbId);
    }
},
refreshUI(resp) {
    if(resp && resp.code != RetCode.OK) {
        this.$refs.errDlg.showErr(resp.code, resp.info);
    }
    this.install={dlg:false,percent:0,info:"",hasNew:true,normal:false};
    var locVer=Server.getServiceVer(this.app.service);
    if (locVer>0) {//已安装，否则<=0
        this.install.hasNew=locVer<this.app.intVer;
		this.install.normal=this.app.level>4;
        this.action = this.tags.update;
        Console.info("App " + this.app.service + " is installed");
    } else {
        this.action = this.tags.install;
        Console.info("App " + this.app.service + " is not installed");
    }
},
giveStar() {
    request({method:"GET",url:"/api/service/star?service="+this.name},"service").then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.app.stars=resp.data.stars;
    });
},
emptyDtl() {
    return {service:'', displayName:'', author:'', type:'', ver:'',intVer:0,
     stars:0, installs:0, cmt:'', recentUpd:'', baseUrl:''}
},
unInstall() {
    var jsCbId=__regsiterCallback(this.refreshUI);
	Server.unInstallService(this.app.service,jsCbId);
},
progress(inc,info){
    if(this.install.percent+inc>100) {
		this.install.percent=100;
	} else {
		this.install.percent+=inc;
	}
    this.install.info=info;
}
},
template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-3">
   <q-list class="q-pa-sm" dense>
    <q-item>
     <q-item-section thumbnail>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back" class="text-primary"></q-btn>
     </q-avatar></q-item-section>
     <q-item-section avatar><q-avatar square><img :src="app.icon"></q-avatar></q-item-section>
     <q-item-section>
      <q-item-label class="text-primary">{{app.displayName}}/{{app.service}}</q-item-label>
      <q-item-label caption class="text-black">{{tags.author}} {{app.author}}</q-item-label>
      <q-item-label caption class="text-black">{{tags.version}} {{app.ver}}</q-item-label>
      <q-item-label caption class="text-black">{{tags.updateAt}} {{app.updateAt}}</q-item-label>
     </q-item-section>
    </q-item>
   </q-list>
  </q-header>
  <q-footer bordered class="bg-grey-2">
    <q-toolbar class="row justify-center">
      <q-btn rounded color="primary" :label="action" @click="appAction" v-show="install.hasNew"></q-btn>
	  <q-btn outline rounded color="primary" :label="tags.unInstall" @click="unInstall" v-show="install.normal"></q-btn>
    </q-toolbar>
  </q-footer>

   <q-page-container>
     <q-page class="q-pa-none">
<div class="q-py-xs q-px-md" @click="giveStar">
 <q-chip outline color="deep-orange" text-color="white" icon="star">{{app.stars}}</q-chip>
 <q-chip outline color="primary" text-color="white" icon="cloud_download">{{app.installs}}</q-chip>
</div>
<q-list class="q-pa-sm">
<q-item>
 <q-item-section>
  <q-item-label v-for="descr in intro.descrs" style="text-indent:2em;">{{descr}}</q-item-label>
  <q-item-label caption>{{subTitle}}</q-item-label>
 </q-item-section>
</q-item>
<q-item>
 <q-item-section>
  <q-scroll-area style="height:60vh;width:100%;" horizontal @scroll="scroll">
  <div class="row no-wrap">
   <div v-for="img in intro.images" class="q-pa-sm">
	<q-img :src="img.src" :style="{width:imgWidth}" @click="subTitle=img.info"></q-img>
   </div>
  </div>
  </q-scroll-area>
 </q-item-section>
</q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="install.dlg" persistent>
  <q-card style="min-width:62vw" class="q-pa-lg">
     <q-linear-progress :value="install.percent/100" color="primary" size="xl"></q-linear-progress>
     <div>{{install.info}}</div>
  </q-card>
</q-dialog>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errDlg"></component-alert-dialog>
`
}