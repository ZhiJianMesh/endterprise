import AlertDialog from "/assets/v3/components/alert_dialog.js"
import Language from "./language.js"
import Department from "./department.js"
import My from "./my.js"
import Contacts from "./contacts.js"
import Project from "./project.js"
import Attendance from "./attendance.js"

const SERVICE_HR="ihr";
const SERVICE_PRJ="iproject";
const l=Platform.language();
const tags = l.indexOf("zh") == 0 ? Language.cn : Language.en;
function registerIbf(app, router) { //注册ibf所需的路由
    router.addRoute({path:"/ibf/department", component:Department});
    router.addRoute({path:"/ibf/my", component:My});
    router.addRoute({path:"/ibf/contacts", component:Contacts});
    router.addRoute({path:"/ibf/project", component:Project}); //项目
    router.addRoute({path:"/ibf/attendance", component:Attendance}); //考勤

    app.provide('ibf', {//如果定义一个const/var写在外面，再在此引用，路由会失败，原因未知
        tags:tags,
        prjs:[],
        department:{}, //所属部门，作为普通员工，只能从属于一个部门
        adminDpms:[], //管理的部门
        ctrl:{cur:1,max:0},
        clockTm:{start:'00:00', end:'00:00'},
        SERVICE_HR:SERVICE_HR,
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
    ctrl:{cur:1, max:0},
    prjs:[],//vue无法与inject的变量双向绑定，所以另外加以下三个字段
    isAdmin:false,
    clockTm:{start:'00:00', end:'00:00'}
}},
created(){
    if(this.ibf.prjs.length==0) {
        this.query_prjs(1);
    } else {
        this.prjs=this.ibf.prjs;
        this.ctrl=this.ibf.ctrl;
    }
    if(this.ibf.clockTm.start=='00:00') {
        request({method:"GET",url:"/attendance/clockAt"}, SERVICE_HR).then(resp=>{
            if(resp.code!=RetCode.OK) {
                Console.debug("Fail to get my clock time:" + resp.code + ",info:" + resp.info);
                return;
            }
            this.set_clockTm(resp.data.start, resp.data.end);
        });
    } else {
        this.clockTm=this.ibf.clockTm;
    }
    if(!this.ibf.department.role&&this.ibf.adminDpms.length==0) {
        var opts={method:"GET",url:"/grp/myDepartment"};
        request(opts, this.ibf.SERVICE_HR).then(resp => {
            var adms=[];
            var dep={};
            if(resp.code==RetCode.OK) {
                for(var d of resp.data.list) {
                    if(d.role=='ADM') {
                        d.adm=true;
                        adms.push(d);
                    } else {
                        dep=d;
                    }
                }
            }
            this.isAdmin=adms.length>0;
            this.ibf.department=dep;
            this.ibf.adminDpms=adms;
        });
    } else {
        this.isAdmin=this.ibf.adminDpms.length>0;
    }
},
methods:{
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
    request({method:"GET",url:"/attendance/clock"}, SERVICE_HR).then(resp=>{
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
 <div class="col self-center text-right">
  <div class="q-gutter-lg">
   <q-btn flat dense color="primary" @click="ibf.goto('/ibf/my')">
    <div class="text-center">
     <q-icon name="sensor_occupied"></q-icon><br>
     {{tags.my.title}}
    </div>
   </q-btn>
   <q-btn flat dense color="primary" @click="ibf.goto('/ibf/attendance')">
    <div class="text-center">
     <q-icon name="work_history"></q-icon><br>
     {{tags.atd.title}}
    </div>
   </q-btn>
   <q-btn flat dense color="primary" @click="ibf.goto('/ibf/contacts')">
    <div class="text-center">
     <q-icon name="person_search"></q-icon><br>
     {{tags.grp.contacts}}
    </div>
   </q-btn>
   <q-btn flat dense color="primary" @click="ibf.goto('/ibf/department')" v-if="isAdmin">
    <div class="text-center">
     <q-icon name="group"></q-icon><br>
     {{tags.grp.department}}
    </div>
   </q-btn>
  </div>
 </div>
</div>
<q-separator spaced="md"></q-separator>
<q-list dense separator>
  <q-item v-for="p in prjs" @click="ibf.goto('/ibf/project?id='+p.id)" clickable>
   <q-item-section>
    <q-item-label>{{p.name}}</q-item-label>
    <q-item-label caption>{{p.role}}</q-item-label>
   </q-item-section>
   <q-item-section side>
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