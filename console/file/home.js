export default {
inject:['service', 'tags'],
data(){return{token:''}},
created(){
    this.token=this.service.token;
},
methods:{
jumpTo(name) {
    if(!this.service.token){
        this.$refs.errDlg.show(this.tags.plsInputTk);
        return; //还未准备好
    }
    if(this.service.services.list.length==0)  {
        return;
    }
    this.$router.push('/' + name);
},
clientLogs() {
    this.$router.push('/clientlogs');
},
tokenReady() {
    this.service.setToken(this.token);
    this.service.refreshState();
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-avatar square><img src="./favicon.png"></q-avatar>
      <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
    </q-toolbar>
    <div class="q-pa-md">
      <q-input v-model="token" rounded outlined dense 
      @blur="tokenReady" :prefix="tags.token">
        <template v-slot:prepend>
          <q-icon name="security" color="blue"></q-icon>
        </template>
      </q-input>
    </div>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list>
  <q-item clickable v-ripple @click="jumpTo('execsqls')">
    <q-item-section avatar>
      <q-icon color="primary" name="storage"></q-icon>
    </q-item-section>

    <q-item-section>{{tags.execsqls}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>
  
  <q-item clickable v-ripple @click="jumpTo('serverlogs')">
    <q-item-section avatar>
      <q-icon color="primary" name="subject"></q-icon>
    </q-item-section>

    <q-item-section>{{tags.serverlogs}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>

  <q-item clickable v-ripple @click="jumpTo('servicestate')">
    <q-item-section avatar>
      <q-icon color="primary" name="insert_chart"></q-icon>
    </q-item-section>

    <q-item-section>{{tags.serviceState}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>

  <q-item clickable v-ripple @click="clientLogs">
    <q-item-section avatar>
      <q-icon color="primary" name="subject"></q-icon>
    </q-item-section>

    <q-item-section>{{tags.clientlogs}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>

</q-list>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errDlg"></component-alert-dialog>
`
}