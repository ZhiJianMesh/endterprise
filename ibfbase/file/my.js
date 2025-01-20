import AlertDialog from "/assets/v3/components/alert_dialog.js"
import MonthInput from "/assets/v3/components/month_input.js"

export default {
inject:["ibf"],
components:{
    "alert_dlg":AlertDialog,
    "month-input":MonthInput
},
data() {return {
    tags:this.ibf.tags,
    tab:'salary', //event,salary,res,perf
    events:[],
    res:[],
    perfs:[],
    salaries:[],
    salMonth:"-1m",
    evtPg:{cur:1,max:0},
    resPg:{cur:1,max:0},
    perfPg:{cur:1,max:0}
}},
created(){
    var dt=new Date();
    this.query_salary({num:dt.getFullYear()*12+dt.getMonth()});
    this.query_event(1);
    this.query_res(1);
    this.query_perf(1);
},
methods:{
query_salary(ym) {
    request({method:"GET",url:"/salary/my?month="+ym.num}, this.ibf.SERVICE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.salaries=[];
            return;
        }
        var salTps=this.tags.hr.salType;
        var sponTps=this.tags.hr.sponTp;
        this.salaries=resp.data.list.map(s => {
            var pos=s.type.indexOf('-');
            var type;
            if(pos>0) {
                type=salTps[s.type.substring(0,pos)]
                  + '('+sponTps[s.type.substring(pos+1)]+')';
            } else {
                type=salTps[s.type];
            }
            return {val:s.val.toFixed(2),type:type};
        })
    });    
},
query_event(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/employee/myEvent?offset="+offset+'&num='+this.ibf.N_PAGE;
    request({method:"GET",url:url}, this.ibf.SERVICE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.evtPg.max=0;
            this.evtPg.cur=1;
            this.events=[];
            return;
        }
        var evtTypes=this.tags.hr.eventType;
        //at,type,val,cmt
        var dt=new Date();
        this.events=resp.data.list.map(s => {
            var type=evtTypes[s.type];
            s.type=type?type:s.type;
            dt.setTime(s.at*60000);
            s.at=date2str(dt);
            return s;
        });
        this.evtPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    });    
},
query_res(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/resource/my?offset="+offset+'&num='+this.ibf.N_PAGE;
    request({method:"GET",url:url}, this.ibf.SERVICE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.resPg.max=0;
            this.resPg.cur=1;
            this.res=[];
            return;
        }
        var dt=new Date(); //start,no,cfmAt,skuName
        this.res=resp.data.list.map(r => {
            dt.setTime(r.start*60000);
            r.start=date2str(dt);
            dt.setTime(r.cfmAt*60000);
            r.cfmAt=date2str(dt);
            return r;
        });
        this.resPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    });    
},
query_perf(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/perf/my?offset="+offset+'&num='+this.ibf.N_PAGE;
    request({method:"GET",url:url}, this.ibf.SERVICE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.perfPg.max=0;
            this.perfPg.cur=1;
            this.perfs=[];
            return;
        }
        //month,level,cmt,cfmed
        this.perfs=resp.data.list.map(p => {
            var m=p.month%12+1;
            p.month=parseInt(p.month/12)+'/'+(m<10?'0'+m:m);
            p.state=p.cfmed=='Y'?this.tags.hr.cfmed:this.tags.hr.notCfm;
            return p;
        });
        this.perfPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    });    
},
open_grp(id,type) {
    if(type=='D') {//业务部门
        this.ibf.goto('/ibf/department?id='+id);
    } else { //虚拟组织
        this.ibf.goto('/ibf/grp?id='+id);
    }
}
},
template:`
<q-layout view="HHH lpr FFF" container style="height:99.9vh">
  <q-header>
   <q-toolbar>
     <q-btn flat icon="arrow_back" dense @click="ibf.back()"></q-btn>
     <q-toolbar-title>{{tags.my.title}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-footer>
   <q-tabs v-model="tab" dense align="justify" switch-indicator inline-label
    class="text-grey bg-grey-3" active-color="primary" indicator-color="primary">
    <q-tab name="salary" icon="paid" :label="tags.my.salary"></q-tab>
    <q-tab name="perf" icon="autofps_select" :label="tags.my.perm"></q-tab>
    <q-tab name="res" icon="devices" :label="tags.my.res"></q-tab>
    <q-tab name="event" icon="receipt_long" :label="tags.my.event"></q-tab>
   </q-tabs>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-none">
<q-tab-panels v-model="tab">

<q-tab-panel name="salary">
<month-input class="justify-center text-primary" min="-3" max="cur"
v-model="salMonth" @update:modelValue="query_salary"></month-input>
<q-list separator>
 <q-item v-for="s in salaries">
  <q-item-section>{{s.type}}</q-item-section>
  <q-item-section>{{s.val}}</q-item-section>
 </q-item>
</q-list>
</q-tab-panel>

<q-tab-panel name="perf">
 <q-list separator>
  <q-item v-for="p in perfs">
   <q-item-section>{{p.month}}</q-item-section>
   <q-item-section>{{p.level}}-</q-item-section>
   <q-item-section>{{p.state}}:{{p.cmt}}</q-item-section>
  </q-item>
 </q-list>
 <div class="q-pa-sm flex flex-center" v-show="perfPg.max>1">
  <q-pagination v-model="perfPg.cur" color="primary" :max="perfPg.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_perf"></q-pagination>
 </div>
</q-tab-panel>

<q-tab-panel name="res">
 <q-list separator>
  <q-item v-for="r in res">
   <q-item-section>
    <q-item-label>{{r.no}}</q-item-label>
    <q-item-label caption>{{r.start}}</q-item-label>
   </q-item-section>
   <q-item-section>
    <q-item-label>{{r.skuName}}</q-item-label>
    <q-item-label caption>{{r.cfmAt}}</q-item-label>
   </q-item-section>
  </q-item>
 </q-list>
 <div class="q-pa-sm flex flex-center" v-show="resPg.max>1">
  <q-pagination v-model="resPg.cur" color="primary" :max="resPg.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_res"></q-pagination>
 </div>
</q-tab-panel>

<q-tab-panel name="event">
 <q-list separator>
  <q-item v-for="e in events">
   <q-item-section>{{e.at}}</q-item-section>
   <q-item-section>{{e.type}}</q-item-section>
   <q-item-section>
    <q-item-label v-if="e.val!=0">{{e.val}}</q-item-label>
    <q-item-label>{{e.cmt}}</q-item-label>
   </q-item-section>
  </q-item>
 </q-list>
 <div class="q-pa-sm flex flex-center" v-show="evtPg.max>1">
  <q-pagination v-model="evtPg.cur" color="primary" :max="evtPg.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_event"></q-pagination>
 </div>
</q-tab-panel>

</q-tab-panels>
    </q-page>
  </q-page-container>
</q-layout>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></alert-dialog>
`
}