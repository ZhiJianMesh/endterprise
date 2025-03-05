const EMPTY_GRN={purId:'',tranNo:'',outDate:'',cmt:''};
const EMPTY_GDN={purId:'',tranNo:''};
const EMPTY_IN={cmt:'',price:'',num:'',sku:''};
const RT_TAB="storage_tab";

import PurSelect from "./components/purchase_selector.js";
import SkuSelect from "/ibfbase/components/sku_selector.js";
export default {
components:{
    "pur-select":PurSelect,
    "sku-select":SkuSelect
},
inject:['service', 'tags'],
data() {return {
    res:[], //工厂中的资产清单
    grns:[], //入库单
    gdns:[], //出库单
    outlogs:[],
    
    resCtrl:{cur:1,max:0,inDlg:false,in:{},order:'',ordIcon:'swap_vert'},
    grnCtrl:{cur:1,max:0,dlg:false,state:'WAIT',stateOpts:[],no:-1,dta:{}},
    gdnCtrl:{cur:1,max:0,dlg:false,state:'WAIT',stateOpts:[],no:-1,dta:{}},
    olCtrl:{cur:1,max:0},
    unattach:{no:'',user:[],cmt:'',dlg:false},
    
    factory:{opts:[],cur:-1,name:''},//工厂选项
    purchase:{},
    sku:{},
    tab:'' //res,gdn,grn,out
}},
created(){
    this.service.myFactories().then(ll=>{
        if(ll.length==0) return;
        this.factory.opts=ll;
        this.factory.cur=ll[0].id;
        this.factory.name=ll[0].name;
        
        var tab=this.service.getRt(RT_TAB);
        this.tab=tab?tab:'res';
        this.tab_changed(this.tab);
    });
    for(var i in this.tags.grnState) {
        this.grnCtrl.stateOpts.push({value:i,label:this.tags.grnState[i]});
    }
    for(var i in this.tags.gdnState) {
        this.gdnCtrl.stateOpts.push({value:i,label:this.tags.gdnState[i]});
    }
},
methods:{
query_res(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var opts={method:"GET", url:"/resource/listByFac?factory="
        +this.factory.cur+"&order="+this.resCtrl.order
        +"&num="+this.service.N_PAGE+"&offset="+offset}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.res=[];
            this.resCtrl.max=0;
            this.resCtrl.cur=1;
            return;
        }
        var dt=new Date();
        for(var l of resp.data.list) {
            dt.setTime(l.inDate*60000);
            l.inDate=datetime2str(dt);
            dt.setTime(l.checkAt*60000);
            l.checkAt=datetime2str(dt);
        }
        this.res = resp.data.list;
        this.resCtrl.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
query_grn(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var opts={method:"GET", url:"/grn/listByFac?factory="
        +this.factory.cur+"&state="+this.grnCtrl.state
        +"&num="+this.service.N_PAGE+"&offset="+offset}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.grns=[];
            this.grnCtrl.max=0;
            this.grnCtrl.cur=1;
            return;
        }
        var purs=resp.data.purs;
        var dt=new Date();
        for(var l of resp.data.list) {
            dt.setTime(l.outDate*60000);
            l.outDate=datetime2str(dt);
            dt.setTime(l.inDate*60000);
            l.inDate=datetime2str(dt);
            l.type=this.tags.grnType[l.type];
            var pur=purs[l.purId];
            l.prjName=pur[0];
            l.applicant=pur[1];
        }
        this.grns = resp.data.list;
        this.grnCtrl.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
query_gdn(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var opts={method:"GET", url:"/gdn/listByFac?factory="
        +this.factory.cur+"&state="+this.gdnCtrl.state
        +"&num="+this.service.N_PAGE+"&offset="+offset}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.gdns=[];
            this.gdnCtrl.max=0;
            this.gdnCtrl.cur=1;
            return;
        }

        var purs=resp.data.purs;
        var dt=new Date();
        for(var l of resp.data.list) {
            dt.setTime(l.outDate*60000);
            l.outDate=datetime2str(dt);
            if(l.cfmDate!=0) {
                dt.setTime(l.cfmDate*60000);
                l.cfmDate=datetime2str(dt);
            } else {
                l.cfmDate=this.tags.gdn.unCfmed;
            }
            l.type=this.tags.gdnType[l.type];
            l.state=this.tags.gdnState[l.state];
            var pur=purs[l.purId];
            l.prjName=pur[0];
            l.applicant=pur[1];
        }
        this.gdns = resp.data.list;
        this.gdnCtrl.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
query_outlog(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var opts={method:"GET", url:"/resource/outlog?factory="
        +this.factory.cur+"&num="+this.service.N_PAGE+"&offset="+offset}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.outlogs=[];
            this.olCtrl.max=0;
            this.olCtrl.cur=1;
            return;
        }
        var dt=new Date();
        for(var l of resp.data.list) {
            dt.setTime(l.createAt);
            l.createAt=datetime2str(dt);
            l.type=this.tags.outType[l.type];
        }
        this.outlogs=resp.data.list;
        this.olCtrl.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
tab_changed(tab) {
    this.service.setRt(RT_TAB, tab);
    if(tab=='res') {
        if(this.res.length==0) {
            this.query_res(this.resCtrl.cur);
        }
    } if(tab=='grn') {
        if(this.grns.length==0) {
            this.query_grn(this.grnCtrl.cur);
        }
    } else if(tab=='gdn') {
        if(this.gdns.length==0) {
            this.query_gdn(this.gdnCtrl.cur);
        }
    } else if(tab=='out'){
        if(this.outlogs.length==0) {
            this.query_outlog(this.olCtrl.cur);
        }
    }
},
factory_changed(i) {
    if(i==this.factory.cur)return;
    this.res=[];
    this.grns=[];
    this.gdns=[];
    this.factory.cur=i;
    this.factory.name=this.factory.opts[i].name;
    this.tab_changed(this.tab);
},
grn_sta_changed() {
    this.query_grn(this.grnCtrl.cur);
},
gdn_sta_changed() {
    this.query_gdn(this.gdnCtrl.cur);
},
changed_res_ord() {
    if(this.resCtrl.order=='') {
        this.resCtrl.order='asc';
        this.resCtrl.ordIcon='vertical_align_top';
    } else if(this.resCtrl.order=='asc') {
        this.resCtrl.order='desc';
        this.resCtrl.ordIcon='vertical_align_bottom';
    } else {
        this.resCtrl.order='';
        this.resCtrl.ordIcon='swap_vert';
    }
    this.query_res(this.resCtrl.cur);
},
show_grn(i) {
    if(i>-1) {
        this.grnCtrl.tag=this.tags.modify;
        copyObjTo(this.grns[i], this.grnCtrl.dta);
    } else {
        this.grnCtrl.tag=this.tags.add;
        copyObjTo(EMPTY_GRN, this.grnCtrl.dta);
    }
    this.grnCtrl.dta.factory=this.factory.cur;
    this.grnCtrl.tag+=this.tags.storage.in;
    this.grnCtrl.no=i;
    this.grnCtrl.dlg=true;
},
grn_do() {
    var opts;
    if(this.grnCtrl.no>-1) {
        opts={method:"PUT",url:"/grn/update",data:this.grnCtrl.dta};
    } else {
        this.grnCtrl.dta.purId=this.purchase.id;
        var outDate=Date.parse(this.grnCtrl.dta.outDate);//ms
        this.grnCtrl.dta.outDate=parseInt(outDate/60000);
        opts={method:"POST",url:"/grn/start",data:this.grnCtrl.dta};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.grnCtrl.no=-2;
        this.grnCtrl.dlg=false;
        this.query_grn(this.grnCtrl.cur);
    });
},
remove_grn() {
    var opts={method:"DELETE",url:"/grn/remove?purId="
        +this.grnCtrl.dta.purId+"&factory="+this.factory.cur};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.grnCtrl.no=-2;
        this.grnCtrl.dlg=false;
        this.query_grn(this.grnCtrl.cur);
    });
},
show_gdn(i) {
    if(i>-1) {
        this.gdnCtrl.tag=this.tags.modify;
        copyObjTo(this.gdns[i], this.gdnCtrl.dta);
    } else {
        this.gdnCtrl.tag=this.tags.add;
        copyObjTo(EMPTY_GDN, this.gdnCtrl.dta);
    }
    this.gdnCtrl.dta.factory=this.factory.cur;
    this.gdnCtrl.tag+=this.tags.storage.out;
    this.gdnCtrl.no=i;
    this.gdnCtrl.dlg=true;
},
gdn_do() {
    var opts;
    if(this.gdnCtrl.no>-1) {
        opts={method:"PUT",url:"/gdn/update",data:this.gdnCtrl.dta};
    } else {
        this.gdnCtrl.dta.purId=this.purchase.id;
        opts={method:"POST",url:"/gdn/start",data:this.gdnCtrl.dta};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.gdnCtrl.no=-2;
        this.gdnCtrl.dlg=false;
        this.query_gdn(this.gdnCtrl.cur);
    });
},
remove_gdn() {
    var opts={method:"DELETE",url:"/gdn/remove?purId="
        +this.gdnCtrl.dta.purId+"&factory="+this.factory.cur};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.gdnCtrl.no=-2;
        this.gdnCtrl.dlg=false;
        this.query_gdn(this.gdnCtrl.cur);
    });
},
show_dir_in() {
    this.resCtrl.tag=this.tags.storage.dir_in;
    copyObjTo(EMPTY_IN, this.resCtrl.in);
    this.resCtrl.in.factory=this.factory.cur;
    this.resCtrl.inDlg=true;
},
dir_in_do() {
    this.resCtrl.in.sku=this.sku.id;
    var opts={method:"POST",url:"/grn/dir_in",data:this.resCtrl.in};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.resCtrl.inDlg=false;
        this.query_res(this.resCtrl.cur);
    });
},
show_unattach() {
    this.unattach.no='';
    this.unattach.user=[];
    this.unattach.cmt='';
    this.unattach.dlg=true;
},
unattach_do() {
    var opts={method:"POST",url:"/resource/unattach",data:{
        no:this.unattach.no,
        uid:this.unattach.user[0],
        cmt:this.unattach.cmt,
        factory:this.factory.cur
    }};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.unattach.dlg=false;
        this.query_res(this.resCtrl.cur);
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header>
   <q-toolbar>
     <q-btn flat icon="arrow_back" dense @click="service.back()"></q-btn>
     <q-toolbar-title>{{tags.storage.title}}</q-toolbar-title>
     <q-btn flat dense icon-right="factory" :label="factory.name">
       <q-menu>
        <q-list style="min-width:100px">
         <q-item clickable v-close-popup v-for="(f,i) in factory.opts" @click="factory_changed(i)">
           <q-item-section>{{f.name}}</q-item-section>
         </q-item>
        </q-list>
       </q-menu>
     </q-btn>
   </q-toolbar>
  </q-header>
  <q-footer>
   <q-tabs v-model="tab" @update:model-value="tab_changed"
    dense align="justify" switch-indicator inline-label
    class="text-grey bg-grey-3" active-color="primary" indicator-color="primary">
    <q-tab name="res" icon="list" :label="tags.storage.list"></q-tab>
    <q-tab name="grn" icon="exit_to_app" :label="tags.storage.in"></q-tab>
    <q-tab name="gdn" icon="output" :label="tags.storage.out"></q-tab>
    <q-tab name="out" icon="bus_alert" :label="tags.storage.out_log"></q-tab>
   </q-tabs>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-none">
<q-tab-panels v-model="tab">

<q-tab-panel name="res" class="q-pa-none">
 <div class="text-right bg-grey-3 q-pa-sm">
  <q-btn color="accent" icon="link_off" @click="show_unattach"
  :label="tags.storage.unattach" flat dense></q-btn>
  <q-btn color="secondary" icon="rule" @click="show_dir_in"
   :label="tags.storage.check" flat dense></q-btn>
  <q-btn color="primary" @click="show_dir_in"
  :label="tags.storage.dir_in" icon="login" flat dense></q-btn>
 </div>
 <div class="q-pa-sm flex flex-center" v-show="resCtrl.max>1">
  <q-pagination v-model="resCtrl.cur" color="primary" :max="resCtrl.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_res"></q-pagination>
 </div>
 <q-list dense separator>
  <q-item>
   <q-item-section><q-item-label caption>{{tags.storage.no}}</q-item-label></q-item-section>
   <q-item-section>
    <q-item-label caption>
    {{tags.storage.checkAt}}
    <q-icon :name="resCtrl.ordIcon" @click="changed_res_ord" size="1.5em" color="primary"></q-icon>
    </q-item-label>
   </q-item-section>
   <q-item-section side><q-item-label caption>{{tags.storage.inDate}}</q-item-label></q-item-section>
  </q-item>
  <q-item v-for="(r,i) in res" clickable
   @click="service.goto('/resdetail?no='+r.no+'&factory='+this.factory.cur)">
    <q-item-section>
     <q-item-label>{{r.no}}</q-item-label>
     <q-item-label caption>{{r.skuName}}/{{r.num}}</q-item-label>
    </q-item-section>
    <q-item-section>{{r.checkAt}}</q-item-section>
    <q-item-section side>{{r.inDate}}</q-item-section>
  </q-item>
 </q-list>
</q-tab-panel>

<q-tab-panel name="grn" class="q-pa-none">
<div class="row bg-grey-3 q-pa-sm q-pa-sm">
 <div class="col-2">
  <q-select v-model="grnCtrl.state" :options="grnCtrl.stateOpts"
   @update:model-value="grn_sta_changed"
   emit-value map-options dense></q-select>
 </div>
 <div class="col self-center">
  <div class="text-right">
   <q-btn color="primary" @click="show_grn(-1)" icon="add" flat dense></q-btn>
  </div>
 </div>
</div>
<div class="q-pa-sm flex flex-center" v-show="grnCtrl.max>1">
 <q-pagination v-model="grnCtrl.cur" color="primary" :max="grnCtrl.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_grn"></q-pagination>
</div>
 <q-list dense separator class="q-pa-sm">
  <q-item>
   <q-item-section><q-item-label caption>{{tags.storage.tranNo}}</q-item-label></q-item-section>
   <q-item-section><q-item-label caption>{{tags.cmt}}</q-item-label></q-item-section>
   <q-item-section side><q-item-label caption>{{tags.storage.applicant}}</q-item-label></q-item-section>
  </q-item>
  <q-item v-for="(g,i) in grns" @click="service.goto('/grndetail?id='+g.purId+'&factory='+factory.cur)" clickable>
    <q-item-section>
     <q-item-label>{{g.type}}</q-item-label>
     <q-item-label caption>{{g.tranNo}}</q-item-label>
    </q-item-section>
    <q-item-section>
     <q-item-label>{{g.cmt}}</q-item-label>
     <q-item-label caption>{{g.outDate}} / {{g.inDate}}</q-item-label>
    </q-item-section>
    <q-item-section side>
     <q-item-label>{{g.applicant}}</q-item-label>
     <q-item-label caption>{{g.prjName}}</q-item-label>
    </q-item-section>
  </q-item>
 </q-list>
</q-tab-panel>

<q-tab-panel name="gdn" class="q-pa-none">
<div class="row bg-grey-3 q-pa-sm">
 <div class="col-2">
  <q-select v-model="gdnCtrl.state" :options="gdnCtrl.stateOpts"
   @update:model-value="gdn_sta_changed"
   emit-value map-options dense></q-select>
 </div>
 <div class="col self-center">
  <div class="text-right">
   <q-btn color="primary" @click="show_gdn(-1)" icon="add" flat dense></q-btn>
  </div>
 </div>
</div>
<div class="q-pa-sm flex flex-center" v-show="gdnCtrl.max>1">
 <q-pagination v-model="gdnCtrl.cur" color="primary" :max="gdnCtrl.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_gdn"></q-pagination>
</div>
 <q-list dense separator class="q-pa-sm">
  <q-item>
   <q-item-section><q-item-label caption>{{tags.storage.tranNo}}</q-item-label></q-item-section>
   <q-item-section><q-item-label caption>{{tags.cmt}}</q-item-label></q-item-section>
   <q-item-section side><q-item-label caption>{{tags.storage.applicant}}</q-item-label></q-item-section>
  </q-item>
  <q-item v-for="(g,i) in gdns" @click="service.goto('/gdndetail?id='+g.purId+'&factory='+this.factory.cur)" clickable>
    <q-item-section>
     <q-item-label>{{g.type}}</q-item-label>
     <q-item-label caption>{{g.tranNo}}</q-item-label>
    </q-item-section>
    <q-item-section>
     <q-item-label>{{g.cmt}}</q-item-label>
     <q-item-label>{{g.applyCmt}}</q-item-label>
     <q-item-label caption>{{g.outDate}} - {{g.cfmDate}}</q-item-label>
    </q-item-section>
    <q-item-section side>
     <q-item-label>{{g.applicant}}</q-item-label>
     <q-item-label caption>{{g.priName}}</q-item-label>
    </q-item-section>
  </q-item>
 </q-list>
</q-tab-panel>

<q-tab-panel name="out" class="q-pa-none">
 <div class="q-pa-sm flex flex-center" v-show="olCtrl.max>1">
  <q-pagination v-model="olCtrl.cur" color="primary" :max="olCtrl.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_outlog"></q-pagination>
 </div>
 <q-list dense separator class="q-pa-sm">
  <q-item>
   <q-item-section><q-item-label caption>{{tags.storage.no}}</q-item-label></q-item-section>
   <q-item-section><q-item-label caption>{{tags.cmt}}</q-item-label></q-item-section>
   <q-item-section side><q-item-label caption>{{tags.createAt}}</q-item-label></q-item-section>
  </q-item>
  <q-item v-for="(o,i) in outlogs">
    <q-item-section>
     <q-item-label>{{o.no}}</q-item-label>
     <q-item-label caption>{{o.skuName}}/{{o.num}}</q-item-label>
    </q-item-section>
    <q-item-section>
     <q-item-label>{{o.type}}</q-item-label>
     <q-item-label caption>{{o.cmt}}</q-item-label>
    </q-item-section>
    <q-item-section side>
     <q-item-label>{{o.execAcc}}</q-item-label>
     <q-item-label caption>{{o.createAt}}</q-item-label>
    </q-item-section>
  </q-item>
 </q-list>
</q-tab-panel>

</q-tab-panels>

    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="grnCtrl.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{grnCtrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <pur-select v-model="purchase" :label="tags.storage.purchase" v-show="grnCtrl.no<0"></pur-select>
   <q-input v-model="grnCtrl.dta.tranNo" :label="tags.storage.tranNo" dense></q-input>
   <date-input v-model="grnCtrl.dta.outDate" :close="tags.ok" :label="tags.storage.outDate" min="-5"></date-input>
   <q-input :label="tags.cmt" v-model="grnCtrl.dta.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.remove" color="red" @click="remove_grn" flat v-show="grnCtrl.no>-1"></q-btn>
   <q-btn :label="tags.ok" color="primary" @click="grn_do"></q-btn>
   <q-btn :label="tags.close" color="primary" v-close-popup flat></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<q-dialog v-model="gdnCtrl.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{gdnCtrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <pur-select v-model="purchase" :label="tags.storage.purchase" v-show="gdnCtrl.no<0"></pur-select>
   <q-input v-model="gdnCtrl.dta.tranNo" :label="tags.storage.tranNo" dense></q-input>
   <q-input :label="tags.cmt" v-model="gdnCtrl.dta.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.remove" color="red" @click="remove_gdn" flat v-show="gdnCtrl.no>-1"></q-btn>
   <q-btn :label="tags.ok" color="primary" @click="gdn_do"></q-btn>
   <q-btn :label="tags.close" color="primary" v-close-popup flat></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<q-dialog v-model="resCtrl.inDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{resCtrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <sku-select v-model="sku" :label="tags.sku.title"></sku-select>
   <q-input v-model.number="resCtrl.in.price" :label="tags.sku.price" dense></q-input>
   <q-input v-model.number="resCtrl.in.num" :label="tags.num"></q-input>
   <q-input v-model="resCtrl.in.cmt" :label="tags.cmt"></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="dir_in_do"></q-btn>
   <q-btn :label="tags.close" color="primary" v-close-popup flat></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<q-dialog v-model="unattach.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{tags.storage.unattach}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input v-model="unattach.no" :label="tags.storage.no" dense></q-input>
   <user-selector :accounts="unattach.user" :label="tags.account" :useid="true" :multi="false"></user-selector>
   <q-input v-model="unattach.cmt" :label="tags.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="unattach_do"></q-btn>
   <q-btn :label="tags.close" color="primary" v-close-popup flat></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
`
}