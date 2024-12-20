import AlertDialog from "/assets/v3/components/alert_dialog.js"
import MonthInput from "/assets/v3/components/month_input.js"

export default {
inject:["ibf"],
components:{
    "alert-dialog" : AlertDialog,
    "month-input":MonthInput
},
data() {return {
    tags:this.ibf.tags,
    tab:'members',
    recs:[], //考勤记录
    excs:[], //考勤异常记录
    recPg:{max:0,cur:1}
}},
created(){
    this.query_exps();
    this.query_recs(1);
},
methods:{
query_exps() {
    request({method:"GET", url:"/exception/my"}, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        //day,state,start,end,descr
        var dt=new Date();
        this.exps=resp.data.list.map(e=>{
            dt.setTime(e.day*86400000);
            var dts=dt.toLocaleDateString();
            dt.setTime(e.start*60000);
            var start=dt.getHours() + ':' + dt.getMinutes();
            dt.setTime(e.end*60000);
            var end=dt.getHours() + ':' + dt.getMinutes();
            return {uid:e.uid,account:e.account,day:e.day,date:dts,start:start,end:end}
        });
    })
},
query_recs(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/perf/list?offset="+offset+'&num='+this.ibf.N_PAGE+"&gid="+this.grp.id+"&month="+this.month.v;
    request({method:"GET", url:url}, this.ibf.SERVICE_HR).then(resp => {
        this.month.e=false;
        if(resp.code!=RetCode.OK) {
            this.perfs=[];
            return;
        }
        var mbrs=resp.data.members;
        this.perfs=resp.data.list.map(p=>{
            var l=p.level==''?this.levels[0].level:p.level;
            if(p.cfmed=='N') this.month.e=true;
            var cmt=p.cmt==''?this.tags.grp.perfCmt:p.cmt;
            var mbr=mbrs[p.uid];
            return {uid:p.uid,level:l,account:mbr[0],
                name:mbr[1],cmt:cmt,cfmed:p.cfmed};
        });
        this.recPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    })
},
cfm_exp(uid,day) {
    var opts={method:"PUT",url:"/api/exception/confirm", data:{uid:uid,day:day}};
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.query_exps();
    }); 
},
rej_exp(uid,day) {
    var opts={method:"PUT",url:"/api/exception/reject", data:{uid:uid,day:day}};
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.query_exps();
    }); 
}
},
template:`
<q-layout view="hhh lpr fff" container style="height:99.9vh">
  <q-header>
   <q-toolbar>
     <q-btn flat icon="arrow_back" dense @click="ibf.back()"></q-btn>
     <q-toolbar-title>{{tags.atd.title}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-footer>
   <q-tabs v-model="tab" @update:model-value="tab_changed"
   dense align="justify" switch-indicator inline-label
    class="text-grey bg-grey-3" active-color="primary" indicator-color="primary">
    <q-tab name="ovt" icon="work_history" :label="tags.atd.ovt"></q-tab>
    <q-tab name="leave" icon="local_cafe" :label="tags.atd.leave"></q-tab>
    <q-tab name="busi" icon="flight_takeoff" :label="tags.atd.busi"></q-tab>
    <q-tab name="exps" icon="running_with_errors" :label="tags.atd.clockExp"></q-tab>
   </q-tabs>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-none">
<q-tab-panels v-model="tab" class="q-pa-none q-ma-none">
<q-tab-panel name="rec">
<q-list>
  <q-item v-for="m in members">
    <q-item-section>{{m.account}}/{{m.name}}</q-item-section>
    <q-item-section>{{m.title}}</q-item-section>
    <q-item-section>{{m.role}}</q-item-section>
  </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-show="mbrPg.max>1">
 <q-pagination v-model="mbrPg.cur" color="primary" :max="mbrPg.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_members"></q-pagination>
</div>
</q-tab-panel>

<q-tab-panel name="exps" class="q-pa-none q-ma-none">
<q-list dense>
  <q-item v-for="e in exps">
   <q-item-section>{{e.account}}</q-item-section>
   <q-item-section>{{e.date}}</q-item-section>
   <q-item-section>{{e.start}}-{{e.end}}</q-item-section>
   <q-item-section side class="q-gutter-sm text-primary">
    <q-btn @click="cfm_exp(e.uid,e.day)" :label="tags.confirm" flat></q-btn>
    <q-btn @click="rej_exp(e.uid,e.day)" :label="tags.reject"></q-btn>
   </q-item-section>
  </q-item>
</q-list>
</q-tab-panel>
</q-tab-panels>
    </q-page>
  </q-page-container>
</q-layout>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></alert-dialog>
`
}