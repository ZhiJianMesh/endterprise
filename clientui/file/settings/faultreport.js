export default {
inject:['service', 'tags'],
data(){return {
    logs:[],
	logPath:''
}},
created() {
	this.logPath=App.logPath();
    var t=(new Date()).getTime();
    for(var i=0;i<10;i++) {
        this.logs.push(t);
        t-=86400000;
    }
},
methods:{
formatUtc(t) {
   return new Date(t).toLocaleDateString(); 
},
report_tocloud(utc){
    
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.home.faultreport}}</q-toolbar-title>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">    
 <q-list>
    <q-item v-for="l in logs">
     <q-item-section>{{formatUtc(l)}}</q-item-section>
     <q-item-section side><q-icon name="cloud_upload" @click="report_tocloud(l)"></q-icon></q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.logPath}}</q-item-section>
     <q-item-section>{{logPath}}</q-item-section>
	</q-item>
 </q-list>
    </q-page>
  </q-page-container>
</q-layout>
`
}