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
    tab:'grp', //grp,event,salary,res,perf
    grps:[],
    events:[],
    res:[],
    perfs:[],
    salaries:[],
    evtPg:{cur:1,max:0},
    resPg:{cur:1,max:0},
    perfPg:{cur:1,max:0}
}},
created(){
    var dt=new Date();
    this.query_grp();
    this.query_salary({year:dt.getFullYear(),month:dt.getMonth()+1});
    this.query_event(1);
    this.query_res(1);
    this.query_perf(1);
},
methods:{
query_grp() {
    request({method:"GET",url:"/grp/mygrp"}, this.ibf.SERVIVE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            Console.debug("Fail to get mygrp:" + resp.code + ",info:" + resp.info);
            return;
        }
        var dta=resp.data;
        var role=this.tags.grp.role[dta.role];
        //第一个是实体部门，其他是虚拟组织
        var grps=[{id:dta.id,type:dta.type,name:dta.name,path:dta.path,roleName:role,role:dta.role,title:dta.title}];
        for(var l of dta.virtuals) {
            role=this.tags.grp.role[l.role];
            grps.push({id:l.id,type:l.type,name:l.name,path:l.path,roleName:role,role:l.role,title:l.title})
        }
        this.grps=grps;
    })
},
query_salary(ym) {
    var mon=ym.year*12+ym.month-1;
    request({method:"GET",url:"/salary/my?month="+mon}, this.ibf.SERVIVE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var salTps=this.tags.hr.salType;
        this.salaries=resp.data.list.map(s => {
            var type=salTps[s.type];
            type=type?type:s.type;
            return {val:s.val,type:type};
        });
    });    
},
query_event(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/employee/myEvent?offset="+offset+'&num='+this.ibf.N_PAGE;
    request({method:"GET",url:url}, this.ibf.SERVIVE_HR).then(resp=>{
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
    request({method:"GET",url:url}, this.ibf.SERVIVE_HR).then(resp=>{
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
    request({method:"GET",url:url}, this.ibf.SERVIVE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.perfPg.max=0;
            this.perfPg.cur=1;
            this.perfs=[];
            return;
        }
        //month,level,cmt,cfmed
        this.perfs=resp.data.list.map(p => {
            var m=p.month;
            p.month=Math.floor(m/12)+'/'+(1+m%12);
            p.state=p.cfmed=='Y'?this.tags.hr.cfmed:this.tags.hr.notCfm;
            return p;
        });
        this.perfPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    });    
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
    <q-tab name="grp" icon="account_tree" :label="tags.my.grp"></q-tab>
    <q-tab name="salary" icon="paid" :label="tags.my.salary"></q-tab>
    <q-tab name="perf" icon="autofps_select" :label="tags.my.perm"></q-tab>
    <q-tab name="res" icon="devices" :label="tags.my.res"></q-tab>
    <q-tab name="event" icon="receipt_long" :label="tags.my.event"></q-tab>
   </q-tabs>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-sm">
<q-tab-panels v-model="tab">

<q-tab-panel name="grp">
<q-list dense separator>
  <q-item v-for="g in grps" @click="ibf.goto('/ibf/grp?id='+g.id)" clickable>
   <q-item-section>
    <q-item-label>{{g.name}}</q-item-label>
    <q-item-label caption>{{g.roleName}}</q-item-label>
   </q-item-section>
   <q-item-section></q-item-section>
   <q-item-section side>
    <q-item-label>{{g.title}}</q-item-label>
    <q-item-label caption>{{g.path}}</q-item-label>
   </q-item-section>
  </q-item>
</q-list>
</q-tab-panel>

<q-tab-panel name="salary">
<month-input class="justify-center text-primary" min="-5" max="cur"
@update:modelValue="query_salary"></month-input>
<q-list dense separator>
 <q-item v-for="s in salaries"">
  <q-item-section>{{s.type}}</q-item-section>
  <q-item-section>{{s.val}}</q-item-section>
 </q-item>
</q-list>
</q-tab-panel>

<q-tab-panel name="perf">
 <q-list dense separator>
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
 <q-list dense separator>
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
 <q-list dense separator>
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