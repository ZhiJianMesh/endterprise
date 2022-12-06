export default {
inject:['service', 'tags'],
data(){return {
    services:[],
    cols:[],
    timer:null
}},
created() {
    this.cols=this.service.services.cols;
    this.services=this.service.services.list;
    if(this.timer) {
        clearInterval(this.timer);
        this.timer=null;
    }
    this.timer=setInterval(this.refresh, 30000);
},
beforeUnmount() {
    if(this.timer) {
        clearInterval(this.timer);
        this.timer=null;
    }
},
methods:{
refresh(){
    this.service.refreshState();
    this.cols=this.service.services.cols;
    this.services=this.service.services.list;
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.serviceState}}</q-toolbar-title>
      <q-btn flat round icon="refresh" dense @click="refresh"></q-btn>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">  
<q-markup-table flat>
  <thead>
   <tr><th v-for="(x,i) of 4">{{cols[i]}}</th></tr>
  </thead>
  <tbody><tr v-for="row in services">
   <td v-for="(x,i) in 4">{{row[i]}}</td>
  </tr></tbody>
</q-markup-table>
    </q-page>
  </q-page-container>
</q-layout>
`
}