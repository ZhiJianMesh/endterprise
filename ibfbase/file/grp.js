export default {
inject:['tags'],
data() {return {
    gid:this.$route.query.id,
    tab:'subs',
    members:{},
    grps:[],
    grp:{name:'',path:'',type:'',descr:'',role:''}, //当前群组
    exps:[], //考勤异常列表申请
    perfs:[], //绩效查询
    levels:[], //绩效等级
    errMsgs:{},
    month:{v:0,cur:0,s:'',e:false/*是否有可修改的行*/},
    popup:{obj:{},show:false},//待编辑的对象
    newMbr:{dlg:false,account:[],title:''},
}},
created(){
    this.query_subs();
    this.get_grp();
    var dt=new Date();
    var cur=dt.getFullYear()*12 + dt.getMonth();
    this.month = {v:cur, cur:cur, s: Math.floor(cur/12) + "/" + (1+cur%12)};

    var opts={method:"GET",url:"/config/listPerfLevel",private:false};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code==RetCode.OK) {
            this.levels=resp.data.list;
        }
    });
},
methods:{
tab_changed(tab) {
    if(this.tab==tab)return;
    this.tab=tab;
    if(tab=='subs') {
        if(this.grps.length==0||this.members.length==0) {
            this.query_subs();
        }
    } else if(tab=='exps') {
        if(this.exps.length==0) {
            this.query_exps();
        }
    } else {
        if(this.perfs.length==0) {
            this.query_perfs(this.month.v);
        }
    }
},
get_grp() {
    var opts={method:"GET",url:"/grp/get?id="+this.gid};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code==RetCode.OK) {
            this.grp=resp.data;
        }
    });
},
query_exps() {
    var opts={method:"GET", url:"/exception/waitforme?gid="+this.gid}
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
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
query_perfs(month) {
    var opts={method:"GET", url:"/perf/list?gid="+this.gid+"&month="+month}
    request(opts, SERVICE_HR).then(resp => {
        this.month.e=false;
        if(resp.code!=RetCode.OK) {
            this.perfs=[];
            return;
        }
        this.perfs=resp.data.list.map(p=>{
            var l=p.level==''?this.levels[0].level:p.level;
            if(p.cfmed=='N') this.month.e=true;
            var mb = this.members[p.uid];
            var cmt=p.cmt==''?this.tags.perfCmt:p.cmt;
            return {uid:p.uid,level:l,account:mb.account,
                name:mb.name,cmt:cmt,cfmed:p.cfmed};
        });
    })
},
query_subs(){//查询子群组及成员
    var opts={method:"GET", url:"/grp/listAll?gid="+this.gid}
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        var mbs={};
        for(var m of resp.data.members) {
            mbs[m.uid]=m;
        }
        this.members=mbs;
        if(resp.data.grps) {
            var dt=new Date();
            this.grps=resp.data.grps.map(g=>{
                return {id:g.id, name:g.name, descr:g.descr,createAt:dt.toLocaleDateString()}
            });
        } else {
            this.grps=[];
        }
    })  
},
add_member() {
    var dta={gid:this.gid,uid:this.newMbr.account[0],title:this.newMbr.title};
    var opts={method:"POST",url:"/api/member/add",data:dta};
    request(opts, SERVICE_HR).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_subs();
        this.newMbr={dlg:false,account:[],title:''};
    });
},
rmv_member(id,i) {
    var opts={method:"DELETE",url:"/api/member/remove?gid="+this.gid+"&uid="+id};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.members.splice(i,1);
    });
},
cfm_perf() {
    var opts={method:"PUT",url:"/api/perf/confirm", data:{gid:this.gid,month:this.month.v}};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_perfs(this.month.v);
    });
},
cfm_exp(uid,day) {
    var opts={method:"PUT",url:"/api/exception/confirm", data:{uid:uid,day:day}};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_exps();
    }); 
},
rej_exp(uid,day) {
    var opts={method:"PUT",url:"/api/exception/reject", data:{uid:uid,day:day}};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_exps();
    }); 
},
perf_fore_mon() {
    if(this.month.v<=this.month.cur-60) return;
    this.month.v--;
    this.month.s = Math.floor(this.month.v/12) + "/" + (1+this.month.v%12);
    this.query_perfs(this.month.v);
},
perf_next_mon() {
    if(this.month.v>=this.month.cur) return;
    this.month.v++;
    this.month.s = Math.floor(this.month.v/12) + "/" + (1+this.month.v%12);
    this.query_perfs(this.month.v);
},
init_perf() {
    var opts={method:"POST",url:"/api/perf/init", data:{gid:this.gid,month:this.month.v}};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_perfs(this.month.v);
    });
},
clear_perf() {
    var opts={method:"DELETE",url:"/api/perf/clear?gid="+this.gid+"&month="+this.month.v};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_perfs(this.month.v);
    });
},
save_perf(v,org) {
    var opts={method:"PUT",url:"/api/perf/set",
        data:{month:this.month.v, uid:v.uid,level:v.level, cmt:v.cmt}};
    request(opts, SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        }
        org.level=v.level;
        org.cmt=v.cmt;
    });
},
back() {
    this.$router.back();
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:99vh">
  <q-header>
   <q-toolbar>
     <q-btn flat round icon="arrow_back" dense @click="back()"></q-btn>
     <q-toolbar-title>{{tags.grps}} ({{grp.path}})</q-toolbar-title>
   </q-toolbar>
   <q-separator></q-separator>
   <div class="text-white row justify-center">
    <div class="col text-center">
     <q-btn icon="account_tree" :label="tags.struct" @click="tab_changed('subs')" flat dense></q-btn>
     <div style="height:3px" class="bg-warning" v-show="tab=='subs'"></div>
    </div>
    <div class="col text-center">
     <q-btn icon="running_with_errors" :label="tags.clockExp" @click="tab_changed('exps')" flat dense></q-btn>
     <div style="height:3px" class="bg-warning" v-show="tab=='exps'"></div>
    </div>
    <div class="col text-center">
     <q-btn-dropdown icon="diamond" :label="month.s + tags.perf" @click="tab_changed('perfs')" flat dense>
      <q-list dense class="text-primary">
        <q-item v-close-popup>
         <q-item-section>
          <q-btn icon="navigate_before" @click="perf_fore_mon" flat></q-btn>
         </q-item-section>
         <q-item-section>
          <q-btn icon="navigate_next" @click="perf_next_mon" flat></q-btn>
         </q-item-section>
        </q-item>
        <q-item v-close-popup><q-item-section>
          <q-btn @click="init_perf" flat :label="tags.init"></q-btn>
        </q-item-section></q-item>
        <q-item v-close-popup v-show="month.e"><q-item-section>
          <q-btn @click="clear_perf" flat :label="tags.clear"></q-btn>
        </q-item-section></q-item>
        <q-item v-close-popup v-show="month.e"><q-item-section>
          <q-btn @click="cfm_perf" flat :label="tags.submit"></q-btn>
        </q-item-section></q-item>
      </q-list>
     </q-btn-dropdown>
     <div style="height:3px" class="bg-warning" v-show="tab=='perfs'"></div>
    </div>
   </div>

  </q-header>
  <q-page-container>
    <q-page class="q-pa-sm">
    
<q-tab-panels v-model="tab">
<q-tab-panel name="subs">
<q-list>
  <q-item v-for="g in grps">
   <q-item-section thumbnail><q-icon name="folder" color="amber"></q-icon></q-item-section>
   <q-item-section>{{g.name}}</q-item-section>
   <q-item-section>{{g.descr}}</q-item-section>
   <q-item-section side>{{g.createAt}}</q-item-section>
  </q-item>
  <q-separator></q-separator>
  <q-item v-for="(m,uid) in members">
    <q-item-section thumbnail><q-icon name="person_outline" color="indigo"></q-icon></q-item-section>
    <q-item-section>{{m.name}}</q-item-section>
    <q-item-section>{{m.account}}</q-item-section>
    <q-item-section side>{{m.title}}</q-item-section>
  </q-item>
</q-list>
</q-tab-panel>

<q-tab-panel name="exps">
<q-list>
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

<q-tab-panel name="perfs">
<q-list dense separator>
  <q-item v-for="(p,i) in perfs" :class="p.cfmed=='N'?'text-indigo':''">
   <q-item-section>
    <q-item-label>{{p.account}}</q-item-label>
    <q-item-label caption>{{p.name}}</q-item-label>
   </q-item-section>
   <q-item-section>
    <q-item-label>{{p.level}}</q-item-label>
    <q-item-label caption>{{p.cmt}}</q-item-label>
   </q-item-section>
   <!-- popup-edit不能即使刷新，所以用popup-proxy，自己控制 -->
   <q-popup-proxy @show="Object.assign(popup.obj,p)" v-model="popup.show">
   <div class="q-pa-md" v-show="p.cfmed=='N'">
    <div class="q-gutter-md">
     <q-radio v-model="popup.obj.level"
      v-for="l in levels" :val="l.level" :label="l.name"></q-radio>
    </div>
    <q-input color="accent" v-model="popup.obj.cmt" dense autofocus></q-input>
    <div class="row text-center justify-end">
     <div class="col">
      <q-btn :label="tags.cancel" @click="popup.show=false" flat color="primary"></q-btn>
     </div>
     <div class="col">
      <q-btn :label="tags.save" @click="save_perf(popup.obj,p);popup.show=false;" color="primary"></q-btn>
      </div>
    </div>
   </div>
   </q-popup-proxy>
  </q-item>
</q-list>
</q-tab-panel>
</q-tab-panels>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="newMbr.dlg">
 <q-card style="min-width:70vw">
  <q-card-section>
      <div class="text-h6">{{tags.addMbr}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
    <q-item><q-item-section>
     <component-user-selector :label="tags.user.account"
      :accounts="newMbr.account" :multi="false" useid="true"></component-user-selector>
    </q-item-section></q-item>
    <q-item><q-item-section>
     <q-input :label="tags.grp.title" v-model="newMbr.title" dense></q-input>
    </q-item-section></q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn :label="tags.ok" color="primary" @click="add_member"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}