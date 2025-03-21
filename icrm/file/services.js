export default {
inject:['service', 'tags', 'icons'],
data() {return {
    list:[], //服务列表，包括自己可见的
    page:{cur:1,max:0}
}},
created(){
    this.onlyMine=storageGet('service_onlyMine') == 'true';
    this.query_list(1);
},
methods:{
fmt_lines(cols, lines) {
    var list=[];
    var dt=new Date();
    var sv, ln;
    for(var i in lines) { //id,budget,creator,createAt,status,customer,cname,skuName
        ln=lines[i];
        sv={};
        for(var j in cols) {
            sv[cols[j]]=ln[j];
        }
        dt.setTime(sv.createAt*60000);
        sv.createAt=dt.toLocaleDateString();
        sv.status=this.tags.sta2icon(sv.status);
        list.push(sv)
    }
    this.list=list;
},
query_list(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var url="/api/service/my?offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(resp=>{
        if(resp.code!=RetCode.OK || resp.data.total==0) {
            this.list=[];
            this.page.max=0;
            this.page.cur=1;
            return;
        }
        this.fmt_lines(resp.data.cols, resp.data.services);
        this.page.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
show_detail(id) {
    this.$router.push('/service?id='+id);
},
customer_detail(id) {
    this.$router.push('/customer?id='+id);
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
<q-header elevated>
  <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{tags.home.services}}</q-toolbar-title>
  </q-toolbar>
</q-header>

<q-page-container>
   <q-page class="q-pa-md">
<div class="q-pa-sm flex flex-center" v-if="page.max>1">
  <q-pagination color="primary" v-model="page.cur" :max="page.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_contacts" dense></q-pagination>
</div>
<q-list separator>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.service.cname}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.service.skuName}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.service.creator}}</q-item-label></q-item-section>
  <q-item-section thumbnail></q-item-section>
 </q-item>
 <q-item v-for="l in list" @click="show_detail(l.id)" clickable>
  <q-item-section @click.stop="customer_detail(l.customer)">{{l.cname}}</q-item-section>
  <q-item-section>{{l.skuName}}</q-item-section>
  <q-item-section>
   <q-item-label>{{l.creator}}</q-item-label>
   <q-item-label caption>@{{l.createAt}}</q-item-label>
  </q-item-section>
  <q-item-section thumbnail><q-icon :name="l.status" color="primary" size="xs"></q-icon></q-item-section>
 </q-item>
</q-list>
  </q-page>
 </q-page-container>
</q-layout>
`
}