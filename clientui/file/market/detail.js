export default {
inject: ['service', 'tags'],
data() {return {
    name: this.$route.query.service,
    cid: this.$route.query.cid,
    app: {
        displayName: "",
        version: "",
        author: "",
        level: 10000,
        icon: ""
    },
    intro: {},
    subTitle: '',
    preImgNo:0,
    isNormal:true,
    action: this.tags.waitting
}},
created() {
    this.isNormal=!App.isBuiltin(this.name);
    request({method:"GET",url:"/api/introduce"},this.name).then(function(resp) {
        if (resp.code!=RetCode.OK) {
            this.intro = {description: this.app.displayName, images:[]};
            return;
        }
        this.intro = resp.data;
        if (this.intro.images.length > 0) {
            this.subTitle = this.intro.images[0].info;
        }
    }.bind(this));
    this.app = this.service.list[this.name];
    if(this.isNormal) {
        this.action = App.isInstalled(this.name) ? this.tags.unInstall : this.tags.install;
    } else {
        this.action=this.tags.update; //内置应用只可更新
    }
},
methods: {
imgUrl(url){return '/'+this.name+url},
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
    if(this.isNormal) {
        if (App.isInstalled(this.name)) {
            App.unInstall(this.name, jsCbId);
        } else {
            App.install(this.name, jsCbId);
        }
    } else {
        App.update(this.name, jsCbId);
    }
    this.action=this.tags.waitting;
},
refreshUI(resp) {
    if(resp.code != RetCode.OK) {
        this.$refs.errDlg.showErr(resp.code, resp.info);
    }
    console.info("App " + this.name + " action over");
    if(this.isNormal) {
        if (App.isInstalled(this.name)) {
            this.action = this.tags.unInstall;
            console.info("App " + this.name + " is installed");
        } else {
            this.action = this.tags.install;
            console.info("App " + this.name + " is not installed");
        }
    } else {
        this.action=this.tags.update; //内置应用只可更新
    }
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
     <q-item-section avatar><q-avatar square>
      <img :src="app.icon">
     </q-avatar></q-item-section>
     <q-item-section>
      <q-item-label class="text-h6">{{app.displayName}}</q-item-label>
      <q-item-label caption>{{app.version}} / {{app.author}}</q-item-label>
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
<q-list class="q-pa-md">
<q-item>
 <q-item-section>
  <q-item-label>{{intro.description}}</q-item-label>
  <q-item-label caption>{{subTitle}}</q-item-label>
 </q-item-section>
</q-item>

<q-item>
 <q-item-section>
  <q-scroll-area style="height:60vh;width:100%;" horizontal @scroll="scroll">
  <div class="row no-wrap">
   <div v-for="img in intro.images" class="q-pa-sm">
    <q-img :src="imgUrl(img.src)" style="width:45vw;"></q-img>
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