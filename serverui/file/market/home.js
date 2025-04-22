export default {
inject:['service', 'tags'],
data() {return {
    mktServices:[],
    locServices:[],
    search:'',
    tab:'market',
    page:{cur:1, max:0},
    cdns:[]
}},
created(){
    this.service.cdnList().then(cdns=>{
        this.cdns=cdns;
        this.queryService(1);
    })
    this.getLocServices();
},
methods:{
queryService(pg) {
    this.search='';
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var url="/service/list?offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET", url:url, private:false, cloud:true}, "appstore").then(resp=>{
        if(resp.code!=RetCode.OK || resp.data.total==0) {
            Console.warn("code:"+resp.code+",info:"+resp.info);
            this.mktServices=[];
            this.page.max=0;
            this.page.cur=1;
            return;
        }
        this.fmt_services(resp.data);
        this.page.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
searchService() {
    if(this.search=='') {
        this.queryService(1);
        return;
    }
    var url="/service/search?type=enterprise&s="+this.search+"&limit="+this.service.N_PAGE;
    request({method:"GET",url:url, private:false, cloud:true}, "appstore").then(resp=>{
        if(resp.code != RetCode.OK) {
            Console.warn("code:"+resp.code+",info:"+resp.info);
            this.mktServices=[];
            this.page.max=0;
            this.page.cur=1;
            return;
        }
        this.fmt_services(resp.data);
        this.page.max=1;
    })
},
fmt_services(rows) {
    var cols=rows.cols;
    var data=rows.services;
    var services=[];
    var row,s;
    var dt=new Date();
    var ss, n, icon;
    for(var i in data) {
        row=data[i];
        s={};
        for(var c in cols) {
            s[cols[c]]=row[c];
        }
        icon=Server.serviceIcon(s.service);
        if(icon!="") {//已安装则显示本地icon
            s['icon'] = icon;
        } else {
            s['icon'] = this.cdns[0] + s.service + "/favicon.png";
        }
        dt.setTime(s.recentUpd);
        s.updateAt=dt.toLocaleDateString();
        services.push(s);
    }
    this.mktServices=services;
},
detail(service) {
    this.$router.push('/detail?service='+service)
},
update(service) {
	this.$refs.procDlg.show(this.tags.mkt.update,
        this.tags.mkt.cfmUpdate+service+'?', 'clear',
        (dlg)=> {
            dlg.setInfo(this.tags.mkt.waitting);
			return new Promise(resolve=>{
				Server.updateService(service, __regsiterCallback(resp=> {
					resolve(resp)
				}));
			});
        },
        (dlg,resp)=> {
		  if(resp.code!=RetCode.OK) {
			dlg.setInfo(formatErr(resp.code, resp.info));
		  } else {
			dlg.setInfo(this.tags.mkt.successToUpdate);
			this.getLocServices();
		  }
		}
    )
},
unInstall(service) {
	this.$refs.procDlg.show(this.tags.mkt.unInstall,
        this.tags.mkt.cfmUninstall+service+'?', 'clear',
        (dlg)=> {
            dlg.setInfo(this.tags.mkt.waitting);
			return new Promise(resolve=>{
				Server.unInstallService(service, __regsiterCallback(resp=> {
					resolve(resp)
				}));
			});
        },
        (dlg,resp)=> {
		  if(resp.code!=RetCode.OK) {
			dlg.setInfo(formatErr(resp.code, resp.info));
		  } else {
			dlg.setInfo(this.tags.mkt.successToUnInstall);
			this.getLocServices();
		  }
		}
    )
},
getLocServices() {
    var jsCbId=__regsiterCallback(resp=> {
        if(resp.code != RetCode.OK) {
            Console.warn("code:"+resp.code+",info:"+resp.info);
            return;
        }
        this.locServices=resp.data.services;
    });
    Server.getServices(jsCbId);
}
},

template: `
<q-layout view="hHh lpr fFf" container style="height:100vh" v-cloak>
<q-header elevated>
 <q-toolbar>
  <q-avatar square><q-icon name="shop_two"></q-icon></q-avatar>
  <q-toolbar-title>{{tags.market}}</q-toolbar-title>
 </q-toolbar>
 <q-tabs v-model="tab" dense indicator-color="yellow">
  <q-tab name="market" :label="tags.market" icon="apps"></q-tab>
  <q-tab name="local" :label="tags.locServices" icon="svguse:/assets/imgs/meshicons.svg#services"></q-tab>
 </q-tabs>
</q-header>
<q-page-container>
<q-page class="text-center">
<q-tab-panels v-model="tab" animated swipeable transition-prev="jump-up" transition-next="jump-up">
  <q-tab-panel name="market" class="text-left">
   <q-input v-model="search" :placeholder="tags.search" @keyup.enter="searchService" bg-color="white" outlined dense>
     <template v-slot:append>
      <q-icon v-if="search!==''" name="close" @click="queryService(1)" class="cursor-pointer"></q-icon>
      <q-icon name="search" @click="searchService"></q-icon>
     </template>
   </q-input>
   <div class="q-pa-sm flex flex-center" v-if="page.max>1">
     <q-pagination v-model="page.cur" color="primary" :max="page.max" max-pages="10"
      boundary-numbers="false" @update:model-value="queryService"></q-pagination>
   </div>
   <q-list padding>
    <q-item v-for="s in mktServices" clickable @click="detail(s.service)">
      <q-item-section avatar top>
        <q-avatar square><img :src="s.icon" style="max-height:2em"></q-avatar>
      </q-item-section>
      <q-item-section>
        <q-item-label lines="1">{{s.displayName}}/{{s.service}}</q-item-label>
        <q-item-label caption>{{s.author}}</q-item-label>
        <q-item-label caption>{{tags.mkt.updateAt}} {{s.updateAt}}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-item-label><q-icon name="cloud_download" size="xs" color="primary"></q-icon></q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-item-label caption>{{s.installs}}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
 </q-tab-panel>
 <q-tab-panel name="local">
   <q-list>
     <q-item v-for="s in locServices" class="q-my-sm">
       <q-item-section avatar>
         <q-avatar square><img :src="s.favicon"></q-avatar>
       </q-item-section>
       <q-item-section class="text-left">
         <q-item-label overline>{{s.displayName}}/{{s.name}}
		  <q-badge :label="tags.mkt.unInstall" @click="unInstall(s.name)" v-if="s.level>4"></q-badge>
		 </q-item-label>
         <q-item-label caption>{{s.author}}</q-item-label>
       </q-item-section>
       <q-item-section side v-if="s.updatable">
	    <q-item-label class="q-mt-xs text-weight-bold text-primary"
	    @click="update(s.name)">{{tags.mkt.update}}</q-item-label>
		<q-item-label caption>{{s.version}} -> {{s.srvVer}}</q-item-label>
	   </q-item-section>
	   <q-item-section side v-else>
        <q-item-label caption>{{s.version}}</q-item-label>
       </q-item-section>
     </q-item>
   </q-list>
 </q-tab-panel>
</q-page>
</q-page-container>
</q-layout>

<component-process-dialog ref="procDlg"></component-process-dialog>
`
}