export default {
inject:['service', 'tags'],
data() {return {
    services:{},
    serviceNum:0,
    search:'',
    install:{service:'',addr:'',dlg:false,start:0,end:32768},
    page:{cur:1, max:0}
}},
created(){
    var cur=this.service.getRt("cur", 1);
    this.page.cur=cur;
    this.fetch_services(cur);
},
methods:{
service_detail(sn) {
    this.service.go_to('/om/servicedetail?service='+sn);
},
fetch_services(pg) {
    this.service.setRt("cur", pg);
    if(this.services.length>0) {
        this.fetch_list(pg);
        return;
    }
    this.service.request_private({method:"GET",url:"/service/list"}, "bios").then(resp=>{
        if(resp.code != 0) {
            console.warn("request failed:" + resp.code + ",info:" + resp.info);
            return;
        }

        var ss={};
        var num=0;
        for(var i in resp.data.services) {
            var sv = resp.data.services[i];
            var tp = this.tags.service.types[sv.type]
            var ui = sv.visible!=0?this.tags.service.haveUi:this.tags.service.noUi;
            ss[i] = {dispName:sv.dispName, type:tp, ui:ui};
            num++;
        }
        this.serviceNum=num;
        this.services=ss;
        this.fetch_list(pg);
    })
},
search_service() {
    var s=this.search;
    if(!s)return;
    var ss={};
    for(var i in this.services) {
        var sv=this.services[i];
        if(i.indexOf(s)>=0||sv.dispName.indexOf(s)>=0) {
            ss[i] = sv;
        }
    }
    this.page.max=1;
    this.services=ss;
},
fetch_list(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    this.page.max=Math.ceil(this.serviceNum/this.service.N_PAGE);
    var ss={};
    var end=offset+this.service.N_PAGE;
    if(end>this.serviceNum) {
        end=this.serviceNum;
    }
    var j = 0;
    for(var i in this.services) {
        j++;
        if(j <= offset) continue;
        if(j > end) break;
        ss[i]=this.services[i];
    }
    this.services=ss;
},
install_service() {
    var dta={service:this.install.service};
    this.service.request_private({method:"POST",url:"/install", data:dta}, "omagent", this.install.addr).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        //设置服务DNS
        var opts={method:"PUT", url:"/om/setPubSrv",
        data:{service:this.install.service, addr:this.install.addr, start:this.install.start, end:this.intall.end}};
        this.service.request_om(opts, "httpdns").then(resp=>{
            this.install.dlg=false;
            this.install.service="";
            this.services={}; //刷新服务列表
            this.fetch_services(1);
        });
    })
}
},  
template: `
<q-layout view="hHh lpr fFf">
 <q-header class="bg-grey-1 text-primary">
  <q-toolbar>
   <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
   <q-toolbar-title>{{tags.tab_service}}</q-toolbar-title>
  </q-toolbar>
 </q-header>
 <q-footer class="bg-white q-pa-md">
  <q-input v-model="search" :placeholder="tags.search" dense @keyup.enter="search_service" outlined>
   <template v-slot:append>
    <q-icon v-if="search!==''" name="close" @click="search='';fetch_services(1)" class="cursor-pointer"></q-icon>
    <q-icon name="search" @click="search_service"></q-icon>
   </template>
   <template v-slot:after>
    <q-btn round color="primary" icon="add_circle" @click="install.dlg=true"></q-btn>
   </template>
  </q-input>
 </q-footer>
 
 <q-page-container>
  <q-page class="q-pa-md">
<div class="q-pa-sm flex flex-center" v-if="page.max>1">
 <q-pagination v-model="page.cur" color="primary" :max="page.max" max-pages="10"
  boundary-numbers="false" @update:model-value="fetch_services"></q-pagination>
</div>
<q-list separator>
 <q-item clickable v-ripple v-for="(s,n) in services" @click="service_detail(n)">
  <q-item-section>
   <q-item-label>{{n}}</q-item-label>
   <q-item-label caption>{{s.dispName}}</q-item-label>
  </q-item-section>
  <q-item-section>{{s.type}}</q-item-section>
  <q-item-section side>{{s.ui}}</q-item-section>
 </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="install.dlg"> <!-- 在实例上安装服务 -->
  <q-card style="min-width:62vw;max-width:80vw">
    <q-card-section>
      <div class="text-h6">{{tags.service.install}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-input v-model="install.service" :label="tags.service.name"></q-input>
      <q-input v-model="install.addr" :label="tags.dns.addr"></q-input>
      <q-input v-model="install.start" :label="tags.dns.start"></q-input>
      <q-input v-model="install.end" :label="tags.dns.end"></q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn color="primary" :label="tags.ok" @click="install_service"></q-btn>
      <q-btn color="primary" flat :label="tags.cancel" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<component-alert-dialog :title="tags.alert" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="alertDlg"></component-alert-dialog>
`}