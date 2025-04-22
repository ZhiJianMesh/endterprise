export default {
inject:['service', 'tags'],
data() {return {
    //回款确认申请
    list:{},
    state:'',
    ctrl:{cur:1,max:0,dlg:false,opts:[]},
    dtl:{}
}},
created(){
    var opts=[{value:'',label:this.tags.unSet}];//状态选择项
    for(var s in this.tags.income.state) {
        opts.push({value:s,label:this.tags.income.state[s]});
    }
    this.ctrl.opts=opts;
    this.query(1);
},
methods:{
query(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var url="/income/list?offset="+offset+"&num="+this.service.N_PAGE+"&state="+this.state;
    return request({method:"GET", url:url}, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.list=[];
            return;
        }
        //id,pid,applyAt,maybeAt,
        //state,val,cmt,prjName,submitter
        var cols=resp.data.cols;
        var list=[];
        var income;
        var dt=new Date();
        for(var l of resp.data.list) {
            income={};
            for(var i in cols) {
                income[cols[i]]=l[i];
            }
            list.push(this.fmt(income,dt));
        }
        this.list=list;
    })
},
fmt(dta,dt) {
    dt.setTime(dta.maybeAt*60000);
    dta.maybeAt=datetime2str(dt);
    dt.setTime(dta.applyAt*60000);
    dta.applyAt=datetime2str(dt);
    dta.state_s=this.tags.income.state[dta.state];
    dta.mode=this.tags.payMode[dta.mode];
    return dta;
},
show_dtl(id) {
    var url="/income/get?id="+id;
    return request({method:"GET", url:url}, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        //pid,applyAt,maybeAt,payAt,bank,sid,
        //state,val,cmt,prjName,submitter,cfmAcc
        var dt=new Date();
        if(resp.data.payAt&&resp.data.payAt>0) {
            dt.setTime(resp.data.payAt*60000);
            resp.data.payAt=datetime2str(dt);
        } else {
            resp.data.payAt=this.tags.notCfm;
        }
        resp.data.id=id;
        this.dtl=this.fmt(resp.data, dt);
        this.ctrl.dlg=true;
    })    
},
confirm(){
    var payAt=parseInt(new Date(this.dtl.payAt).getTime()/60000);
    var dta={id:this.dtl.id,payAt:payAt,sn:this.dtl.sn};
    return request({method:"PUT", url:"/income/confirm", data:dta}, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.dlg=false;
        this.query(this.ctrl.cur);
    })  
}
},
template:`
<q-layout view="hHh lpr fFf" container style="height:99.9vh">
  <q-header>
   <q-toolbar>
     <q-btn flat icon="arrow_back" dense @click="service.back()"></q-btn>
     <q-toolbar-title>{{tags.income.title}}</q-toolbar-title>
     <q-btn flat round dense icon="menu"><q-menu>
      <q-option-group v-model="state" :options="ctrl.opts" type="radio"
       @update:model-value="query(ctrl.cur)" style="min-width:10em;"></q-option-group>
     </q-menu></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list separator>
  <q-item v-for="l in list" clickable @click="show_dtl(l.id)">
    <q-item-section>
     <q-item-label>{{l.prjName}}</q-item-label>
     <q-item-label caption>{{l.submitter}}</q-item-label>
     <q-item-label caption>{{l.applyAt}}</q-item-label>
    </q-item-section>
    <q-item-section>{{l.cmt}}</q-item-section>
    <q-item-section>
     <q-item-label>{{l.mode}}/{{l.val}}</q-item-label>
     <q-item-label caption>{{l.bank}}</q-item-label>
     <q-item-label caption>{{l.maybeAt}}</q-item-label>
    </q-item-section>
    <q-item-section side :class="l.state=='OVER'?'text-grey':'text-primary'">
     {{l.state_s}}
    </q-item-section>
  </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-show="ctrl.max>1">
 <q-pagination v-model="ctrl.cur" color="primary" :max="ctrl.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query"></q-pagination>
</div>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="ctrl.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
   <div class="text-h6">{{dtl.prjName}}({{dtl.state_s}})</div>
  </q-card-section>
  <q-card-section class="q-pt-sm">
   <q-list separator dense>
    <q-item>
     <q-item-section>{{tags.submitter}}</q-item-section>
     <q-item-section side>{{dtl.submitter}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.applyAt}}</q-item-section>
     <q-item-section side>{{dtl.applyAt}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.income.maybeAt}}</q-item-section>
     <q-item-section side>{{dtl.maybeAt}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.income.mode}}</q-item-section>
     <q-item-section side>{{dtl.mode}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.income.bank}}</q-item-section>
     <q-item-section side>{{dtl.bank}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.income.val}}</q-item-section>
     <q-item-section side>{{dtl.val}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.cmt}}</q-item-section>
     <q-item-section side>{{dtl.cmt}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.income.cfmAcc}}</q-item-section>
     <q-item-section side>{{dtl.cfmAcc}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.income.sn}}</q-item-section>
     <q-item-section>
      <q-input v-model="dtl.sn" :disable="dtl.state=='OVER'"></q-input>
     </q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.payAt}}</q-item-section>
     <q-item-section>
      <date-input :close="tags.ok" v-model="dtl.payAt" :disable="dtl.state=='OVER'"></date-input>
     </q-item-section>
    </q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
    <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    <q-btn :label="tags.ok" color="primary" @click="confirm" v-if="dtl.state=='WAIT'"></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" ref="alertDlg"></alert-dialog>
`
}