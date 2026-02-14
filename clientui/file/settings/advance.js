export default {
inject:['service', 'tags'],
data(){return{
}},
created(){
    this.service.initServiceList();
},
methods:{
showOmPg(name) {
    if(!this.service.getToken('backend')){
        this.$refs.errDlg.show(this.tags.noToken);
        return; //还未准备好
    }
    this.service.go_to('/om/'+name);
},
showPage(url) {
    if(!this.service.getToken('backend')){
        this.$refs.errDlg.show(this.tags.noToken);
        return; //还未准备好
    }
    this.service.go_to(url);
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
<q-list style="min-width: 100px">
 <q-item clickable v-close-popup @click="showPage('/cfg')">
   <q-item-section side><q-icon color="primary" name="settings"></q-icon></q-item-section>
   <q-item-section no-wrap>{{tags.cfg.title}}</q-item-section>
 </q-item>
 <q-item clickable v-close-popup @click="showPage('/mkt')">
   <q-item-section side><q-icon color="primary" name="shop_two"></q-icon></q-item-section>
   <q-item-section no-wrap>{{tags.mkt.title}}</q-item-section>
 </q-item>
 <q-separator spaced v-if="service.mode!='ROOT'"></q-separator>
 <q-item v-if="service.mode!='ROOT'">
   <q-item-section side><q-icon color="primary" name="menu_open"></q-icon></q-item-section>
   <q-item-section no-wrap>{{tags.om.title}}</q-item-section>
 </q-item>
 <q-item v-if="service.mode!='ROOT'" class="q-pl-md">
  <q-list>
  <q-item clickable @click="showOmPg('services')">
  <q-item-section avatar>
   <q-icon color="primary" name="apps"></q-icon>
  </q-item-section>
  <q-item-section>{{tags.om.serviceMng}}</q-item-section>
  <q-item-section avatar>
   <q-icon name="chevron_right" class="text-primary"></q-icon>
  </q-item-section>
  </q-item>
  <q-item clickable @click="showOmPg('srvnodes')">
  <q-item-section avatar>
   <q-icon color="primary" name="miscellaneous_services"></q-icon>
  </q-item-section>
  <q-item-section>{{tags.om.srvNodes}}</q-item-section>
  <q-item-section avatar>
   <q-icon name="chevron_right" class="text-primary"></q-icon>
  </q-item-section>
  </q-item>
  <q-item clickable @click="showOmPg('dbnodes')">
  <q-item-section avatar>
   <q-icon color="primary" name="storage"></q-icon>
  </q-item-section>
  <q-item-section>{{tags.om.dbNodes}}</q-item-section>
  <q-item-section avatar>
   <q-icon name="chevron_right" class="text-primary"></q-icon>
  </q-item-section>
  </q-item>
  <q-item clickable v-ripple @click="showOmPg('execsqls')">
  <q-item-section avatar>
   <q-icon color="primary" name="subscriptions"></q-icon>
  </q-item-section>
  <q-item-section>{{tags.om.execsqls}}</q-item-section>
  <q-item-section avatar>
   <q-icon name="chevron_right" class="text-primary"></q-icon>
  </q-item-section>
  </q-item>
  <q-item clickable v-ripple @click="showOmPg('serverlogs')">
  <q-item-section avatar>
   <q-icon color="primary" name="subject"></q-icon>
  </q-item-section>
  <q-item-section>{{tags.om.serverlogs}}</q-item-section>
  <q-item-section avatar>
   <q-icon name="chevron_right" class="text-primary"></q-icon>
  </q-item-section>
  </q-item>
 </q-list>
 </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errDlg"></component-alert-dialog>
`
}