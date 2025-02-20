const EMPTY_SKU={name:'',speci:'',cmt:'',createAt:'',type:'',noHead:'',yearDepr:'',monthDepr:''};
export default {
inject:['service', 'tags'],
data() {return {
    skus:[],
    edt:{sku:{}},
    skuTypes:[],
    ctrl:{no:-2,tag:'',skuDlg:false,cur:1,max:0}
}},
created(){
    this.query_skus(1);
    for(var i in this.tags.skuType) {
        this.skuTypes.push({label:this.tags.skuType[i],value:i});
    }
},
methods:{
query_skus(pg){
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var opts={method:"GET", url:"/sku/list?offset="+offset+"&num="+this.service.N_PAGE};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.skus=[];
            this.ctrl.max=0;
            this.ctrl.cur=1;
            return;
        }
        var dt=new Date();
        for(var s of resp.data.list) {
            dt.setTime(s.createAt*60000);
            s.createAt_s=date2str(dt);
            s.type_s=this.tags.skuType[s.type];
        }
        this.skus=resp.data.list;
        this.ctrl.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })  
},
show_sku(i) {
    if(i>-1) {
        this.ctrl.tag=this.tags.modify;
        this.edt.sku.id=this.skus[i].id;
        copyObjTo(this.skus[i], this.edt.sku);
    } else {
        this.ctrl.tag=this.tags.add;
        copyObjTo(EMPTY_SKU, this.edt.sku);
    }
    this.ctrl.tag+=this.tags.sku.title;
    this.ctrl.no=i;
    this.ctrl.skuDlg=true;
},
sku_do() {
    var opts;
    if(this.ctrl.no>-1) {
        opts={method:"PUT",url:"/sku/update",data:this.edt.sku};
    } else {
        opts={method:"POST",url:"/sku/add",data:this.edt.sku};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(this.ctrl.no>-1) {
            copyObjTo(this.edt.sku, this.skus[this.ctrl.no]);
        } else {
            var o = {id:resp.data.id,
                createAt_s:date2str(new Date()),
                type_s:this.tags.skuType[this.edt.sku.type]};
            copyObjTo(this.edt.sku, o);
            this.skus.push(o);
        }
        this.ctrl.no=-2;
        this.ctrl.skuDlg=false;
    });
},
remove_sku(i) {
    var opts={method:"DELETE",url:"/sku/remove?id="+this.skus[i].id};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.skus.splice(i,1);
    });
},
monDeprChanged() {
    if(this.edt.sku.yearDepr!='') {
        return; //已设置了，不自动变化
    }
    var yd=this.edt.sku.monthDepr*12;
    this.edt.sku.yearDepr=yd.toFixed(2);
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:99vh">
  <q-header>
   <q-toolbar>
     <q-btn flat round icon="arrow_back" dense @click="service.back()"></q-btn>
     <q-toolbar-title>{{tags.sku.title}}</q-toolbar-title>
     <q-btn flat icon="add_circle" @click="show_sku(-2)"></q-btn>
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
  <q-item-section><q-item-label caption>{{tags.name}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.sku.type}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.sku.createAt}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.cmt}}</q-item-label></q-item-section>
 </q-item>
 <q-item v-for="(s,i) in skus" clickable @click="service.goto('/skudetail?id='+s.id)">
  <q-item-section>
   <q-item-label>{{s.name}}</q-item-label>
   <q-item-label caption>{{s.speci}}</q-item-label>
  </q-item-section>
  <q-item-section>{{s.type_s}}</q-item-section>
  <q-item-section>{{s.createAt_s}}</q-item-section>
  <q-item-section>
   <q-item-label>{{s.cmt}}</q-item-label>
   <q-item-label caption>
    {{s.noHead}}/{{s.monthDepr}}/{{s.yearDepr}}
   </q-item-label>
  </q-item-section>
  <q-menu touch-position context-menu>
    <q-list dense style="min-width:100px">
      <q-item clickable v-close-popup @click="show_sku(i)">
        <q-item-section avatar><q-icon name="edit" color="primary"></q-icon></q-item-section>
        <q-item-section>{{tags.modify}}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="remove_sku(i)">
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

<q-dialog v-model="ctrl.skuDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{ctrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input :label="tags.name" v-model="edt.sku.name" dense></q-input>
   <q-select :label="tags.sku.type" v-model="edt.sku.type" :options="skuTypes" emit-value map-options></q-select>
   <q-input :label="tags.sku.noHead" v-model="edt.sku.noHead" dense></q-input>
   <q-input :label="tags.sku.monthDepr" v-model.number="edt.sku.monthDepr" dense
   @update:model-value="monDeprChanged"></q-input>
   <q-input :label="tags.sku.yearDepr" v-model.number="edt.sku.yearDepr" dense></q-input>
   <q-input :label="tags.sku.speci" v-model="edt.sku.speci" dense></q-input>
   <q-input :label="tags.cmt" v-model="edt.sku.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="sku_do"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
`
}