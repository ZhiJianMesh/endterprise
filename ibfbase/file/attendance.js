import AlertDialog from "/assets/v3/components/alert_dialog.js"
import DatetimeInput from "/assets/v3/components/datetime_input.js"
import {datetimeToStr, datetimeToDate} from '/assets/v3/components/datetime_input.js';
const HOLIDIES=['AFFA','SICK','WEAL','HOLI'];
const OTWS=['WOW','OOW','FOW','OTW'];
const EMPTY_TM={type:'OTW',start:'',end:'',cmt:''};

export default {
inject:["ibf"],
components:{
    "alert-dialog" : AlertDialog,
    "datetime-input":DatetimeInput
},
data() {return {
    tags:this.ibf.tags,
    tab:'atd', //exp(考勤异常),atd(加班请假),wt(worktime工时申报)
    atds:[], //请假或加班申请记录
    excs:[], //考勤异常记录
    atdPg:{max:0,cur:1},
    newTime:{},
    atdAct:{dlg:false,dta:{},tms:[],no:-1,editable:true},
    tmTypes:[]
}},
created(){
    this.query_atds();
    this.tmTypes.push({value:'OTW',label:this.tags.atd.ovt});
    for(var i of ['BUSI','AFFA','SICK','WEAL','HOLI']) {
        this.tmTypes.push({value:i,label:this.tags.atd.aplTmType[i]});
    }
},
methods:{
tab_changed(tab) {
    if(tab=='exp') {
        if(this.excs.length==0) {
            this.query_excs();
        }
    } else if(tab=='wt') {
        if(this.excs.length==0) {
            this.query_excs();
        }
    } else {
        if(this.atds.length==0) {
            this.query_atds(1);
        }
    }
},
query_excs() {
    request({method:"GET", url:"/exception/my"}, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        //day,state,start,end,cfmAcc,descr
        var dt=new Date();
        this.exps=resp.data.list.map(e=>{
            dt.setTime(e.day*86400000);
            e.day_s=date2str(dt);
            dt.setTime(e.start*60000);
            e.start_s=datetime2str(dt);
            dt.setTime(e.end*60000);
            e.end_s=datetime2str(dt);
            return e;
        });
    })
},
query_atds(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/attendance/myApplies?offset="+offset+'&num='+this.ibf.N_PAGE;
    request({method:"GET", url:url}, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.atds=[];
            return;
        }
        var dt=new Date();
        //id,uid,type,state,opinion,at
        this.atds=resp.data.list.map(a=>{
            a.type_s=this.tags.atd.aplType[a.type];
            a.state_s=this.tags.atd.appSta[a.state];
            dt.setTime(a.at);
            a.at=datetime2str(dt,true);
            return a;
        });
        this.atdPg.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    })
},
get_apply_dtl(aid,no) {
    var url="/attendance/getApply?id="+aid;
    request({method:"GET", url:url}, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.atdAct.tms=[];
            this.atdAct.dta={};
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return
        }
        var dt=new Date();
        //type,start,end,cmt
        this.atdAct.tms=resp.data.times.map(a=>{
            a.type_s=this.tags.atd.aplTmType[a.type];
            dt.setTime(a.start*60000);
            a.start_s=datetime2str(dt);
            dt.setTime(a.end*60000);
            a.end_s=datetime2str(dt);
            return a;
        });
        this.atdAct.dta=resp.data;
        this.atdAct.dta.id=aid;
        this.atdAct.editable=this.atdAct.no<0||this.atdAct.dta.state!='OK';
        this.atdAct.no=no;
        this.atdAct.dlg=true;
    });
},
show_add() {
    if(this.tab=='atd') {
        this.show_atd(-1);
    } else {
        this.show_wt(-1);
    }
},
show_atd(no) {
    copyObjTo(EMPTY_TM, this.newTime);
    if(no>-1) {
        this.get_apply_dtl(this.atds[no].id,no);
    } else {
        this.atdAct.no=-1;
        this.atdAct.tms=[];
        this.atdAct.dlg=true;
        this.atdAct.editable=true;
    }
},
add_atd_tm() {
    var tm=copyObj(this.newTime,['type','cmt']);
    var dt=datetimeToDate(this.newTime.start);
    if(tm.type=='OTW') {
        tm.type_s=this.tags.atd.ovt;
    } else {
        tm.type_s=this.tags.atd.aplTmType[tm.type];
    }
    for(var t of this.atdAct.tms) {
        if(t.type==tm.type) {//同一次请求，必须是同类的
            continue;
        }
        if(tm.type=='OTW') {
            if(OTWS.indexOf(t.type)<0) {
                this.$refs.alertDlg.show(this.tags.onlyOneType);
                return;
            }
        } else if(HOLIDIES.indexOf(tm.type)>=0) {
            if(HOLIDIES.indexOf(t.type)<0) {
                this.$refs.alertDlg.show(this.tags.onlyOneType);
                return;
            }
        }
    }
    tm.start=parseInt(dt.getTime()/60000);
    tm.start_s=datetimeToStr(this.newTime.start,this.tags.dateFmt);
    dt=datetimeToDate(this.newTime.end);
    tm.end=parseInt(dt.getTime()/60000);
    tm.end_s=datetimeToStr(this.newTime.end,this.tags.dateFmt);
    if(tm.start>=tm.end) {
        this.$refs.alertDlg.show(this.tags.invalidInterval);
        return;
    }
    this.atdAct.tms.push(tm);
    if(this.hasOverlap(this.atdAct.tms)) {
        this.atdAct.tms.pop();
        this.$refs.alertDlg.show(this.tags.hasOverlap);
    }
},
rmv_atd_tm(i) {
    this.atdAct.tms.splice(i,1);
},
atd_do() { //加班、请假或工作日在途
    if(this.atdAct.tms.length==0) {
        return;
    }
    var tms=[];
    for(var tm of this.atdAct.tms) {
        tms.push(copyObj(tm,['type','cmt','start','end']));
    }
    var dta={times:tms};
    var tp=this.atdAct.tms[0].type;
    
    var url="/attendance/";
    if(OTWS.indexOf(tp)>=0) url+='overtimework';
    else if(tp=='BUSI') url+='onBusiness';
    else url+="leave";
    
    if(this.atdAct.no>-1) { //修改
        dta.id=this.atdAct.dta.id;
    }
    request({method:"POST", url:url, data:dta}, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.atdAct.dlg=false;
        this.atdAct.no=-1;
        this.query_atds(this.atdPg.cur);
    });
},
remove_atd() {
    if(this.atdAct.no<0) return;
    var opts={method:"DELETE",url:"/attendance/cancel?id="+this.atdAct.dta.id};
    request(opts, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.atdAct.dlg=false;
        this.atdAct.no=-1;
        this.query_atds(this.atdPg.cur);
    });
},
hasOverlap(intervals) {
    intervals.sort((a,b) => a.start-b.start);
    for(let i=0; i<intervals.length-1; i++) {
        if(intervals[i].end>intervals[i+1].start) {
            return true;
        }
    }
    return false;
},
show_wt(no) {
    
}
},
template:`
<q-layout view="HHH lpr FFF" container style="height:99.9vh">
  <q-header>
   <q-toolbar>
     <q-btn flat icon="arrow_back" dense @click="ibf.back()"></q-btn>
     <q-toolbar-title>{{tags.atd.title}}</q-toolbar-title>
     <q-btn flat icon="add_circle" dense @click="show_add()" v-show="tab!='exp'"></q-btn>
   </q-toolbar>
  </q-header>
  <q-footer>
   <q-tabs v-model="tab" @update:model-value="tab_changed"
   dense align="justify" switch-indicator inline-label
   class="text-grey bg-grey-3" active-color="primary" indicator-color="primary">
    <q-tab name="atd" icon="pending_actions" :label="tags.atd.ovOrLv"></q-tab>
    <q-tab name="wt" icon="work_history" :label="tags.atd.worktime"></q-tab>
    <q-tab name="exp" icon="running_with_errors" :label="tags.atd.clockExp"></q-tab>
   </q-tabs>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-none">
<q-tab-panels v-model="tab" class="q-pa-none q-ma-none">
<q-tab-panel name="atd">
<q-list>
  <q-item v-for="(a,i) in atds" clickable @click="show_atd(i)">
    <q-item-section side>{{a.type_s}}</q-item-section>
    <q-item-section>{{a.state_s}}</q-item-section>
    <q-item-section>{{a.opinion}}</q-item-section>
    <q-item-section side>{{a.at}}</q-item-section>
  </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-show="atdPg.max>1">
 <q-pagination v-model="atdPg.cur" color="primary" :max="atdPg.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_atds"></q-pagination>
</div>
</q-tab-panel>

<q-tab-panel name="wt" class="q-pa-none q-ma-none">
<q-list dense>
  <q-item v-for="e in exps">
   <q-item-section side>
    <q-item-label>{{e.day_s}}</q-item-label>
    <q-item-label>{{e.start_s}}-{{e.end_s}}</q-item-label>
   </q-item-section>
   <q-item-section side>
    <q-item-label>{{e.descr}}</q-item-label>
    <q-item-label>{{e.cfmAcc}}</q-item-label>
   </q-item-section>
  </q-item>
</q-list>
</q-tab-panel>
</q-tab-panels>
    </q-page>
  </q-page-container>
</q-layout>

<q-tab-panel name="exp" class="q-pa-none q-ma-none">
<q-list dense>
  <q-item v-for="e in exps">
   <q-item-section side>
    <q-item-label>{{e.day_s}}</q-item-label>
    <q-item-label>{{e.start_s}}-{{e.end_s}}</q-item-label>
   </q-item-section>
   <q-item-section side>
    <q-item-label>{{e.descr}}</q-item-label>
    <q-item-label>{{e.cfmAcc}}</q-item-label>
   </q-item-section>
  </q-item>
</q-list>
</q-tab-panel>
</q-tab-panels>
    </q-page>
  </q-page-container>
</q-layout>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="alertDlg"></alert-dialog>

<q-dialog v-model="atdAct.dlg" persistent no-shake>
 <q-card style="min-width:70vw">
  <q-card-section>
   <div class="text-h6">{{tags.apply}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-list>
    <q-item clickable v-for="(t,i) in atdAct.tms">
     <q-item-section>
      <q-item-label>{{t.type_s}}
       <q-icon color="red" name="clear" @click="rmv_atd_tm(i)" class="q-pl-lg"><q-icon>
      </q-item-label>
      <q-item-label caption>{{t.start_s}}</q-item-label>
      <q-item-label caption>{{t.end_s}}</q-item-label>
     </q-item-section>
     <q-item-section side>{{t.cmt}}<q-item-section>
    </q-item>
   </q-list>
   <div class="row">
    <div class="col self-center"><q-separator></q-separator></div>
    <div class="col-1 text-right">
     <q-icon name="add_circle" color="orange" size="1.5em" @click="add_atd_tm"></q-icon>
    </div>
   </div>
   <div class="row">
    <div class="col">
     <datetime-input v-model="newTime.start" :label="tags.start"
      :format="tags.dateFmt" :showMinute="false"></datetime-input>
    </div>
    <div class="col-2 self-center text-center">
     <q-icon name="arrow_right_alt" size="2em"></q-icon>
    </div>
    <div class="col">
     <datetime-input v-model="newTime.end" :label="tags.end"
     :format="tags.dateFmt" :showMinute="false"></datetime-input>
    </div>
   </div>
   <div class="row">
    <div class="col-3 self-end q-pr-md">
     <q-select v-model="newTime.type" :options="tmTypes"
      dense map-options emit-value dense></q-select>
    </div>
    <div class="col">
     <q-input v-model="newTime.cmt" :label="tags.cmt"></q-input>
    </div>
   </div>
  </q-card-section>
  <q-card-actions align="right">
    <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    <q-btn flat :label="tags.remove" color="red" @click="remove_atd"
    v-if="atdAct.no>-1&&atdAct.dta.state!='OK'"></q-btn>
    <q-btn :label="tags.ok" color="primary" @click="atd_do"></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>
`
}