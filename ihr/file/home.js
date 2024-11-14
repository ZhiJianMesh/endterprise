import iBF from '/ibfbase/ibf.js'

export default {
inject:['service', 'tags'],
components: { //注册局部组件
    'ibf':iBF
},
data() {return {
}},
created(){
},
methods:{
goto(url) {
    this.$router.push(url);
}
},

template:`
<q-layout view="hhh lpr fff" container style="height:99vh">
  <q-header>
   <q-toolbar>
     <q-avatar square><img src="./favicon.png"></q-avatar>
     <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
   </q-toolbar>
   <div class="text-right bg-white">
    <q-btn :label="tags.pool.title" @click="goto('/pool')"
     icon="group" color="primary" padding="xs" flat></q-btn>
    <q-btn :label="tags.employee.title" @click="goto('/employee')" 
     icon="badge" color="primary" flat></q-btn>
    <q-btn :label="tags.grp.title" @click="goto('/grp?id=0')"
     icon="account_tree" color="orange" flat padding="xs"></q-btn>
    <q-btn :label="tags.config.title" @click="goto('/config')"
     icon="settings" color="accent" flat></q-btn>
    <q-btn :label="tags.salary.title" @click="goto('/config')"
     icon="attach_money" color="primary" flat></q-btn>
   </div>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-sm">
<q-separator spaced="sm"></q-separator>
<ibf></ibf>
    </q-page>
  </q-page-container>
</q-layout>
`
}