export default {
inject:['service', 'tags'],
data() {return {
    configs:{},
    tab:'template',
    segTypes:[],
    pkgUnits:[],
    template:{},
    packages:[],
    newSeg:{k:'',n:'',t:'s'},
    newPackage:{name:'',cls:'0',price:'',val:'',ext:{}}
}},
created(){
    for(var n in this.tags.segTypes){
        this.segTypes.push({value:n,label:this.tags.segTypes[n]})
    }
    for(var n in this.tags.pkgUnits){
        this.pkgUnits.push({value:n,label:this.tags.pkgUnits[n]})
    }
    
    var url1="/api/template/get?unuseCache=1";
    request({method:"GET",url:url1}, this.service.name).then(resp=>{
        if(resp.code != RetCode.OK) {
            Console.debug("Url:" + url1 + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        if(resp.data.v) {
            this.template=resp.data.v;
        }
    });
    
    var url2="/api/package/list?unuseCache=1";
    request({method:"GET",url:url2}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            Console.debug("Url:" + url2 + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.packages=resp.data.packages; //id,createAt,name,cls,val,price,ext
    }.bind(this));
},

methods:{
rmv_tpl_seg(n){
    var tpls={};
    for(var k in this.template) {
        if(k!=n) {
            tpls[k]=this.template[k];
        }
    }
    this.template=tpls;
    this.save_tpl();
},
add_tpl_seg(){
    this.template[this.newSeg.k]={n:this.newSeg.n,t:this.newSeg.t};
    this.save_tpl();
    this.newSeg={k:'',n:'',t:'s'};
},
save_tpl(){
    var url="/api/template/set";
    var req={template:this.template};
    request({method:"POST",url:url,data:req}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
    }.bind(this));
},
rmv_package(id,n){
    var url="/api/package/remove?id="+id;
    request({method:"DELETE",url:url}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.packages.splice(n,1);
    });
},
add_package(){
    var opts={method:"POST",url:"/api/package/set", data:this.newPackage}
    request(opts, this.service.name).then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.packages.push(this.newPackage);
        this.newPackage={name:'',cls:'0',price:'',val:'',ext:{}};
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.settings}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">

<q-tabs v-model="tab" class="text-primary">
  <q-tab name="template" icon="perm_contact_calendar" :label="tags.template"></q-tab>
  <q-tab name="package" icon="business_center" :label="tags.package"></q-tab>
</q-tabs>
<q-separator></q-separator>
<q-tab-panels v-model="tab" animated swipeable transition-prev="jump-up" transition-next="jump-up">
  <q-tab-panel name="template">
   <q-list>
    <q-item>
     <q-item-section><q-item-label caption>{{tags.segKey}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.segName}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.segType}}</q-item-label></q-item-section>
     <q-item-section avatar></q-item-section>
    </q-item>
    <q-separator></q-separator>
    <q-item v-for="(tpl,k) in template">
     <q-item-section>{{k}}</q-item-section>
     <q-item-section>{{tpl.n}}</q-item-section>
     <q-item-section>{{tags.segTypes[tpl.t]}}</q-item-section>
     <q-item-section avatar><q-icon name="cancel" color="green" @click="rmv_tpl_seg(k)"><q-icon></q-item-section>
    </q-item>
    <q-item>
     <q-item-section>
      <q-input v-model="newSeg.k" :label="tags.segKey"></q-input>
     </q-item-section>
     <q-item-section>
      <q-input v-model="newSeg.n" :label="tags.segName"></q-input>
     </q-item-section>
     <q-item-section>
      <q-select v-model="newSeg.t" :options="segTypes" emit-value map-options></q-select>
     </q-item-section>
     <q-item-section avatar><q-icon name="add_circle" color="primary" @click="add_tpl_seg()"><q-icon></q-item-section>
    </q-item>
   </q-list>
  </q-tab-panel>
  <q-tab-panel name="package">
    <q-card class="my-card">
    <q-card-section>
     {{tags.pkgAlert1}}
    </q-card-section>
    <q-card-section>
     {{tags.pkgAlert2}}
    </q-card-section>
   </q-card>
   <q-list>
    <q-item>
     <q-item-section><q-item-label caption>{{tags.pkgName}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.pkgPrice}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.pkgVal}}</q-item-label></q-item-section>
     <q-item-section avatar></q-item-section>
    </q-item>
    <q-separator></q-separator>
    <q-item v-for="(p,n) in packages">
     <q-item-section>{{p.name}}</q-item-section>
     <q-item-section>{{p.price}}</q-item-section>
     <q-item-section>{{p.val}}{{tags.pkgUnits[p.cls]}}</q-item-section>
     <q-item-section avatar><q-icon color="green" name="cancel" @click="rmv_package(p.id)"><q-icon></q-item-section>
    </q-item>
    <q-item>
     <q-item-section>
      <q-input v-model="newPackage.name" :label="tags.pkgName"></q-input>
     </q-item-section>
     <q-item-section>
      <q-input v-model="newPackage.price" :label="tags.pkgPrice"></q-input>
     </q-item-section>
     <q-item-section>
      <div class="q-gutter-md row">
       <div class="col"><q-input v-model="newPackage.val" :label="tags.pkgVal"></q-input></div>
       <div class="col"><q-select v-model="newPackage.cls" :options="pkgUnits" emit-value map-options></q-select></div>
      </div>
     </q-item-section>
     <q-item-section avatar><q-icon color="primary" name="add_circle" @click="add_package()"><q-icon></q-item-section>
    </q-item>
   </q-list>
  </q-tab-panel>
</q-tab-panels>

    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}