import AlertDialog from "/assets/v3/components/alert_dialog.js"
import Language from "./language.js"
import Grp from "./grp.js"
import My from "./my.js"
import Project from "./project.js"
import Business from "./business.js"
import Leave from "./leave.js"
import Overtime from "./overtime.js"

const SERVIVE_HR="ihr";
const SERVICE_PRJ="iproject"
const l=Platform.language();
const tags = l.indexOf("zh") == 0 ? Language.cn : Language.en;
function registerIbf(app, router) { //注册ibfhome所需的路由
    router.addRoute({path:"/ibf/grp", component:Grp});
    router.addRoute({path:"/ibf/my", component:My});
    router.addRoute({path:"/ibf/overtime", component:Overtime});
    router.addRoute({path:"/ibf/project", component:Project});
    router.addRoute({path:"/ibf/business", component:Business});
    router.addRoute({path:"/ibf/leave", component:Leave});

    app.provide('ibf', {//不能独立一个const/var写在外面，未知原因
        tags:tags,
        prjs:[],
        grps:[],
        ctrl:{cur:1,max:0},
        clockTm:{start:'00:00', end:'00:00'},
        SERVIVE_HR:SERVIVE_HR,
        SERVICE_CRM:"icrm",
        SERVICE_FINANCE:"ifinance",
        SERVICE_BUSINESS:"ibusiness",
        SERVICE_PRJ:SERVICE_PRJ,
        SERVICE_RES:"iresource",
        N_PAGE:10,
        N_SMPG:5,
        PrjStage:{init:'INIT',start:'START',end:'END',cancel:'CANC'},
        PlanState:{init:'INIT',norm:'NORM',adv:'ADVA',delay:'DELA',cancel:'CANC'},
        back:()=>{router.back()},
        goto:(url)=>{router.push(url)}
    })
    return new Promise((resolve) => {resolve(true)});
}
export { registerIbf };

export default {
inject:['ibf'],
components: {
    "alert-dialog" : AlertDialog
},
data() {return {
    tags:tags,
    grps:[],
    prjs:[],
    clockTm:{start:'00:00', end:'00:00'},
    ctrl:{cur:1, max:0}
}},
created(){
    if(this.ibf.grps.length==0) {
        this.query_grps();
    } else { //避免每次退回首页时都查询一次
        this.grps=this.ibf.grps;
    }
    if(this.ibf.prjs.length==0) {
        this.query_prjs(1);
    } else {
        this.prjs=this.ibf.prjs;
        this.ctrl=this.ibf.ctrl;
    }
    if(this.ibf.clockTm.start=='00:00') {
        request({method:"GET",url:"/attendance/clockAt"}, SERVIVE_HR).then(resp=>{
            if(resp.code!=RetCode.OK) {
                Console.debug("Fail to get my clock time:" + resp.code + ",info:" + resp.info);
                return;
            }
            this.set_clockTm(resp.data.start, resp.data.end);
        });
    } else {
        this.clockTm=this.ibf.clockTm;
    }
},
methods:{
query_grps() {
    request({method:"GET",url:"/grp/mygrp"}, SERVIVE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            Console.debug("Fail to get mygrp:" + resp.code + ",info:" + resp.info);
            return;
        }
        var dta=resp.data;
        var role=this.tags.grp.role[dta.role];
        var grps=[{id:dta.id,type:dta.type,name:dta.name,path:dta.path,roleName:role,role:dta.role,title:dta.title}];
        for(var l of dta.virtuals) {
            role=this.tags.grp.role[l.role];
            grps.push({id:l.id,type:l.type,name:l.name,path:l.path,roleName:role,role:l.role,title:l.title})
        }
        this.ibf.grps=grps;
        this.grps=grps;
    });    
},
query_prjs(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_SMPG;
    var url='/project/my?offset='+offset+'&num='+this.ibf.N_SMPG;
    request({method:"GET", url:url}, SERVICE_PRJ).then(resp=>{
        var prjs=[];
        if(resp.code!=RetCode.OK) {
            this.ctrl.max=0;
            this.ctrl.cur=1;
        } else {
            var tm,stage;
            var dt=new Date();
            for(var l of resp.data.list) {
                dt.setTime(l.start*60000);
                tm=date2str(dt);
                dt.setTime(l.end*60000);
                tm+='--'+date2str(dt);
                l.time=tm;
                stage=this.tags.prj.stageCfg[l.stage];
                if(stage) {
                    l.stage=stage;
                }
                l.role=this.tags.prj.roleCfg[l.role];
                prjs.push(l);
            }
            this.ibf.prjNum=resp.data.total;
            this.ctrl.max=Math.ceil(resp.data.total/this.ibf.N_SMPG);
        }
        this.ibf.prjs=prjs;
        this.ibf.ctrl=this.ctrl;
        this.prjs=prjs;
    });
},
set_clockTm(start, end) {
    var dt=new Date();
    var clkTm={start:'00:00',end:'00:00'};
    if(start>0) {
        dt.setTime(start*60000);
        clkTm.start=dt.getHours().toString().padStart(2,'0')
         + ":" + dt.getMinutes().toString().padStart(2,'0');
    }
    if(end>0) {
        dt.setTime(end*60000);
        clkTm.end=dt.getHours().toString().padStart(2,'0')
         + ":" + dt.getMinutes().toString().padStart(2,'0');
    }
    this.clockTm=clkTm;
    this.ibf.clockTm=clkTm;
},
clock() { //上下班刷卡
    request({method:"GET",url:"/attendance/clock"}, SERVIVE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.set_clockTm(resp.data.start, resp.data.end);
    })
}
},

