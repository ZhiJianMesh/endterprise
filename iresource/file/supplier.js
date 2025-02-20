const EMPTY_SUPPLIER={name:'',taxid:'',cmt:'',addr:'',business:''};
export default {
inject:['service', 'tags'],
data() {return {
    suppliers:[],
    edt:{sup:{}},
    ctrl:{no:-2,tag:'',supDlg:false,cur:1,max:0}
}},
created(){
    this.query_sups(1);
    for(var i in this.tags.supplierType) {
        this.skuTypes.push({label:this.tags.supplierType[i],value:i});
    }
},
methods:{
query_sups(pg){
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var opts={method:"GET", url:"/supplier/list?offset="+offset+"&num="+this.service.N_PAGE};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.suppliers=[];
            this.ctrl.max=0;
            this.ctrl.cur=1;
            return;
        }
        var dt=new Date();
        for(var s of resp.data.list) {
            dt.setTime(s.createAt*60000);
            s.createAt_s=date2str(dt);
        }
        this.suppliers=resp.data.list;
        this.ctrl.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
show_supplier(i) {
    if(i>-1) {
        this.ctrl.tag=this.tags.modify;
        this.edt.sup.id=this.suppliers[i].id;
        copyObjTo(this.suppliers[i], this.edt.sup);
    } else {
        this.ctrl.tag=this.tags.add;
        copyObjTo(EMPTY_SUPPLIER, this.edt.sup);
    }
    this.ctrl.tag+=this.tags.supplier.title;
    this.ctrl.no=i;
    this.ctrl.supDlg=true;
},
supplier_do() {
    var opts;
    if(this.ctrl.no>-1) {
        opts={method:"PUT",url:"/supplier/update",data:this.edt.sup};
    } else {
        opts={method:"POST",url:"/supplier/add",data:this.edt.sup};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(this.ctrl.no>-1) {
            copyObjTo(this.edt.sup, this.suppliers[this.ctrl.no]);
        } else {
            var o = {id:resp.data.id,createAt_s:date2str(new Date())};
            copyObjTo(this.edt.sup, o);
            this.suppliers.push(o);
        }
        this.ctrl.no=-2;
        this.ctrl.supDlg=false;
    });
},
remove_supplier(i) {
    var opts={method:"DELETE",url:"/supplier/remove?id="+this.suppliers[i].id};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.suppliers.splice(i,1);
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:99vh">
  <q-header>
   <q-toolbar>
     <q-btn flat round icon="arrow_back" dense @click="service.back()"></q-btn>
     <q-toolbar-title>{{tags.supplier.title}}</q-toolbar-title>
     <q-btn flat icon="add_circle" @click="show_supplier(-2)"></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<div class="q-pa-sm flex flex-center" v-show="ctrl.max>1">
 <q-pagination v-model="ctrl.cur" color="primary" :max="ctrl.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query"></q-pagination>
</div>
<q-list separator>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.name}}/{{tags.supplier.addr}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.supplier.creator}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.cmt}}</q-item-label></q-item-section>
 </q-item>
 <q-item v-for="(s,i) in suppliers" clickable @click="service.goto('/supdetail?id='+s.id)">
  <q-item-section>
   <q-item-label>{{s.name}}</q-item-label>
   <q-item-label caption>{{s.addr}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label>{{s.creator}}</q-item-label>
   <q-item-label caption>{{s.createAt_s}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label>{{s.cmt}}</q-item-label>
   <q-item-label caption>{{s.business}}</q-item-label>
  </q-item-section>
  <q-menu touch-position context-menu>
    <q-list dense style="min-width:100px">
      <q-item clickable v-close-popup @click="show_supplier(i)">
        <q-item-section avatar><q-icon name="edit" color="primary"></q-icon></q-item-section>
        <q-item-section>{{tags.modify}}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="remove_supplier(i)">
        <q-item-section avatar><q-icon name="delete_forever" color="red"></q-icon></q-item-section>
        <q-item-section>{{tags.remove}}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
 </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="ctrl.supDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{ctrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input :label="tags.name" v-model="edt.sup.name" dense></q-input>
   <q-input :label="tags.supplier.addr" v-model="edt.sup.addr" dense></q-input>
   <q-input :label="tags.supplier.taxid" v-model="edt.sup.taxid" dense></q-input>
   <q-input :label="tags.supplier.business" v-model="edt.sup.business" dense></q-input>
   <q-input :label="tags.cmt" v-model="edt.sup.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="supplier_do"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
`
}