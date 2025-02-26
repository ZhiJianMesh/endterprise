const EMPTY_OFF={name:'',cmt:''};
const EMPTY_PERF={level:'',name:'',cmt:''};
const EMPTY_WT={calendar:0,first:0,second:0,third:0,
    forth:0,leadTime:0,maxEdit:0,name:'',midClock:'N'};
function formatTime(t) {
    var v=t>1440?(t-1440):t;
    var h=parseInt(v/60);
    var m=v%60;
    return (h<10?('0'+h):h) + ':' + (m<10?('0'+m):m);
}
export default {
inject:['service', 'tags'],
data() {return {
    offices:[], //办公区定义
    worktimes:[], //作息制度定义
    perfs:[], //绩效等级定义
    edt:{office:{},wt:{},perf:{}},
    ctrl:{no:-2,tag:'',officeDlg:false,wtDlg:false,perfDlg:false},
    zone:{cur:-1,opts:[]},
    calOpts:[]
}},
created(){
    this.query_zones();
    this.query_perfs();
    this.query_worktimes();
    
    var opts={method:"GET", url:"/config/listCalendar"}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        var opts=[];
        for(var z of resp.data.list) {
            opts.push({label:z.name, value:z.id});
        }
        this.calOpts=opts;
    })  
},
methods:{
query_zones(){//查询区域
    var opts={method:"GET", url:"/config/listZone"}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        var opts=[];
        if(resp.data.list.length>0) {
            for(var z of resp.data.list) {
                opts.push({label:z.name, value:z.id});
            }
            if(this.zone.cur<0) {
                this.zone.cur=resp.data.list[0].id;
                this.query_offices(this.zone.cur);
            }
        }
        this.zone.opts=opts;
    })  
},
query_offices(zone){
    this.edt.office.zone=zone;
    var opts={method:"GET", url:"/config/queryOffice?zone="+zone}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.offices=[];
            return;
        }
        this.offices = resp.data.list;
    })  
},
query_worktimes(){
    var opts={method:"GET", url:"/config/queryWorktime"}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        var wt = resp.data.list.map(w=>{
            w.first_s=formatTime(w.first);
            w.second_s=formatTime(w.second);
            w.third_s=formatTime(w.third);
            w.forth_s=formatTime(w.forth);
            w.midClock_s=this.tags.yesNo[w.midClock];
            return w;
        });
        this.worktimes=wt;
    })  
},
query_perfs(){
    var opts={method:"GET", url:"/config/listPerfLevel"}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        this.perfs=resp.data.list;
    })  
},
show_office(i) {
    this.edt.zone=this.zone.cur;
    if(i>-1) {
        this.ctrl.tag=this.tags.modify;
        this.edt.office.id=this.offices[i].id;
        copyObjTo(this.offices[i], this.edt.office);
    } else {
        this.ctrl.tag=this.tags.add;
        copyObjTo(EMPTY_OFF, this.edt.office);
    }
    this.ctrl.tag+=this.tags.cfg.office;
    this.ctrl.no=i;
    this.ctrl.officeDlg=true;
},
office_do() {
    var opts;
    if(this.ctrl.no>-1) {
        opts={method:"PUT",url:"/config/updateOffice",data:this.edt.office};
    } else {
        opts={method:"POST",url:"/config/addOffice",data:this.edt.office};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(this.ctrl.no>-1) {
            copyObjTo(this.edt.office, this.offices[this.ctrl.no]);
        } else {
            var o = {id:resp.data.id};
            copyObjTo(this.edt.office, o);
            this.offices.push(o);
        }
        this.ctrl.no=-2;
        this.ctrl.officeDlg=false;
    });
},
show_perf(i) {
    if(i>-1) {
        this.ctrl.tag=this.tags.modify;
        copyObjTo(this.perfs[i], this.edt.perf);
    } else {
        this.ctrl.tag=this.tags.add;
        copyObjTo(EMPTY_PERF, this.edt.perf);
    }
    this.ctrl.tag+=this.tags.cfg.perf;
    this.ctrl.no=i;
    this.ctrl.perfDlg=true;
},
perf_do() {
    var opts;
    if(this.ctrl.no>-1) {
        opts={method:"PUT",url:"/config/updatePerfLevel",data:this.edt.perf};
    } else {
        opts={method:"POST",url:"/config/addPerfLevel",data:this.edt.perf};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(this.ctrl.no>-1) {
            copyObjTo(this.edt.perf, this.perfs[this.ctrl.no]);
        } else {
            var o = {};
            copyObjTo(this.edt.perf, o);
            this.perfs.push(o);
        }
        this.ctrl.no=-2;
        this.ctrl.perfDlg=false;
    });
},
show_worktime(i) {
    if(i>-1) {
        this.ctrl.tag=this.tags.modify;
        this.edt.wt.id=this.worktimes[i].id;
        copyObjTo(this.worktimes[i], this.edt.wt);
    } else {
        this.ctrl.tag=this.tags.add;
        copyObjTo(EMPTY_WT, this.edt.wt);
        this.edt.wt.calendar=this.calOpts[0].value;
    }
    this.ctrl.tag+=this.tags.cfg.worktime;
    this.ctrl.no=i;
    this.ctrl.wtDlg=true;
},
worktime_do() {
    var opts;
    if(this.ctrl.no>-1) {
        opts={method:"PUT",url:"/config/updateWorktime",data:this.edt.wt};
    } else {
        opts={method:"POST",url:"/config/addWorktime",data:this.edt.wt};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        var w=this.edt.wt;
        w.first_s=formatTime(w.first);
        w.second_s=formatTime(w.second);
        w.third_s=formatTime(w.third);
        w.forth_s=formatTime(w.forth);
        if(this.ctrl.no>-1) {
            copyObjTo(w, this.worktimes[this.ctrl.no]);
        } else {
            var o = {id:resp.data.id};
            copyObjTo(w, o);
            this.worktimes.push(o);
        }
        this.ctrl.no=-2;
        this.ctrl.wtDlg=false;
    });
},
remove_perf(i) {
    var opts={method:"DELETE",url:"/config/removePerfLevel?level="+this.perfs[i].level};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.perfs.splice(i,1);
    });
},
remove_worktime(i) {
    var opts={method:"DELETE",url:"/config/removeWorktime?id="+this.worktimes[i].id};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.worktimes.splice(i,1);
    });
},
remove_office(i) {
    var opts={method:"DELETE",url:"/config/removeOffice?id="+this.offices[i].id};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.offices.splice(i,1);
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header>
   <q-toolbar>
     <q-btn flat round icon="arrow_back" dense @click="service.back()"></q-btn>
     <q-toolbar-title>{{tags.cfg.title}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-none">
<q-banner inline-actions class="bg-indigo-1 q-ma-none" dense>
  {{tags.cfg.office}}
  <template v-slot:action>
   <q-select v-model="zone.cur" :options="zone.opts" @update:model-value="query_offices"
   dense map-options emit-value>
    <template v-slot:after>
     <q-btn flat dense color="primary" icon="add_circle" @click="show_office(-1)"></q-btn>
     <q-btn flat dense color="teal" icon="info" @click.stop="service.goto('/zone')"></q-btn>
    </template>
   </q-select>
  </template>
</q-banner>
<q-list dense>
 <q-item v-for="(o,i) in offices">
  <q-item-section>{{o.name}}</q-item-section>
  <q-item-section>{{o.cmt}}</q-item-section>
  <q-menu touch-position context-menu>
    <q-list dense style="min-width:100px">
      <q-item clickable v-close-popup @click="show_office(i)">
        <q-item-section avatar><q-icon name="edit" color="primary"></q-icon></q-item-section>
        <q-item-section>{{tags.modify}}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="remove_office(i)">
        <q-item-section avatar><q-icon name="delete_forever" color="red"></q-icon></q-item-section>
        <q-item-section>{{tags.remove}}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
 </q-item>
</q-list>

<q-banner inline-actions class="bg-indigo-1 q-mt-none" dense>
  {{tags.cfg.worktime}}
  <template v-slot:action>
   <q-btn icon="add_circle" @click="show_worktime(-1)" color="primary" flat dense></q-btn>
   <q-btn icon="calendar_month" @click.stop="service.goto('/calendar')" color="teal" flat dense></q-btn>
  </template>
</q-banner>
<q-list>
 <q-item v-for="(w,i) in worktimes">
  <q-item-section>
   <q-item-label>{{w.name}}</q-item-label>
   <q-item-label caption>{{w.calName}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label>{{w.first_s}}-{{w.second_s}},{{w.third_s}}-{{w.forth_s}}</q-item-label>
   <q-item-label>{{tags.cfg.maxEdit}}:{{w.maxEdit}}<q-item-label>
   <q-item-label>{{tags.cfg.leadTime}}:{{w.leadTime}}<q-item-label>
  </q-item-section>
  <q-menu touch-position context-menu>
    <q-list dense style="min-width:100px">
      <q-item clickable v-close-popup @click="show_worktime(i)">
        <q-item-section avatar><q-icon name="edit" color="primary"></q-icon></q-item-section>
        <q-item-section>{{tags.modify}}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="remove_worktime(i)">
        <q-item-section avatar><q-icon name="delete_forever" color="red"></q-icon></q-item-section>
        <q-item-section>{{tags.remove}}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
 </q-item>
</q-list>

<q-banner inline-actions class="bg-indigo-1 q-mt-none" dense>
  {{tags.cfg.perf}}
  <template v-slot:action>
   <q-btn icon="add_circle" @click="show_perf(-1)" color="primary" flat dense></q-btn>
  </template>
</q-banner>
<q-list dense>
 <q-item v-for="(p,i) in perfs">
  <q-item-section>{{p.level}}/{{p.name}}</q-item-section>
  <q-item-section>{{p.cmt}}</q-item-section>
  <q-menu touch-position context-menu>
    <q-list dense style="min-width:100px">
      <q-item clickable v-close-popup @click="show_perf(i)">
        <q-item-section avatar><q-icon name="edit" color="primary"></q-icon></q-item-section>
        <q-item-section>{{tags.modify}}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="remove_perf(i)">
        <q-item-section avatar><q-icon name="delete_forever" color="red"></q-icon></q-item-section>
        <q-item-section>{{tags.remove}}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
 </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="ctrl.officeDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{ctrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input :label="tags.name" v-model="edt.office.name" dense></q-input>
   <q-input :label="tags.cmt" v-model="edt.office.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="office_do"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<q-dialog v-model="ctrl.wtDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{ctrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input :label="tags.name" v-model="edt.wt.name" dense></q-input>
   <q-input :label="tags.cfg.first" v-model.number="edt.wt.first" dense></q-input>
   <q-input :label="tags.cfg.second" v-model.number="edt.wt.second" dense></q-input>
   <q-input :label="tags.cfg.third" v-model.number="edt.wt.third" dense></q-input>
   <q-input :label="tags.cfg.forth" v-model.number="edt.wt.forth" dense></q-input>
   <q-input :label="tags.cfg.leadTime" v-model.number="edt.wt.leadTime" dense></q-input>
   <q-input :label="tags.cfg.maxEdit" v-model.number="edt.wt.maxEdit" dense></q-input>
   <q-select :label="tags.cfg.calendar" v-model="edt.wt.calendar" :options="calOpts"
   dense map-options emit-value></q-select>
   <div class="row items-center">
    <div class="col">{{tags.cfg.midClock}}</div>
    <div class="col q-gutter-sm">
     <q-radio v-model="edt.wt.midClock" val="Y" :label="tags.yesNo.Y"></q-radio>
     <q-radio v-model="edt.wt.midClock" val="N" :label="tags.yesNo.N"></q-radio>
    </div>
   </div>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="worktime_do"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<q-dialog v-model="ctrl.perfDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{ctrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input :label="tags.cfg.level" v-model="edt.perf.level" dense></q-input>
   <q-input :label="tags.name" v-model="edt.perf.name" dense></q-input>
   <q-input :label="tags.cmt" v-model="edt.perf.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="perf_do"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
`
}