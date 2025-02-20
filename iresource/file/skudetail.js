import SupplierInput from "./components/supplier_selector.js";
export default {
inject:['service', 'tags'],
components:{
    "supplier-input":SupplierInput
},
data() {return {
    id:this.$route.query.id,
    skuInfo:{}, //sku信息
    suppliers:[], //供应商
    feedbacks:[], //使用反馈
    edtSup:{show:false,supplier:'',price:''}
}},
created(){
    this.get();
    this.getFeedbacks();
},
methods:{
get() {
    var url = "/api/sku/get?id="+this.id;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        dt.setTime(resp.data.createAt*60000);
        resp.data.createAt_s=date2str(dt);
        resp.data.type_s=this.tags.skuType[resp.data.type];
        this.skuInfo=resp.data;
        if(resp.data.suppliers) {
            this.suppliers=resp.data.suppliers;
        } else {
            this.suppliers==[];
        }
    })
},
//反馈记录操作
getFeedbacks() {
    var url = "/api/sku/listFeedback?id="+this.id;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        for(var e of resp.data.list) {
            dt.setTime(e.createAt*60000);
            e.createAt_s=date2str(dt);
            e.level_s=this.tags.fbLevel[e.level];
        }
        this.feedbacks=resp.data.list;
    });
},
//供应商操作
getSuppliers() {
    var url = "/api/sku/listSupplier?id="+this.id;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        for(var e of resp.data.list) {
            dt.setTime(e.createAt*60000);
            e.createAt_s=date2str(dt);
        }
        this.feedbacks=resp.data.list;
    });
},
showAddSup() {
    this.edtSup.supplier='';
    this.edtSup.price='';
    this.edtSup.show=true;
},
addSupplier() {
    var url = "/api/sku/addSupplier";
    var dta={id:this.id,supplier:this.edtSup.supplier.id,price:this.edtSup.price};
    request({method:"POST",url:url,data:dta}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        dta.createAt_s=date2str(new Date());
        dta.name=this.edtSup.supplier.name;
        this.suppliers.push(dta);
        this.edtSup.show=false;
    });
},
rmvSupplier(i) {
    var url = "/api/sku/removeSupplier?id="+this.id
        +"&supplier="+this.suppliers[i].supplier;
    request({method:"DELETE",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.suppliers.splice(i,1);
    })
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:99vh">
  <q-header>
   <q-toolbar>
    <q-btn flat icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{tags.detail}}-{{skuInfo.name}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list dense>
  <q-item>
   <q-item-section>{{tags.name}}</q-item-section>
   <q-item-section>{{skuInfo.name}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.sku.type}}</q-item-section>
   <q-item-section>{{skuInfo.type_s}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.sku.createAt}}</q-item-section>
   <q-item-section>{{skuInfo.createAt_s}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.cmt}}</q-item-section>
   <q-item-section>{{skuInfo.cmt}}</q-item-section>
  </q-item>
</q-list>
<q-separator inset></q-separator>
<q-banner inline-actions class="bg-indigo-1 q-ma-sm" dense>
  {{tags.supplier.title}}
  <template v-slot:action>
   <q-icon flat color="primary" name="add_circle" @click.stop="showAddSup"></q-icon>
  </template>
</q-banner>
<q-list dense>
  <q-item v-for="(s,i) in suppliers">
   <q-item-section>{{s.name}}</q-item-section>
   <q-item-section>{{s.price}}</q-item-section>
   <q-item-section side>
    <q-btn icon="cancel" color="red" @click="rmvSupplier(i)" flat></q-btn>
   </q-item-section>
  </q-item>
  <q-item v-show="edtSup.show">
   <q-item-section>
    <supplier-input v-model="edtSup.supplier" :label="tags.supplier.title"></supplier-input>
   </q-item-section>
   <q-item-section>
    <q-input v-model.number="edtSup.price" :label="tags.sku.price" dense></q-input>
   </q-item-section>
   <q-item-section side>
   <q-btn :label="tags.ok" color="primary" @click="addSupplier" flat></q-btn>
    <q-btn :label="tags.cancel" color="primary" @click="edtSup.show=false" flat></q-btn>
   </q-item-section>
  </q-item>
</q-list>

<q-banner inline-actions class="bg-indigo-1 q-ma-sm" dense>
  {{tags.sku.feedback}}
</q-banner>
<q-list dense>
  <q-item v-for="f in feedbacks">
   <q-item-section>{{f.level_s}}</q-item-section>
   <q-item-section>{{f.creator}}</q-item-section>
   <q-item-section side>{{f.createAt_s}}</q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errMsg"></alert-dialog>
`
}