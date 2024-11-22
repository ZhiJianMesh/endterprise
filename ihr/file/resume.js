export default {
inject:['service', 'tags'],
data() {return {
    uid:this.$route.query.uid,
    events:[],
    empInfo:{uid:this.$route.query.uid,
        office:0,worktime:0,stock:0,quali:'',post:'',attend:'',
        salary:'',dSalary:'',hSalary:'',subsidy:'',entryAt:'',
        account:'',addr:'',email:'',idno:'',state:'',holiday:0,weal:0,sickRatio:0},
    ctrl:{ei:{},resumeDlg:false,eventDlg:false,
          grade:false,salary:false,weal:false,zone:false,
          event:false,resume:false},
    opts:{zone:[],office:[],worktime:[]}
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
    p.entryAt_s=this.tags.date2str(dt);
    p.worktime_s=this.service.worktimeMap[p.worktime];
    p.office_s=this.service.officeMap[p.office];
    return p;
},
remove() {
    request({method:"DELETE",url:"/api/employee/remove?uid="+this.uid}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.service.back();
    });
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
            e.at=this.tags.date2str(dt);
            e.type=this.tags.evtType[e.type];
            list.push(e);
        }
        this.events=list;
    })
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
        subsidy:this.empInfo.subsidy,
        stock:this.empInfo.stock
    };
    request({method:"PUT", url:url, data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.salary=false;
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
    <q-btn flat dense :label="tags.employee.leave" @click="leave"></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list dense>
  <q-item>
   <q-item-section>{{tags.pool.maxEdu}}/{{tags.pool.firstEdu}}</q-item-section>
   <q-item-section class="text-primary" @click="service.goto('/resume?uid='+this.uid)">
    {{empInfo.maxEdu_s}}/{{empInfo.firstEdu_s}}
   </q-item-section>
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
    <q-item-label caption>{{tags.employee.stock}}:{{empInfo.stock}}</q-item-label>
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
    <q-input v-model.number="empInfo.stock" :label="tags.employee.stock"></q-input>
  </q-item-section>
  <q-item-section avatar>
   <q-btn icon="cancel" @click="ctrl.salary=false" flat color="primary"></q-btn>
   <q-btn icon="done" @click="modifySalary" flat color="primary"></q-btn>
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
   <q-item-section>{{e.at}}</q-item-section>
   <q-item-section>{{e.type}}</q-item-section>
   <q-item-section>{{e.val}}</q-item-section>
   <q-item-section>{{e.cmt}}</q-item-section>
   <q-item-section v-if="e.cfmAcc!=''">{{e.cfmAcc}}</q-item-section>
   <q-item-section v-else>
    <q-icon name="done" @click="cfmEvent(e.at,e.type)" color="primary"></q-icon>
   </q-item-section>
  </q-item>
</q-list>


    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="ctrl.entryDlg">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.employee.entry}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-list>
      <q-item><q-item-section>{{empInfo.name}}</q-item-section></q-item>
      <q-item><q-item-section>{{empInfo.phone}}</q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="empInfo.account" :label="tags.pub.account" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="empInfo.quali" :label="tags.employee.quali" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="empInfo.post" :label="tags.employee.post" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-select v-model="empInfo.zone" :options="opts.zone" emit-value
       @update:model-value="changeOffice"
       :label="tags.employee.zone" dense map-options></q-select>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-select v-model="empInfo.office" :options="opts.office" emit-value
       :label="tags.employee.office" dense map-options></q-select>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-select v-model="empInfo.worktime" :options="opts.worktime" emit-value
       :label="tags.employee.worktime" dense map-options></q-select>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="empInfo.salary" :label="tags.employee.salary"
       @update:model-value="salaryChange" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="empInfo.dSalary" :label="tags.employee.dSalary" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="empInfo.hSalary" :label="tags.employee.hSalary" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model.number="empInfo.subsidy" :label="tags.employee.subsidy" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="empInfo.idno" :label="tags.employee.idno" dense maxlength=18></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="empInfo.email" :label="tags.employee.email" dense maxlength=80></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="empInfo.addr" :label="tags.employee.addr" dense maxlength=80></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <date-input v-model="empInfo.entryAt" :label="tags.employee.entryAt"
        :close="tags.ok"></date-input>
      </q-item-section></q-item>
     </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-space></q-space>
      <q-btn :label="tags.ok" color="primary" @click="entry"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errMsg"></alert-dialog>
`
}