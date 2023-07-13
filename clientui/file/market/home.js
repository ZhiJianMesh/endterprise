export default {
inject:['service', 'tags'],
data() {return {
    apps:[],
    page:{cur:1, max:0},
    tab:'personal'
}},
created(){
    this.queryApps(1);
},
methods:{
enterprise_apps(pg) {
    if(Companies.cid() <= 0) {
        this.apps=[];
        return;
    }
    var offset=(parseInt(pg)-1) * this.service.N_PAGE;
    var opts={
        method:"GET",
        private:false,
        url:"/service/list?cid=" + Companies.cid() + "&offset=" + offset + "&num=" + this.service.N_PAGE,
        headers:{access_token:Companies.accessCode()}
    };
    request(opts, "company").then(resp=>{
        if(resp.code != RetCode.OK) {
            this.page.max=0;
            this.page.cur=1;
            this.apps=[];
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.format_apps(resp.data.total, resp.data.cols, resp.data.services, false);
    })
},
personal_apps(pg) {
    var offset=(parseInt(pg)-1) * this.service.N_PAGE;
    var opts={
        method:"GET", private:false, cloud:true,
        url:"/service/personal?offset=" + offset + "&num=" + this.service.N_PAGE
    };
    request(opts, "appstore").then(resp=>{
        if(resp.code != RetCode.OK) {
            this.page.max=0;
            this.page.cur=1;
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.format_apps(resp.data.total, resp.data.cols, resp.data.services, true);
    })
},
detail(service) {
    this.$router.push('/detail?service='+service+"&cid="+Companies.cid())
},
format_apps(total, cols, data, cloud) {
    this.page.max=Math.ceil(total/this.service.N_PAGE);
    var apps=[];
    for(var d of data) {
        var o={};
        for(var i in cols) {
            o[cols[i]]=d[i];
        }
        var icon=App.serviceIcon(o.service);
        if(icon!="") {
            o['icon']=icon;
        } else {
			var iconUrl="/" + o.service + "/favicon.png";
			if(cloud) {
				iconUrl += "?cloud=true";
			}
            o['icon'] = iconUrl;
        }
		o['cloud']=cloud;
        var v = parseInt(o.ver);
        o.version=Math.floor(v/1000000)+'.'+(Math.floor(v/1000)%1000)+'.'+(v%1000);
        this.service.list[o.service]=o;
        apps.push(o);
    }
    this.apps = apps;
},
queryApps(pg) {
    if(this.tab=="enterprise") {
        this.enterprise_apps(pg);
    } else {
        this.personal_apps(pg);
    }
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
 <q-header class="bg-grey-1 text-primary">
   <q-toolbar>
     <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
   </q-toolbar>
 </q-header>
 <q-footer class="bg-grey-1 text-primary">
  <q-tabs v-model="tab" class="text-teal" @update:model-value="queryApps(1)" active-bg-color="green-1">
   <q-tab name="personal" icon="person" :label="tags.personal"></q-tab>
   <q-tab name="enterprise" icon="svguse:/assets/imgs/meshicons.svg#company" :label="tags.enterprise"></q-tab>
  </q-tabs>
 </q-footer>
 <q-page-container><q-page class="q-pa-md">
  <div class="q-pa-sm flex flex-center" v-if="page.max>1">
    <q-pagination v-model="page.cur" color="primary" :max="page.max" max-pages="10"
     boundary-numbers="false" @update:model-value="queryApps"></q-pagination>
  </div>
  <q-list separator>
     <q-item clickable v-ripple v-for="a in apps" @click="detail(a.service)">
       <q-item-section avatar><q-avatar square>
         <img :src="a.icon">
       </q-avatar></q-item-section>
       <q-item-section>
        <q-item-label>{{a.displayName}}/{{a.service}}</q-item-label>
        <q-item-label>{{a.author}}</q-item-label>
       </q-item-section>
     </q-item>
  </q-list>
 </q-page></q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errDlg"></component-alert-dialog>
`}