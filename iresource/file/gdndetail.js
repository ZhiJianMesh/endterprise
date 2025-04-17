export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    dtl:{},
    ctrl:{editable:false,editing:false,edt:{}/*编辑内容*/},

    skuList:[],
    skuCtrl:{dlg:false,dta:{},sku:{}/*用在SkuSelector中输入sku*/}
}},
created(){
    this.query();
},
methods:{
query() {
    var url="/gdn/get?purId="+this.id;
    request({method:"GET", url:url}, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        var p=resp.data;
        //outDate,cfmDate,type,state,tranNo,cmt,execAcc,prjName,applicant
        this.ctrl.editable=p.state=='WAIT'||p.state=='CHK';
        var dt=new Date();
        if(p.cfmDate!=0) {
            dt.setTime(p.cfmDate*60000);
            p.cfmDate=datetime2str(dt);
        } else {
            p.cfmDate=this.tags.gdn.unCfmed;
        }
        dt.setTime(p.outDate*60000);
        p.outDate=datetime2str(dt);
        p.type=this.tags.gdnType[p.type];
        p.state=this.tags.gdnState[p.state];
        this.dtl=p;
        this.gdn_list();
    })
},
show_edit() {
    this.ctrl.editing=true;
    copyObjTo(this.dtl, this.ctrl.edt);
},
update() {
    var dta=copyObj(this.ctrl.edt, ['tranNo','cmt','receiver','applyCmt']);
    dta.purId=this.id;
    dta.factory=this.dtl.factory;
    request({method:"PUT", url:"/gdn/update", data:dta}, this.service.name).then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.editing=false;
        copyObjTo(this.ctrl.edt, this.dtl, ['tranNo','cmt','receiver','applyCmt']);
    });
},
remove() {
    this.$refs.cfmDlg.show(this.tags.cfmRmv, ()=>{
        var opts={method:"DELETE",url:"/gdn/remove?purId="+this.id+"&factory="+this.dtl.factory};
        request(opts, this.service.name).then(resp => {
            if(resp.code!=RetCode.OK) {
                this.$refs.alertDlg.showErr(resp.code, resp.info);
                return;
            }
            this.service.back();
        })
    });
},
gdn_list() {
    var url="/gdn/gdnlist?purId="+this.id+"&factory="+this.dtl.factory;
    request({method:"GET", url:url}, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        this.skuList=resp.data.list;
    })
},
show_ship() {
    this.skuCtrl.dta={num:'',no:''};
    this.skuCtrl.dlg=true;
},
ship_out() {
    var d=this.skuCtrl.dta;
    if(!d.num)return;
    var dta={no:d.no, num:d.num, purId:this.id, factory:this.dtl.factory};

    var opts={method:"POST", url:"/gdn/shipOut", data:dta};
    request(opts, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.gdn_list();
        this.skuCtrl.dlg=false;
    });
},
remove_sku(i) {
    var url="/gdn/removeSku?purId="+this.id
        +"&factory="+this.dtl.factory+"&no="+this.skuList[i].no;
    request({method:"DELETE", url:url}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.skuList.splice(i,1);
    });
},
start_scan() { //开始扫描二维码
    var jsCbId=__regsiterCallback(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.skuCtrl.dta.no=resp.data.value;
    });
    Platform.scanCode(jsCbId);
}
},
template:`
<q-layout view="HHH lpr FFF" container style="height:99.9vh">
  <q-header>
   <q-toolbar>
     <q-btn flat icon="arrow_back" dense @click="service.back()"></q-btn>
     <q-toolbar-title>{{tags.gdn.title}}</q-toolbar-title>
     <q-btn flat icon="clear" @click="remove" v-if="ctrl.editable&&!ctrl.editing" dense></q-btn>
     <q-btn flat icon="edit" @click="show_edit" v-if="ctrl.editable&&!ctrl.editing" dense></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-sm">
<q-list dense>
  <q-item>
    <q-item-section>{{tags.prjName}}</q-item-section>
    <q-item-section side>{{dtl.prjName}}</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>{{tags.applicant}}</q-item-section>
    <q-item-section side>{{dtl.applicant}}</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>{{tags.type}}</q-item-section>
    <q-item-section side>{{dtl.type}}</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>{{tags.state}}</q-item-section>
    <q-item-section side>{{dtl.state}}</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>{{tags.storage.execAcc}}</q-item-section>
    <q-item-section side>{{dtl.execAcc}}</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>{{tags.storage.outDate}}</q-item-section>
    <q-item-section side>{{dtl.outDate}}</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>{{tags.storage.cfmDate}}</q-item-section>
    <q-item-section side>{{dtl.cfmDate}}</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>{{tags.gdn.applyCmt}}</q-item-section>
    <q-item-section side>{{dtl.applyCmt}}</q-item-section>
  </q-item>
</q-list>
<q-list dense v-if="!ctrl.editing">
  <q-item>
   <q-item-section>{{tags.storage.tranNo}}</q-item-section>
   <q-item-section side>{{dtl.tranNo}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.receiver}}</q-item-section>
   <q-item-section side>{{dtl.receiver}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.cmt}}</q-item-section>
   <q-item-section side>{{dtl.cmt}}</q-item-section>
  </q-item>
</q-list>
<div v-else>
  <q-input v-model="ctrl.edt.tranNo" :label="tags.storage.tranNo"></q-input>
  <q-input v-model="ctrl.edt.receiver" :label="tags.receiver"></q-input>
  <q-input v-model="ctrl.edt.cmt" :label="tags.cmt"></q-input>
  <div class="row justify-end q-py-md">
    <div class="col-2">
      <q-btn flat :label="tags.cancel" @click="ctrl.editing=false" color="primary"></q-btn>
    </div>
    <div class="col-2">
      <q-btn :label="tags.ok" @click="update" color="primary"></q-btn>
    </div>
  </div>
</div>
<q-banner inline-actions dense class="bg-indigo-3 text-white">
  {{tags.gdn.skuList}}
  <template v-slot:action v-if="ctrl.editable">
    <q-btn icon="add_circle" @click="show_ship" flat dense></q-btn>
  </template>
</q-banner>
<q-list dense separator>
  <q-item v-for="(e,i) in skuList">
   <q-item-section>
    <q-item-label>{{e.no}}</q-item-label>
    <q-item-label caption>{{e.skuName}}</q-item-label>
   </q-item-section>
   <q-item-section>{{e.num}}</q-item-section>
   <q-item-section side v-if="ctrl.editable">
     <q-btn icon="clear" @click="remove_sku(i)" flat dense color="red"></q-btn>
   </q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="skuCtrl.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
   <div class="text-h6">{{tags.gdn.skuList}}</div>
   <q-separator></q-separator>
  </q-card-section>
  <q-card-section class="q-pt-none">
    <q-input v-model="skuCtrl.dta.no" :label="tags.storage.no">
     <template v-slot:after>
      <q-icon name="qr_code_scanner" @click="start_scan" color="primary"></q-icon>
     </template>
    </q-input>
    <q-input v-model.number="skuCtrl.dta.num" :label="tags.num"></q-input>
  </q-card-section>
  <q-card-actions align="right">
    <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    <q-btn :label="tags.ok" color="primary" @click="ship_out"></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" ref="alertDlg"></alert-dialog>
<confirm-dialog :title="tags.attention" :ok="tags.ok"
 :close="tags.cancel" ref="cfmDlg"></confirm-dialog>
`
}