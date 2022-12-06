export default {
inject: ['service', 'tags'],
data() {return {
    id: this.$route.query.id,
    app: {}, //service,dispName,author,type,stars,installs,cmt,recentUpd,baseUrls
    subTitle:'',
    preImgNo:0,
    intro:{descrs:[],images:[]},
    baseUrl:'',
    action: this.tags.waitting,
    imgWidth:'45vw'
}},
created() {
    if(document.documentElement.clientWidth>document.documentElement.clientHeight) {
        this.imgWidth="30vw";
    }
    this.app=this.emptyDtl();
    request({method:"GET",url:"/api/market/detail?id="+this.id, private:false},"devops").then(resp=>{
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
        this.app.ver=Math.floor(v/1000000)+'.'+(Math.floor(v/1000)%1000)+'.'+(v%1000);
        this.baseUrl=s+"/release/" +this.app.ver;

        var dt=new Date(resp.data.recentUpd);
        this.app['updateAt']=dt.toLocaleDateString();
        if(Server.isServiceInstalled(this.app.service)) {
            this.action=this.tags.update;
        } else {
            this.action=this.tags.install;
        }
        return this.service.getExternal({url:this.baseUrl + "/introduction.json"});
    }).then((s)=> {
        if(!s) {return}
        var o=JSON.parse(s);
        if(!o || !o.introduce) {
            return;
        }
        var intro=o.introduce;
        for(var i in intro.images) {
            var src=intro.images[i].src;
            if(src.substring(0,1)=="/") {
                intro.images[i].src=this.baseUrl+src;
            } else {
                intro.images[i].src=this.baseUrl+'/'+src;
            }
        }
        this.intro=intro;
    });
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
    var jsCbId=__regsiterCallback(this.refreshUI)
    if (Server.isServiceInstalled(this.app.service)) {
        Server.unInstallService(this.id, jsCbId);
    } else {
        Server.installService(this.id, jsCbId);
    }
    this.action=this.tags.waitting;
},
refreshUI(resp) {
    if(resp.code != RetCode.OK) {
        this.$refs.errDlg.showErr(resp.code, resp.info);
    }
    Console.info("App " + this.app.service + " action over");
    if (Server.isServiceInstalled(this.app.service)) {
        this.action = this.tags.unInstall;
        console.info("App " + this.app.service + " is installed");
    } else {
        this.action = this.tags.install;
        console.info("App " + this.app.service + " is not installed");
    }
},
giveStar() {
    request({method:"GET",url:"/api/market/star?id="+this.id},"devops").then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.app.stars=resp.data.stars;
    });
},
emptyDtl() {
    return {service:'', dispName:'', author:'', type:'', ver:'',
     stars:0, installs:0, cmt:'', recentUpd:'', baseUrl:''}
}
},
template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
   <q-list class="q-pa-sm">
    <q-item>
     <q-item-section avatar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
     </q-avatar></q-item-section>
     <q-item-section avatar><q-avatar square><img :src="app.icon"></q-avatar></q-item-section>
     <q-item-section>
      <q-item-label>{{app.dispName}}</q-item-label>
      <q-item-label caption>{{app.ver}}</q-item-label>
      </q-item-section>
     <q-item-section side>
        <q-item-label caption>{{app.author}}</q-item-label>
        <q-item-label caption>{{tags.updateAt}} {{app.updateAt}}</q-item-label>
     </q-item-section>
    </q-item>
   </q-list>
  </q-header>
  <q-footer bordered class="bg-white text-primary">
    <q-toolbar class="row justify-center">
      <q-btn rounded color="primary" :label="action" @click="appAction"></q-btn>
    </q-toolbar>
  </q-footer>
  
   <q-page-container>
     <q-page class="q-pa-none">
<div class="q-py-xs q-px-md" @click="giveStar">
  <q-chip outline color="yellow" text-color="white" icon="star">{{app.stars}}</q-chip>
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
	<q-img :src="img.src" :style="{width:imgWidth}"></q-img>
   </div>
  </div>
  </q-scroll-area>
 </q-item-section>
</q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errDlg"></component-alert-dialog>
`
}