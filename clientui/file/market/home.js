export default {
inject:['service', 'tags'],
data() {return {
    apps:[]
}},
created(){
    this.fetch_apps();
},
methods:{
fetch_apps() {
    if(Object.keys(this.service.list).length>0) {
        this.apps=[];
        for(var i in this.service.list) {
            var o=this.service.list[i];
            this.apps.push(o);
        }
        return;
    }
    
    var url="/service/list?cid="+Http.cid();
    request({method:"GET", url:url,private:false}, "company").then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.apps=resp.data.services;
        for(var i in this.apps) {
            var o=this.apps[i];
            o['icon']="/" + o.service + "/favicon.png";
            this.service.list[o.service]=o;
        }
    })
},
detail(service) {
    this.$router.push('/detail?service='+service+"&cid="+Http.cid())
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
    <q-list separator>
      <q-item clickable v-ripple v-for="a in apps" @click="detail(a.service)">
        <q-item-section avatar><q-avatar square>
          <img :src="a.icon">
        </q-avatar></q-item-section>
        <q-item-section>
         <q-item-label>{{a.displayName}}</q-item-label>
         <q-item-label>{{a.author}}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errDlg"></component-alert-dialog>
`
}