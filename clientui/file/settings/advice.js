export default {
inject:['service', 'tags'],
data(){return {
    advice:'',
    email:'',
    mobile:'',
    id:''
}},
created() {
    this.id=new Date().toLocaleDateString();
},
methods:{
send_tocloud(){
}
},
template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.home.advice}}</q-toolbar-title>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">    
 <q-list class="q-pa-md">
  <q-item>
   <q-item-section><q-input type="textarea" v-model="advice" :label="tags.advice" autogrow outlined></q-input></q-item-section>
  </q-item>
  <q-item>
   <q-item-section><q-input v-model="email" :label="tags.email"
   :rules="[v=>/^\\w+@\\w+$/.test(v)||tags.emailPls]"></q-input></q-item-section>
  </q-item>
  <q-item>
   <q-item-section><q-input v-model="mobile" :label="tags.mobile"
   :rules="[v=>/^1[0-9]{10}$/.test(v)||tags.mobilePls]"></q-input></q-item-section>
  </q-item>
</q-list>
<div align="center">
   <q-btn color="primary" icon="send" :label="tags.send" @click="send_tocloud"></q-btn>
</div>
    </q-page>
  </q-page-container>
</q-layout>
`
}