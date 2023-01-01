export default {
inject:['service', 'tags', 'icons'],
data(){return{
    taskNum:0,
    role:'',
    myList:{
        c:{icon:this.icons.customer,name:this.tags.home.customers,url:'/customers',weekInc:0},
        n:{icon:this.icons.contact,name:this.tags.home.contacts,url:'/contacts',weekInc:0},
        o:{icon:this.icons.order,name:this.tags.home.orders,url:'/orders',weekInc:0},
        s:{icon:this.icons.service,name:this.tags.home.services,url:'/services',weekInc:0},
        p:{icon:this.icons.payment,name:this.tags.home.payments,url:'/payments',weekInc:0}
    }
}},
created(){
    this.refresh();
},
methods:{
refresh() {
    var url1="/api/tasknum";
    request({method:"GET",url:url1}, this.service.WF).then(function(resp){
        if(resp.code!=0) {
            Console.warn("request "+url1+" failed:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.taskNum=resp.data.num;
    }.bind(this)); 

    var url2="/api/report/bulletin?days=7";
    request({method:"GET",url:url2}, this.service.name).then(function(resp){
        if(resp.code!=0) {
            Console.warn("request "+url2+" failed:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.myList.c.weekInc=resp.data.customer;
        this.myList.n.weekInc=resp.data.contact;
        this.myList.o.weekInc=resp.data.ord;
        this.myList.p.weekInc=resp.data.payment;
        this.myList.s.weekInc=resp.data.service;
    }.bind(this));

    var url3="/grp/getrole?service="+this.service.name;
    request({method:"GET",url:url3}, SERVICE_USER).then(function(resp){
        if(resp.code!=RetCode.OK) {
            Console.warn("request "+url3+" failed:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.role=resp.data.role;
    }.bind(this)); 
},
flowDef() {
    var proxyUrl=encodeURIComponent("/api/proxy/flow");
    this.$router.push({path:"/flowdef",query:{service:this.service.name,proxy:proxyUrl}});
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
    <q-avatar square><img src="./favicon.png"></q-avatar>
    <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
    <q-btn flat round dense icon="menu" v-if="role=='admin'">
      <q-menu>
       <q-list style="min-width:100px">
        <q-item clickable @click.stop="service.jumpTo('/settings')">
          <q-item-section avatar><q-icon name="settings"></q-icon></q-item-section>
          <q-item-section>{{tags.home.settings}}</q-item-section>
        </q-item>
        <q-item clickable @click="service.jumpTo('/employees?service=crm&proxy=%2Fapi%2Fproxy%2Femployee')">
          <q-item-section avatar><q-icon name="people"></q-icon></q-item-section>
          <q-item-section>{{tags.home.employee}}</q-item-section>
        </q-item>
        <q-item clickable @click="flowDef">
          <q-item-section avatar><q-icon name="playlist_add_check"></q-icon></q-item-section>
          <q-item-section>{{tags.home.flowDef}}</q-item-section>
        </q-item>
       </q-list>
     </q-menu>
   </q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list separator>
  <q-item clickable @click="service.jumpTo('/tasks')">
    <q-item-section avatar>
      <q-icon :name="icons['task']" color="purple"></q-icon>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{tags.home.tasks}}</q-item-label>
    </q-item-section>
    <q-item-section thumbnail>
      <q-item-label caption>
        <q-badge color="red" rounded>{{taskNum}}</q-badge>
      </q-item-label>
    </q-item-section>
  </q-item>
  <q-item v-for="i in myList" clickable @click="service.jumpTo(i.url)">
    <q-item-section top avatar>
      <q-icon :name="i.icon" color="primary"></q-icon>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{i.name}}</q-item-label>
    </q-item-section>
    <q-item-section thumbnail>
      <q-badge :color="i.weekInc>0?'red':'green'" rounded>{{i.weekInc}}</q-badge>
    </q-item-section>
  </q-item>
  <q-item clickable @click="service.jumpTo('/brief')">
    <q-item-section avatar>
      <q-icon name="svguse:/assets/imgs/meshicons.svg#barChart" color="red"></q-icon>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{tags.home.bulletin}}</q-item-label>
    </q-item-section>
    <q-item-section thumbnail>
    </q-item-section>
  </q-item>
  <q-item clickable @click="service.jumpTo('/balance')" v-if="role=='admin'||role=='finance'">
    <q-item-section avatar>
      <q-icon name="svguse:/assets/imgs/meshicons.svg#settle" color="yellow-10"></q-icon>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{tags.home.balance}}</q-item-label>
    </q-item-section>
    <q-item-section thumbnail>
    </q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>
`
}