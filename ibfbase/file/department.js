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
    tab:'exps',
    gid:0,
    gname:'',
    exps:[], //考勤异常列表申请
    perfs:[], //绩效查询
    applies:[], //加班请假申请
    business:[], //差旅申请
    levels:[], //绩效等级
    grpOpts:[],
    month:{v:0,cur:0,e:false/*绩效中是否有可修改的行*/},
    perfDlg:{obj:{},no:-2,show:false},//待编辑绩效
    expPg:{max:0,cur:1},
    perfPg:{max:0,cur:1},
    appPg:{max:0,cur:1}
}},
created(){
    var dt=new Date();
    var cur=dt.getFullYear()*12+dt.getMonth();
    this.month={v:cur, cur:cur,e:false};

    var opts={method:"GET",url:"/config/listPerfLevel"};
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code==RetCode.OK) {
            this.levels=resp.data.list;
        }
    });
    if(this.ibf.adminDpms.length>0){
        this.gid=this.ibf.adminDpms[0].id;
        this.gname=this.ibf.adminDpms[0].name;
        this.query_exps(1);
        for(var dp of this.ibf.adminDpms) {
            this.grpOpts.push({value:dp.id,label:dp.path});
        }
    }
},
methods:{
tab_changed(tab) {
    if(tab=='exps') {
        if(this.exps.length==0) {
            this.query_exps(this.expPg.cur);
        }
    } else if(tab=='applies') {
        if(this.applies.length==0) {
            this.query_applies(this.mbrPg.cur);
        }
    } else {
        if(this.perfs.length==0) {
            this.query_perfs(this.perfPg.cur);
        }
    }
},
query_applies(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/attendance/waitApplies?offset="+offset+'&num='+this.ibf.N_PAGE+"&gid="+this.gid;
    request({method:"GET", url:url}, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        //id,uid,account,at
        var dt=new Date();
        this.applies=resp.data.list.map(a=>{
            dt.setTime(a.at);
            a.at=date2str(dt);
            return a;
        });
        this.appPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    })
},
query_exps(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var opts={method:"GET", url:"/exception/waitforme?offset="+offset+'&num='+this.ibf.N_PAGE+"&gid="+this.gid}
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        this.exps=resp.data.list.map(e=>{
            dt.setTime(e.day*86400000);
            e.day_s=date2str(dt);
            dt.setTime(e.start*60000);
            e.start_s=dt.getHours() + ':' + dt.getMinutes();
            dt.setTime(e.end*60000);
            e.end_s=dt.getHours() + ':' + dt.getMinutes();
            return e;
        });
        this.expPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    })
},
query_perfs(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/perf/list?offset="+offset+'&num='+this.ibf.N_PAGE+"&gid="+this.gid+"&month="+this.month.v;
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
        this.perfPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    })
},
cfm_perf() {
    var opts={method:"PUT",url:"/api/perf/confirm", data:{gid:this.gid,month:this.month.v}};
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.query_perfs(this.perfPg.cur);
    });
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
},
set_month(ym) {
    this.month.v=ym.num;
    this.query_perfs(this.perfPg.cur);
},
init_perf() {
    var opts={method:"POST",url:"/api/perf/init", data:{gid:this.gid,month:this.month.v}};
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        this.query_perfs(this.perfPg.cur);
    });
},
clear_perf() {
    var opts={method:"DELETE",url:"/api/perf/clear?gid="+this.gid+"&month="+this.month.v};
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.query_perfs(this.perfPg.cur);
    });
},
show_perf(i) {
    copyObjTo(this.perfs[i], this.perfDlg.obj);
    this.perfDlg.show=true;
    this.perfDlg.no=i;
},
save_perf() {
    var dta=copyObj(this.perfDlg.obj,['uid','level','cmt','month']);
    dta.month=this.month.v;
    var opts={method:"PUT",url:"/api/perf/set", data:dta};
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
        }
        copyObjTo(this.perfDlg.obj, this.perfs[this.perfDlg.no]);
        this.perfDlg.show=false;
        this.perfDlg.no=-2;
    });
},
change_grp(v){
    for(var dp of this.ibf.adminDpms) {
        if(v==dp.id) {
            this.gid=dp.id;
            this.gname=dp.name;
            break;
        }
    }
    this.exps=[];
    this.applies=[];
    this.perfs=[];
    this.tab_changed(this.tab);
    this.$refs.grpSelect.hide();
}
},
template:`
<q-layout view="hhh lpr fff" container style="height:99.9vh">
  <q-header>
   <q-toolbar>
     <q-btn flat icon="arrow_back" dense @click="ibf.back()"></q-btn>
     <q-toolbar-title>{{tags.grp.department}}-{{gname}}</q-toolbar-title>
     <q-btn flat icon="group" dense>
      <q-popup-proxy class="q-pa-md" ref="grpSelect">
       <q-option-group :options="grpOpts" type="radio" v-model="gid"
        @update:model-value="change_grp"></q-option-group>
      </q-popup-proxy>
     </q-btn>
   </q-toolbar>
  </q-header>
  <q-footer>
   <q-tabs v-model="tab" @update:model-value="tab_changed"
   dense align="justify" switch-indicator inline-label
    class="text-grey bg-grey-3" active-color="primary" indicator-color="primary">
    <q-tab name="exps" icon="running_with_errors" :label="tags.grp.clockExp"></q-tab>
    <q-tab name="attendance" icon="work_history" :label="tags.grp.ovOrLv"></q-tab>
    <q-tab name="perfs" icon="abc" :label="tags.grp.perf"></q-tab>
   </q-tabs>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-none">
<q-tab-panels v-model="tab" class="q-pa-none q-ma-none">
<q-tab-panel name="ovOrLv">
<q-list>
  <q-item v-for="a in applies">
    <q-item-section>{{a.account}}</q-item-section>
    <q-item-section>{{a.at}}</q-item-section>
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

<q-tab-panel name="perfs" class="q-pa-none q-ma-none">
<div class="row justify-start bg-grey-3 text-primary">
  <div class="col-5 self-center">
   <month-input class="text-subtitle1 q-pl-sm"
    @update:modelValue="set_month" min="3" max="cur"></month-input>
  </div>
  <div class="col self-center">
   <q-btn @click="init_perf" flat :label="tags.init"></q-btn>
  </div>
  <div class="col self-center" v-if="month.e">
    <q-btn @click="clear_perf" flat :label="tags.clear"></q-btn>
  </div>
  <div class="col self-center q-pr-sm" v-if="month.e">
   <q-btn @click="cfm_perf" flat :label="tags.submit"></q-btn>
  </div>
</div>
<div class="q-pa-sm flex flex-center" v-show="perfPg.max>1">
 <q-pagination v-model="perfPg.cur" color="primary" :max="perfPg.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_perfs"></q-pagination>
</div>
<q-list>
  <q-item v-for="(p,i) in perfs" :clickable="p.cfmed=='N'" @click="show_perf(i)">
   <q-item-section>{{p.account}}/{{p.name}}</q-item-section>
   <q-item-section :class="p.cfmed=='N'?'text-deep-orange':''" >
    {{p.level}}
   </q-item-section>
   <q-item-section>{{p.cmt}}</q-item-section>
  </q-item>
</q-list>
</q-tab-panel>
</q-tab-panels>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="perfDlg.show">
 <q-card style="min-width:70vw">
  <q-card-section>
      <div class="text-h6">{{perfDlg.account}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-radio v-model="perfDlg.obj.level"
    v-for="l in levels" :val="l.level" :label="l.name"></q-radio>
   <q-input color="accent" v-model="perfDlg.obj.cmt" type="textarea" rows="2"
    dense autofocus></q-input>
  </q-card-section>
  <q-card-actions align="right">
  <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
     <q-btn :label="tags.ok" color="primary" @click="save_perf"></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></alert-dialog>
`
}