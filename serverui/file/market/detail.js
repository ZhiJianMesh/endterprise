export default {
inject: ['service', 'tags'],
data() {return {
    name: this.$route.query.service,
    app: {}, //service,displayName,author,type,level,ver,installs,cmt,recentUpd
    subTitle:'',
    preImgNo:0,
    intro:{descrs:[],images:[]},
    baseUrl:'',
    action: this.tags.waitting,
    imgWidth:'90vw',
    cdns:[],
	localVer:0
}},
created() {
    if(document.documentElement.clientWidth>document.documentElement.clientHeight) {
        this.imgWidth="30vw";
    }
    this.app=this.emptyDtl();
    this.service.cdnList().then(cdns=>{
        this.cdns=cdns;
        this.getDetail();
    });
},
methods: {
getDetail() {
    var reqOpts={private:false, method:"GET",
        url:"/api/service/detail?service="+this.name,cloud:true};
    request(reqOpts, "appstore").then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.app = resp.data;
        var s=this.cdns[0] + this.name;
        this.app['icon'] = s + "/favicon.png";
        var v = parseInt(resp.data.ver);
        this.app['intVer'] = v;
        this.app.ver= Server.intToVer(v);
        this.baseUrl= s + "/" + this.app.ver;

        var dt=new Date(resp.data.recentUpd);
        this.app['updateAt']=dt.toLocaleDateString();
		this.refreshUI();
        return this.service.getExternalRes({url:this.baseUrl + "/introduction.json"});
    }).then((s)=> {
        if(!s) {return}
        var o=JSON.parse(s);
        if(!o || !o.introduce) {
            return;
        }
        var intro = o.introduce;
        if(intro.images && intro.images.length > 0) {
            for(var i in intro.images) {
                var src = intro.images[i].src;
                if(src.substring(0,1) == "/") {
                    intro.images[i].src = this.baseUrl+src;
                } else {
                    intro.images[i].src = this.baseUrl + '/' + src;
                }
            }
            this.subTitle = intro.images[0].info;
        }
        this.intro=intro;
    });
},
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
install(service) {
	this.$refs.procDlg.show(this.tags.mkt.install,
        this.tags.mkt.cfmInstall+service+'?', 'clear',
        (dlg)=> {
            dlg.setInfo(this.tags.mkt.waitting);
			return new Promise(resolve=>{
				Server.installService(service, __regsiterCallback(resp=> {
					resolve(resp)
				}));
			});
        },
        (dlg,resp) => {
		  if(resp.code!=RetCode.OK) {
			dlg.setInfo(formatErr(resp.code, resp.info));
		  } else {
			dlg.setInfo(this.tags.mkt.successToInstall);
			this.refreshUI();
		  }
		}
    )
},
update(service) {
	this.$refs.procDlg.show(this.tags.mkt.update,
        this.tags.mkt.cfmUpdate+this.name+'?', 'clear',
        (dlg)=> {
            dlg.setInfo(this.tags.mkt.waitting);
			return new Promise(resolve=>{
				Server.updateService(service, __regsiterCallback(resp=> {
					resolve(resp)
				}));
			});
        },
        (dlg,resp) => {
		  if(resp.code!=RetCode.OK) {
			dlg.setInfo(formatErr(resp.code, resp.info));
		  } else {
			dlg.setInfo(this.tags.mkt.successToUpdate);
			this.refreshUI();
		  }
		}
    )
},
appAction() {
    this.localVer=Server.getServiceVer(this.name);
    if (this.localVer>0) {
        this.update(this.name);
    } else {
		this.install(this.name);
    }
},
refreshUI() {
    this.localVer=Server.getServiceVer(this.name);
    if(this.localVer>0) {//已安装，否则<=0
        this.action = this.tags.mkt.update;
        Console.info("App " + this.name + " is installed");
    } else {
        this.action = this.tags.mkt.install;
        Console.info("App " + this.name + " is not installed");
    }
},
emptyDtl() {
    return {service:'', displayName:'', author:'', type:'', ver:'',intVer:0,
     installs:0, cmt:'', recentUpd:'', baseUrl:''}
},
unInstall() {
	this.$refs.procDlg.show(this.tags.mkt.unInstall,
        this.tags.mkt.cfmUninstall+this.name+'?', 'clear',
        (dlg)=> {
            dlg.setInfo(this.tags.mkt.waitting);
			return new Promise(resolve=>{
				Server.unInstallService(this.name, __regsiterCallback(resp=> {
					resolve(resp)
				}));
			});
        },
        (dlg,resp) => {
		  if(resp.code!=RetCode.OK) {
			dlg.setInfo(formatErr(resp.code, resp.info));
		  } else {
			dlg.setInfo(this.tags.mkt.successToUnInstall);
			this.refreshUI();
		  }
		}
    )
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
      <q-item-label caption class="text-black">{{tags.mkt.author}} {{app.author}}</q-item-label>
      <q-item-label caption class="text-black">{{tags.mkt.version}} {{app.ver}}</q-item-label>
      <q-item-label caption class="text-black">{{tags.mkt.updateAt}} {{app.updateAt}}</q-item-label>
     </q-item-section>
    </q-item>
   </q-list>
  </q-header>
  <q-footer bordered class="bg-grey-2">
    <q-toolbar class="row justify-center">
      <q-btn rounded color="primary" :label="action" @click="appAction" v-show="localVer<=0"></q-btn>
	  <q-btn outline rounded color="primary" :label="tags.mkt.unInstall" @click="unInstall" v-show="localVer>0&&app.level>4"></q-btn>
    </q-toolbar>
  </q-footer>

   <q-page-container>
     <q-page class="q-pa-none">
<div class="q-py-xs q-px-md">
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

<component-process-dialog ref="procDlg"></component-process-dialog>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errDlg"></component-alert-dialog>
`
}