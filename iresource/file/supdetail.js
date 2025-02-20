const EMPTY_CONTACT={name:'',sex:'',post:'',phone:'',cmt:''};
export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    supInfo:{}, //供应商信息
    contacts:[], //供应商联系人
    edtContact:{show:false,no:-2,dta:{}}
}},
created(){
    this.get();
    this.getContacts();
},
methods:{
get() {
    var url = "/api/supplier/get?id="+this.id;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        dt.setTime(resp.data.createAt*60000);
        resp.data.createAt_s=date2str(dt);
        this.supInfo=resp.data;
    })
},
//联系人
getContacts() {
    var url = "/api/contact/list?supplier="+this.id;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        for(var e of resp.data.list) {
            dt.setTime(e.createAt*60000);
            e.createAt_s=date2str(dt);
            e.sex_s=this.tags.sex[e.sex];
        }
        this.contacts=resp.data.list;
    });
},
show_contact(no) {
    if(no>-1) {
        copyObjTo(this.contacts[no], this.edtContact.dta);
    } else {
        copyObjTo(EMPTY_CONTACT, this.edtContact.dta);
    }
    this.edtContact.no=no;
    this.edtContact.show=true;
},
contact_do() {
    var opts;
    if(this.edtContact.no>-1) {
        opts={method:"PUT",url:"/contact/update",data:this.edtContact.dta};
    } else {
        var dta=cloneObj(this.edtContact.dta);
        dta.supplier=this.id;
        opts={method:"POST",url:"/contact/add",data:dta};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(this.edtContact.no>-1) {
            copyObjTo(this.edtContact.dta, this.contacts[this.edtContact.no]);
        } else {
            var o = {id:resp.data.id, createAt_s:date2str(new Date())};
            copyObjTo(this.edtContact.dta, o);
            this.contacts.push(o);
        }
        this.edtContact.no=-2;
        this.edtContact.show=false;
    });
},
rmv_contact(id) {
    var url = "/api/contact/remove?id="+id;
    request({method:"DELETE",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.contacts.splice(i,1);
    })
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:99vh">
  <q-header>
   <q-toolbar>
    <q-btn flat icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{tags.detail}}-{{supInfo.name}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list dense>
  <q-item>
   <q-item-section>{{tags.name}}</q-item-section>
   <q-item-section>{{supInfo.name}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.supplier.taxid}}</q-item-section>
   <q-item-section>{{supInfo.taxid}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.supplier.addr}}</q-item-section>
   <q-item-section>{{supInfo.addr}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.supplier.business}}</q-item-section>
   <q-item-section>{{supInfo.business}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.supplier.createAt}}</q-item-section>
   <q-item-section>{{supInfo.createAt_s}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.cmt}}</q-item-section>
   <q-item-section>{{supInfo.cmt}}</q-item-section>
  </q-item>
</q-list>

<q-separator inset></q-separator>
<q-banner inline-actions class="bg-indigo-1 q-ma-sm" dense>
  {{tags.contact.title}}
  <template v-slot:action>
   <q-icon flat color="primary" name="add_circle" @click.stop="show_contact(-2)"></q-icon>
  </template>
</q-banner>
<q-list dense>
  <q-item v-for="(c,i) in contacts" clickable @click=show_contact(i)>
   <q-item-section>
    <q-item-label>{{c.name}}({{c.sex_s}})</q-item-label>
    <q-item-label caption>{{c.post}}</q-item-label>
   </q-item-section>
   <q-item-section>{{c.phone}}</q-item-section>
   <q-item-section>
    <q-item-label>{{c.cmt}}</q-item-label>
    <q-item-label caption>{{c.creator}}</q-item-label>
   </q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="edtContact.show">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{tags.contact.title}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input :label="tags.contact.name" v-model="edtContact.dta.name" dense></q-input>
   <div class="q-gutter-sm">
     <q-radio v-model="edtContact.dta.sex" val="F" :label="tags.sex.F"></q-radio>
     <q-radio v-model="edtContact.dta.sex" val="M" :label="tags.sex.M"></q-radio>
     <q-radio v-model="edtContact.dta.sex" val="U" :label="tags.sex.U"></q-radio>
   </div>
   <q-input :label="tags.contact.post" v-model="edtContact.dta.post" dense></q-input>
   <q-input :label="tags.contact.phone" v-model="edtContact.dta.phone" dense></q-input>
   <q-input :label="tags.cmt" v-model="edtContact.dta.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn icon="cancel" color="red" @click="rmv_contact(edtContact.id)" flat v-show="edtContact.no>-1"></q-btn>
   <q-btn :label="tags.ok" color="primary" @click="contact_do"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errMsg"></alert-dialog>
`
}