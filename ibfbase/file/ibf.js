import AlertDialog from "/assets/v3/components/alert_dialog.js"
import Language from "./language.js"
import Grp from "./grp.js"
import My from "./my.js"
import Project from "./project.js"
import Business from "./business.js"
import Leave from "./leave.js"
import Overtime from "./overtime.js"

const l=Platform.language();
const tags = l.indexOf("zh") == 0 ? Language.cn : Language.en;

function registerIbf(app, router) { //注册ibfhome所需的路由
    router.addRoute({path:"/ibf/grp", component:Grp});
    router.addRoute({path:"/ibf/my", component:My});
    router.addRoute({path:"/ibf/overtime", component:Overtime});
    router.addRoute({path:"/ibf/project", component:Project});
    router.addRoute({path:"/ibf/business", component:Business});
    router.addRoute({path:"/ibf/leave", component:Leave});
    app.provide('ibfTags', tags);
    return loadJs('/ibfbase/base.js');//加载ibf基础库
}
export { registerIbf };

export default {
components: {
    "alert-dialog" : AlertDialog
},
data() {return {
    tags:tags,
    grps:[],
    prjs:[],
    clockTm:{start:'00:00', end:'00:00'}
}},
created(){
    request({method:"GET",url:"/grp/mygrp"}, SERVICE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            Console.warn("Fail to get mygrp:" + resp.code + ",info:" + resp.info);
            return;
        }
        var dta=resp.data;
        var role=this.tags.grpRole[dta.role];
        var grps=[{id:dta.id,type:dta.type,name:dta.name,path:dta.path,roleName:role,role:dta.role,title:dta.title}];
        for(var l of dta.virtuals) {
            role=this.tags.grpRole[l.role];
            grps.push({id:l.id,type:l.type,name:l.name,path:l.path,roleName:role,role:l.role,title:l.title})
        }
        this.grps=grps;
    }); 
    request({method:"GET",url:"/project/my?offset=0&num=5"}, SERVICE_PRJ).then(resp=>{
        if(resp.code!=RetCode.OK) {
            Console.warn("Fail to get my prj:" + resp.code + ",info:" + resp.info);
            return;
        }
        var role, tm;
        var dt=new Date();
        for(var l of resp.data.list) {
            dt.setTime(l.start*60000);
            tm=dt.toLocaleDateString();
            dt.setTime(l.end*60000);
            tm+='--'+dt.toLocaleDateString();
            role=this.tags.prjRole[l.role];
            prjs.push({id:l.id, name:l.name, role:role, progress:l.progress, time:tm})
        }
        this.prjs=prjs;
    }); 
},
methods:{
goto(url) {
    this.$router.push(url);
},
clock() { //上下班刷卡
    request({method:"GET",url:"/attendance/clock"}, SERVICE_HR).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        var dt=new Date();
        if(resp.data.start>0) {
            dt.setTime(resp.data.start*60000);
            this.clockTm.start=dt.getHours() + ":" + dt.getMinutes();
        }
        if(resp.data.end>0) {
            dt.setTime(resp.data.end*60000);
            this.clockTm.end=dt.getHours() + ":" + dt.getMinutes();
        }
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
     <span class="text-h5">{{tags.attendance}}</span>
     <br>{{clockTm.start}}-{{clockTm.end}}
   </div>
  </div>
  </q-btn>
 </div>
 <div class="col text-center">
  <q-list dense>
   <q-item dense>
    <q-item-section>
     <q-btn flat color="primary" :label="tags.overtime" @click="goto('/ibf/overtime')"></q-btn>
    </q-item-section>
    <q-item-section>
     <q-btn flat dense color="primary" :label="tags.leave" @click="goto('/ibf/leave')"></q-btn>
    </q-item-section>
   </q-item>
   <q-item dense>
    <q-item-section>
     <q-btn flat dense color="primary" :label="tags.business" @click="goto('/ibf/business')"></q-btn>
    </q-item-section>
    <q-item-section>
     <q-btn flat dense color="primary" :label="tags.my" @click="goto('/ibf/my')"></q-btn>
    </q-item-section>
   </q-item>
  </q-list>
 </div>
</div>
<q-separator spaced="sm"></q-separator>
<q-list dense separator>
  <q-item v-for="g in grps" @click="goto('/ibf/grp?id='+g.id)" :clickable="g.role=='ADM'">
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
<q-separator spaced="sm"></q-separator>
<q-list dense separator>
  <q-item v-for="p in prjs" @click="goto('/ibf/project?id='+p.id)" clickable>
   <q-item-section>
    <q-item-label>{{p.name}}</q-item-label>
    <q-item-label caption>{{p.role}}</q-item-label>
   </q-item-section>
   <q-item-section>
    <q-item-label>{{p.progress}}%</q-item-label>
    <q-item-label caption>{{p.time}}</q-item-label>
   </q-item-section>
  </q-item>
</q-list>
<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></alert-dialog>
`
}