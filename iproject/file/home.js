export default {
inject:['service', 'tags'],
data() {return {
}},
created(){
},
methods:{
},

template:`
<q-layout view="HHH LpR FFF" container style="height:99vh">
  <q-header>
   <q-toolbar>
     <q-avatar square><img src="./favicon.png"></q-avatar>
     <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
   </q-toolbar>
   <div class="text-right bg-white">
    <q-btn :label="tags.projects" @click="service.goto('/projects')"
     icon="location_city" color="primary" padding="xs" flat></q-btn>
    <q-btn :label="tags.report" @click="service.goto('/report')" 
     icon="bar_chart" color="accent" flat></q-btn>
   </div>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-sm">
<q-separator spaced="sm" color="teal"></q-separator>
<ibf-home></ibf-home>
    </q-page>
  </q-page-container>
</q-layout>
`
}