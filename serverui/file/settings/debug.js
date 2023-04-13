export default {
inject:['service', 'tags'],
data() {return {
    accessToken:'', //调测接入令牌
    logLevel:'DEBUG',
    logLevels:['DEBUG','INFO','WARN','ERROR'],
    logPath:'',
    logs:[],
    reportLog:false
}},
created() {
    this.logPath=Server.logPath();
    this.logLevel=Server.logLevel();
    var t=(new Date()).getTime();
    for(var i=0;i<10;i++) {
        this.logs.push(t);
        t-=86400000;
    }
},
methods:{
setLogLevel() {
    Server.setLogLevel(this.logLevel);
},
resetToken() {
    this.accessToken = Server.refreshConsoleToken();
},
formatUtc(t) {
   return new Date(t).toLocaleDateString(); 
},
showLogs() {
    this.reportLog=!this.reportLog;
},
report_tocloud(utc){
}
},
template: `
<q-layout view="lHh lpr lFf" container style="height:100vh" v-cloak>
<q-header elevated class="primary">
   <q-toolbar>
      <q-btn icon="arrow_back" dense @click="service.go_back" flat round></q-btn>
      <q-toolbar-title>{{tags.debug}}</q-toolbar-title>
   </q-toolbar>
</q-header>
<q-page-container>
 <q-page>
<q-markup-table bordered="false" flat>
  <tr>
   <td>{{tags.accessToken}}</td>
   <td>
    <q-chip outline style="min-width:15em">
     <q-avatar color="orange" icon="key"></q-avatar>{{accessToken}}
    </q-chip>
    <q-icon name="refresh" @click="resetToken" color="primary"></q-icon>
   </td>
  </tr>
  <tr>
   <td>{{tags.logLevel}}</td>
   <td>
    <q-select v-model="logLevel" :options="logLevels"
     @update:model-value="setLogLevel" dense></q-select>
   </td>
  </tr>
  <tr>
   <td>{{tags.uploadLogs}}</td>
   <td @click="showLogs" style="word-break:break-all;word-wrap:break-word;white-space:pre-wrap;">
    <q-icon name="svguse:/assets/imgs/meshicons.svg#log" size="1.5em" color="primary"></q-icon>
    {{logPath}}
   </td>
  </tr>
</q-markup-table>
<q-list v-show='reportLog'>
 <q-item v-for="l in logs">
  <q-item-section>{{formatUtc(l)}}</q-item-section>
  <q-item-section side><q-icon name="cloud_upload" @click="report_tocloud(l)"></q-icon></q-item-section>
 </q-item>
</q-list>
 </q-page>
</q-page-container>
</q-layout>
`
}