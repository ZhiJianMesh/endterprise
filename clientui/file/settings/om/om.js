export default {
inject:['service', 'tags'],
data(){return{
}},
created(){
    this.service.refreshState();
},
methods:{
jumpTo(name) {
    if(!this.service.getToken('backend')){
        this.$refs.errDlg.show(this.tags.noToken);
        return; //还未准备好
    }
    if(this.service.services.length==0)  {
        return;
    }
    this.service.go_to('/om/'+name);
}
},

template: `
<q-layout view="hHh lpr fFf">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.om.title}}</q-toolbar-title>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list>
  <q-item clickable v-ripple @click="jumpTo('execsqls')">
    <q-item-section avatar>
      <q-icon color="primary" name="storage"></q-icon>
    </q-item-section>

    <q-item-section>{{tags.om.execsqls}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>
  
  <q-item clickable v-ripple @click="jumpTo('servicestate')">
    <q-item-section avatar>
      <q-icon color="primary" name="insert_chart"></q-icon>
    </q-item-section>

    <q-item-section>{{tags.om.serviceState}}</q-item-section>
    <q-item-section avatar>
      <q-icon name="chevron_right" class="text-primary"></q-icon>
    </q-item-section>
  </q-item>
  
  <q-item clickable v-ripple @click="jumpTo('serverlogs')">
    <q-item-section avatar>
      <q-icon color="primary" name="subject"></q-icon>
    </q-item-section>
    <q-item-section>{{tags.om.serverlogs}}</q-item-section>
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