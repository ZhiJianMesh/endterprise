export default {
inject:['service', 'tags'],
data() {return {
    uid:this.$route.query.uid,
    events:[],
    resources:[],
    empInfo:{uid:this.$route.query.uid,
        office:0,worktime:0,stock:0,quali:'',post:'',attend:'',
        salary:'',dSalary:'',hSalary:'',subsidy:'',entryAt:'',
        account:'',addr:'',email:'',idno:'',state:'',holiday:0,weal:0,sickRatio:0},
    ctrl:{ei:{},leave:false,grade:false,salary:false,stock:false,weal:false,zone:false},
    opts:{zone:[],office:[],worktime:[]},
    leave:{disable:false, type:'LEAV', cmt:''}
}},
created(){
    this.service.worktimeList().then(opts=>{
        this.opts.worktime=opts;
    });
    this.service.zoneList().then(opts=>{
        this.opts.zone=opts;
    });
    this.service.officeList().then(()=> {
        this.get();
        this.getEvents();
    }); //生成officeMap
},
methods:{
get() {
    var url = "/api/employee/get?uid="+this.uid;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        this.empInfo=this.convert(resp.data);
    })
},
convert(src) {
    var dt=new Date();
    var year=dt.getFullYear();
    var p={};
    copyObjTo(src, p);
    p.uid=this.uid;
    p.sex_s=this.tags.sex[p.sex];
    p.state_s=this.tags.empState[p.state];
    p.state_b=p.state=='NORM';
    p.maxEdu_s=this.tags.edu[p.maxEdu];
    p.firstEdu_s=this.tags.edu[p.firstEdu];
    dt.setTime(p.birth*60000);
    p.age=year-dt.getFullYear();
    dt.setTime(p.entryAt*60000);
    p.entryAt_s=date2str(dt);
    p.worktime_s=this.service.worktimeMap[p.worktime];
    p.office_s=this.service.officeMap[p.office];
    return p;
},
getEvents() {
    var url = "/api/employee/listEvent?uid="+this.uid;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        var list=[];
        for(var e of resp.data.list) {
            dt.setTime(e.at*60000);
            e.at=date2str(dt);
            e.type=this.tags.evtType[e.type];
            list.push(e);
        }
        this.events=list;
    })
},
doLeave() { //离职
    var url="/api/employee/remove";
    var dta={uid:this.uid,state:this.leave.type, cmt:this.leave.cmt};
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.service.back();
    });
},
showLeave() {
    var url = "/api/resource/list?uid="+this.uid;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        var list=[];
        if(resp.code==RetCode.OK) {
            var dt=new Date();
            for(var l of resp.data.list) {
                dt.setTime(l.start*60000);
                l.start=date2str(dt);
                list.push(l);
            }
            this.resources=list;
        }
        this.leave.disable=list.length>0; //挂了资产，离职前必须先清除
    });
    this.ctrl.leave=true;
},
toggleHide() {
    var state;
    if(this.empInfo.state=='HIDE') {
        state='NORM';
    } else if(this.empInfo.state=='NORM') {
        state='HIDE';
    } else {
        return;
    }
    var url="/api/employee/toggleHide";
    var dta={uid:this.uid,state:state};
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.empInfo.state_b=(this.empInfo.state=='NORM');
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.empInfo.state=state;
        this.empInfo.state_s=this.tags.empState[state];
        this.empInfo.state_b=(state=='NORM');
    });
},
changeOffice(zone) {
    this.service.officeList(zone).then(opts=>{
        this.opts.office=opts;
    });
},
modifyZone() {
    var url="/api/employee/setZone";
    var dta={uid:this.uid,office:this.empInfo.office,worktime:this.empInfo.worktime};
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.empInfo.worktime_s=this.service.worktimeMap[this.empInfo.worktime];
        this.empInfo.office_s=this.service.officeMap[this.empInfo.office];
        this.ctrl.zone=false;
    });
},
modifyGrade() {
    var url="/api/employee/setGrade";
    var dta={uid:this.uid,post:this.empInfo.post,quali:this.empInfo.quali};
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.grade=false;
    });
},
modifySalary() {
    var url="/api/employee/setSalary";
    var dta={uid:this.uid,
        salary:this.empInfo.salary,
        dSalary:this.empInfo.dSalary,
        hSalary:this.empInfo.hSalary,
        subsidy:this.empInfo.subsidy
    };
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.salary=false;
    });
    
},
modifyStock() {
    var url="/api/employee/setStock";
    var dta={uid:this.uid,stock:this.empInfo.stock};
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.stock=false;
    });
    
},
modifyWeal() {
    var url="/api/employee/setWeal";
    var dta={uid:this.uid,
        holiday:this.empInfo.holiday,
        weal:this.empInfo.weal,
        sickRatio:this.empInfo.sickRatio};
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.weal=false;
    });
    
},
cfmEvent(at,type) {
    var url="/api/employee/cfmEvent";
    var dta={uid:this.uid,at:at,type:type};
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.getEvents();
    }); 
},
salaryChange(v) {
    this.empInfo.dSalary=parseInt(v/22);
    this.empInfo.hSalary=parseInt(v/(22*8));
}
},
template:`
<q-layout view="hHh lpr fFf" container style="height:100vh">
  <q-header>
   <q-toolbar>
    <q-btn flat icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{tags.employee.detail}}-{{empInfo.name}} {{empInfo.sex_s}}</q-toolbar-title>
    <q-btn flat dense :label="tags.employee.leave" @click="showLeave" v-if="uid>1"></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list dense>
  <q-item>
   <q-item-section>{{tags.pool.maxEdu}}/{{tags.pool.firstEdu}}</q-item-section>
   <q-item-section><div>
    {{empInfo.maxEdu_s}}/{{empInfo.firstEdu_s}}
    <q-badge color="primary" @click="service.goto('/resume?uid='+uid)">
     {{tags.employee.resume}}<q-icon name="event_note" color="white"></q-icon>
    </q-badge>
   </div></q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.employee.addr}}</q-item-section>
   <q-item-section>{{empInfo.addr}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pub.phone}}</q-item-section>
   <q-item-section>{{empInfo.phone}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pub.email}}</q-item-section>
   <q-item-section>{{empInfo.email}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.employee.state}}</q-item-section>
   <q-item-section>
    <q-toggle v-model="empInfo.state_b" :label="empInfo.state_s"
    @update:model-value="toggleHide" dense
    unchecked-icon="visible_off" checked-icon="visible"></q-toggle>
   </q-item-section>
  </q-item>
</q-list>
<q-separator inset></q-separator>
<q-list dense v-if="!ctrl.zone">
  <q-item>
   <q-item-section>
    <q-item-label caption>{{tags.employee.office}}:{{empInfo.office_s}}</q-item-label>
    <q-item-label caption>{{tags.employee.worktime}}:{{empInfo.worktime_s}}</q-item-label>
   </q-item-section>
   <q-item-section avatar>
    <q-icon name="edit" flat color="primary"
    @click="ctrl.zone=true;changeOffice(empInfo.zone);"></q-btn>
   </q-item-section>
  </q-item>
</q-list>
<q-list dense v-else>
  <q-item>
   <q-item-section>
     <q-select v-model="empInfo.zone" :options="opts.zone" @update:model-value="changeOffice"
      :label="tags.employee.zone" dense map-options emit-value></q-select>
     <q-select v-model="empInfo.office" :options="opts.office"
      :label="tags.employee.office" dense map-options emit-value></q-select>
     <q-select v-model="empInfo.worktime" :options="opts.worktime" emit-value
      :label="tags.employee.worktime" dense map-options></q-select>
   </q-item-section>
   <q-item-section avatar>
    <q-btn icon="cancel" @click="ctrl.zone=false" flat color="primary"></q-btn>
    <q-btn icon="done" @click="modifyZone" flat color="primary"></q-btn>
   </q-item-section>
  </q-item>
</q-list>
<q-separator inset></q-separator>
<q-list dense v-if="!ctrl.grade">
  <q-item>
   <q-item-section>
    <q-item-label caption>{{tags.employee.quali}}:{{empInfo.quali}}</q-item-label>
    <q-item-label caption>{{tags.employee.post}}:{{empInfo.post}}</q-item-label>
   </q-item-section>
   <q-item-section avatar>
    <q-icon name="edit" flat color="primary" @click="ctrl.grade=true"></q-btn>
   </q-item-section>
  </q-item>
</q-list>
<q-list dense v-else>
 <q-item>
  <q-item-section>
    <q-input v-model.number="empInfo.quali" :label="tags.employee.quali"></q-input>
    <q-input v-model.number="empInfo.post" :label="tags.employee.post"></q-input>
  </q-item-section>
  <q-item-section avatar>
   <q-btn icon="cancel" @click="ctrl.grade=false" flat color="primary"></q-btn>
   <q-btn icon="done" @click="modifyGrade" flat color="primary"></q-btn>
  </q-item-section>
 </q-item>
</q-list>
<q-separator inset></q-separator>
<q-list dense v-if="!ctrl.salary">
  <q-item>
   <q-item-section>
    <q-item-label caption>{{tags.employee.salary}}:{{empInfo.salary}}</q-item-label>
    <q-item-label caption>{{tags.employee.dSalary}}:{{empInfo.dSalary}}</q-item-label>
    <q-item-label caption>{{tags.employee.hSalary}}:{{empInfo.hSalary}}</q-item-label>
    <q-item-label caption>{{tags.employee.subsidy}}:{{empInfo.subsidy}}</q-item-label>
   </q-item-section>
   <q-item-section avatar>
    <q-icon name="edit" flat color="primary" @click="ctrl.salary=true"></q-btn>
   </q-item-section>
  </q-item>
</q-list>
<q-list dense v-else>
 <q-item>
  <q-item-section>
    <q-input v-model.number="empInfo.salary" :label="tags.employee.salary"
     @update:model-value="salaryChange"></q-input>
    <q-input v-model.number="empInfo.dSalary" :label="tags.employee.dSalary"></q-input>
    <q-input v-model.number="empInfo.hSalary" :label="tags.employee.hSalary"></q-input>
    <q-input v-model.number="empInfo.subsidy" :label="tags.employee.subsidy"></q-input>
  </q-item-section>
  <q-item-section avatar>
   <q-btn icon="cancel" @click="ctrl.salary=false" flat color="primary"></q-btn>
   <q-btn icon="done" @click="modifySalary" flat color="primary"></q-btn>
  </q-item-section>
 </q-item>
</q-list>
<q-separator inset></q-separator>
<q-list dense v-if="!ctrl.stock">
  <q-item>
   <q-item-section>
    <q-item-label caption>{{tags.employee.stock}}:{{empInfo.stock}}</q-item-label>
   </q-item-section>
   <q-item-section avatar>
    <q-icon name="edit" flat color="primary" @click="ctrl.stock=true"></q-btn>
   </q-item-section>
  </q-item>
</q-list>
<q-list dense v-else>
 <q-item>
  <q-item-section>
    <q-input v-model.number="empInfo.stock" :label="tags.employee.stock"></q-input>
  </q-item-section>
  <q-item-section avatar>
   <q-btn icon="cancel" @click="ctrl.stock=false" flat color="primary"></q-btn>
   <q-btn icon="done" @click="modifyStock" flat color="primary"></q-btn>
  </q-item-section>
 </q-item>
</q-list>
<q-separator inset></q-separator>
<q-list dense v-if="!ctrl.weal">
  <q-item>
   <q-item-section>
    <q-item-label caption>{{tags.employee.holiday}}:{{empInfo.holiday}}</q-item-label>
    <q-item-label caption>{{tags.employee.weal}}:{{empInfo.weal}}</q-item-label>
    <q-item-label caption>{{tags.employee.sickRatio}}:{{empInfo.sickRatio}}</q-item-label>
   </q-item-section>
   <q-item-section avatar>
    <q-icon name="edit" flat color="primary" @click="ctrl.weal=true"></q-btn>
   </q-item-section>
  </q-item>
</q-list>
<q-list dense v-else>
 <q-item>
  <q-item-section>
    <q-input v-model.number="empInfo.holiday" :label="tags.employee.holiday"></q-input>
    <q-input v-model.number="empInfo.weal" :label="tags.employee.weal"></q-input>
    <q-input v-model.number="empInfo.sickRatio" :label="tags.employee.sickRatio"></q-input>
  </q-item-section>
  <q-item-section avatar>
   <q-btn icon="cancel" @click="ctrl.weal=false" flat color="primary"></q-btn>
   <q-btn icon="done" @click="modifyWeal" flat color="primary"></q-btn>
  </q-item-section>
 </q-item>
</q-list>
<q-separator inset></q-separator>
<div class="bg-indigo-1 q-mt-md q-pa-sm">{{tags.employee.event}}</div>
<q-list dense>
  <q-item v-for="e in events">
   <q-item-section>{{e.type}}/{{e.val}}</q-item-section>
   <q-item-section>
    <q-item-label caption>{{e.at}}: {{e.cmt}}</q-item-label>
   </q-item-section>
   <q-item-section side v-if="e.cfmAcc!=''">{{e.cfmAcc}}</q-item-section>
   <q-item-section side v-else>
    <q-btn name="done" @click="cfmEvent(e.at,e.type)" color="primary" flat></q-btn>
   </q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="ctrl.leave">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.employee.leave}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <div class="q-gutter-sm">
      <q-radio dense v-model="leave.type" val="LEAV" :label="tags.evtType.LEAV"></q-radio>
      <q-radio dense v-model="leave.type" val="DIS" :label="tags.evtType.DIS"></q-radio>
     </div>
     <q-input outlined v-model="leave.cmt" :label="tags.cmt" type="textarea"></q-input>
     <q-list dense>
      <q-item v-for="r in resources">
       <q-item-section>
        <q-item-label caption>{{r.skuName}}</q-item-label caption>
        <q-item-label caption>{{r.start}}</q-item-label caption>
       </q-item-section>
       <q-item-section>{{r.no}}</q-item-section>
      </q-item>
     </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="doLeave" :disable="leave.disable"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errMsg"></alert-dialog>
`
}