template:`
<div class="row">
 <div class="col self-center">
  <q-btn color="deep-orange" no-caps @click="clock" style="min-width:30vw">
  <div class="row items-center no-wrap">
   <q-icon left name="event_available"></q-icon>
   <div class="text-center">
     <span class="text-h5">{{tags.home.attendance}}</span>
     <br>{{clockTm.start}}-{{clockTm.end}}
   </div>
  </div>
  </q-btn>
 </div>
 <div class="col text-center">
  <q-list dense>
   <q-item dense>
    <q-item-section>
     <q-btn flat color="primary" :label="tags.ovt.title" @click="ibf.goto('/ibf/overtime')"></q-btn>
    </q-item-section>
    <q-item-section>
     <q-btn flat dense color="primary" :label="tags.lev.title" @click="ibf.goto('/ibf/leave')"></q-btn>
    </q-item-section>
   </q-item>
   <q-item dense>
    <q-item-section>
     <q-btn flat dense color="primary" :label="tags.busi.title" @click="ibf.goto('/ibf/business')"></q-btn>
    </q-item-section>
    <q-item-section>
     <q-btn flat dense color="primary" :label="tags.my.title" @click="ibf.goto('/ibf/my')"></q-btn>
    </q-item-section>
   </q-item>
  </q-list>
 </div>
</div>
<q-separator spaced="md" color="teal"></q-separator>
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
<q-separator spaced="md" color="teal"></q-separator>
<q-list dense separator>
  <q-item v-for="p in prjs" @click="ibf.goto('/ibf/project?id='+p.id)" clickable>
   <q-item-section>
    <q-item-label>{{p.name}}</q-item-label>
    <q-item-label caption>{{p.role}}</q-item-label>
   </q-item-section>
   <q-item-section>
    <q-item-label>{{p.stage}}</q-item-label>
    <q-item-label caption>{{p.time}}</q-item-label>
   </q-item-section>
  </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-show="ctrl.max>1">
 <q-pagination v-model="ctrl.cur" color="primary" :max="ctrl.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_prjs"></q-pagination>
</div>
<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></alert-dialog>
`
}