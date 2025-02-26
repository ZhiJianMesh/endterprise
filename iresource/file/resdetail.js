const EMPTY_OUT={cmt:'',num:''};

export default {
inject:['service', 'tags'],
data() {return {
    no:this.$route.query.no,
    factory:this.$route.query.factory,
    resInfo:{}, //res信息
    skuInfo:{},
    ctrl:{api:'',outDlg:false,outDta:{},tag:''},
    suppliers:[] //供应商
}},
created(){
    this.get();
},
methods:{
get() {
    var url = "/api/resource/getInFactory?no="+this.no+"&factory="+this.factory;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        var dt=new Date();
        dt.setTime(resp.data.inDate*60000);
        resp.data.inDate=datetime2str(dt);
        dt.setTime(resp.data.checkAt*60000);
        resp.data.checkAt=datetime2str(dt);
        this.resInfo=resp.data;
        this.get_sku(this.resInfo.sku);
    })
},
get_sku(id) {
    var url = "/api/sku/detail?id="+id;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.skuInfo=resp.data;
    })
},
check(bad) { //清点
    var opts={method:"PUT",url:"/resource/check",data:{
        bad:bad,no:this.no,factory:this.factory
    }};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.resInfo.checkAt=datetime2str(new Date());
    });
},
show_out(type) {
    if(type=='DISC') {
        this.ctrl.tag=this.tags.storage.discard;
    } else {
        this.ctrl.tag=this.tags.storage.dir_out;
    }
    copyObjTo(EMPTY_OUT, this.ctrl.outDta);
    this.ctrl.outDta.type=type;
    this.ctrl.outDlg=true;
},
out_do() {
    if(this.ctrl.outDta.num>this.resInfo.num) {
        this.$refs.errMsg.showErr('6009', 'invalid num');
        return;
    }
    var opts={method:"POST",url:"/resource/dir_out",data:{
        num:this.ctrl.outDta.num,
        no:this.no,
        type:this.ctrl.outDta.type,
        cmt:this.ctrl.outDta.cmt,
        factory:this.factory
    }};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.resInfo.num-=this.ctrl.outDta.num;
        if(this.resInfo.num<=0) {
            this.service.back(); //用完了，会删除，所以退回
        } else {
            this.ctrl.outDlg=false;
        }
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:99vh">
  <q-header>
   <q-toolbar>
    <q-btn flat icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{tags.detail}}-{{resInfo.skuName}}</q-toolbar-title>
    <q-btn @click="show_out('DISC')" :label="tags.storage.discard" icon="delete_sweep" flat dense></q-btn>
    <q-btn @click="show_out('OUT')" :label="tags.storage.dir_out" icon="logout" flat dense></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list dense>
  <q-item>
   <q-item-section>{{tags.storage.no}}</q-item-section>
   <q-item-section>{{no}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.sku.title}}</q-item-section>
   <q-item-section>{{skuInfo.name}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.num}}</q-item-section>
   <q-item-section>{{resInfo.num}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.sku.price}}</q-item-section>
   <q-item-section>{{resInfo.price}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.storage.inDate}}</q-item-section>
   <q-item-section>{{resInfo.inDate}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>
    <q-item-label>{{tags.storage.checkAt}}
     <q-icon name="rule" color="primary" size="1.5em">
      <q-popup-proxy>
       <div class="q-gutter-sm q-pa-sm">
        <q-btn @click="check(true)" :label="tags.storage.chkOk" flat dense color="primary"></q-btn>
        <q-btn @click="check(false)" :label="tags.storage.chkBad" flat dense color="accent"></q-btn>
       </div>
      </q-popup-proxy>
     </q-icon>
    </q-item-label>
   </q-item-section>
   <q-item-section>{{resInfo.checkAt}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.sku.monthDepr}}</q-item-section>
   <q-item-section>{{skuInfo.monthDepr}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.sku.yearDepr}}</q-item-section>
   <q-item-section>{{skuInfo.yearDepr}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.sku.speci}}</q-item-section>
   <q-item-section>{{skuInfo.speci}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.cmt}}</q-item-section>
   <q-item-section>{{resInfo.cmt}}</q-item-section>
  </q-item>
</q-list>
<q-separator inset></q-separator>
<q-banner inline-actions class="bg-indigo-1 q-ma-sm" dense>{{tags.supplier.title}}</q-banner>
<q-list dense>
  <q-item v-for="(s,i) in skuInfo.suppliers">
   <q-item-section>{{s.name}}</q-item-section>
   <q-item-section>{{s.price}}</q-item-section>
  </q-item>
</q-list>

<q-dialog v-model="ctrl.outDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{ctrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input v-model.number="ctrl.outDta.num" :label="tags.num" dense></q-input>
   <q-input v-model="ctrl.outDta.cmt" :label="tags.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="out_do"></q-btn>
   <q-btn :label="tags.close" color="primary" v-close-popup flat></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errMsg"></alert-dialog>
`
}