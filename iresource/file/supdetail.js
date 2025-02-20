export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    skuInfo:{}, //sku信息
    suppliers:[], //供应商
    empInfo:{id:this.$route.query.id,
        office:'',worktime:0,quali:'',post:'',
        salary:'',dSalary:'',hSalary:'',subsidy:'',entryAt:'',
        account:'',addr:'',email:'',idno:''},
    ctrl:{fun:'',pi:{},entryDlg:false,cntDlg:false},
    contact:{dlg:false, act:'',cmt:'',at:'',uid:this.$route.query.uid,tag:''},
    opts:{edu:[],state:[],zone:[],office:[],worktime:[]}
}},
created(){
    this.get();
    var eOpts=[];
    for(var i in this.tags.edu) {
        eOpts.push({value:i,label:this.tags.edu[i]});
    }
    this.opts.edu=eOpts;
    
    var sOpts=[];
    for(var i in this.tags.perState) {
        if(i=='JOIN') continue;
        sOpts.push({value:i,label:this.tags.perState[i]});
    }
    this.opts.state=sOpts;
    this.service.worktimeList().then(opts=>{
        this.opts.worktime=opts;
    });
    this.service.zoneList().then(opts=>{
        this.opts.zone=opts;
    });
    this.getContacts();
},
methods:{
get() {
    var url = "/api/sku/get?id="+this.id;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        this.skuInfo=this.convert(resp.data);
    })
},
convert(src) {
    var dt=new Date();
    var year=dt.getFullYear();
    var p={};
    copyObjTo(src, p);
    p.uid=this.uid;
    p.sex_s=this.tags.sex[p.sex];
    p.state_s=this.tags.perState[p.state];
    p.maxEdu_s=this.tags.edu[p.maxEdu];
    p.firstEdu_s=this.tags.edu[p.firstEdu];
    dt.setTime(p.birth*60000);
    p.age=year-dt.getFullYear();
    p.birth_s=date2str(dt);
    dt.setTime(p.createAt*60000);
    p.createAt_s=date2str(dt);
    dt.setTime(p.update_time);
    p.updateAt=date2str(dt);
    return p;
},
showModify() {
    copyObjTo(this.skuInfo, this.ctrl.pi);
    this.ctrl.fun='modify';
},
remove() {
    request({method:"DELETE",url:"/api/pool/remove?uid="+this.skuInfo.uid}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.service.back();
    });
},
modify() {
    var url="/api/pool/update";
    this.ctrl.pi.birth=parseInt(new Date(this.ctrl.pi.birth_s).getTime()/60000);
    var dta=copyObjExc(this.ctrl.pi,[]);

    request({method:"PUT",url:url,data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.skuInfo=this.convert(this.ctrl.pi);
        this.ctrl.fun='';
    });
},
entry() {
    var url="/api/employee/add";
    var dta=copyObjExc(this.empInfo,['entryAt']);
    dta.entryAt=parseInt(new Date(this.empInfo.entryAt).getTime()/60000);
    request({method:"POST",url:url,data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.entryDlg=false;
        this.get();
    });
},
changeOffice(zone) {
    this.service.officeList(zone).then(opts=>{
        this.opts.office=opts;
    });
},
salaryChange(v) {
    this.empInfo.dSalary=parseInt(v/22);
    this.empInfo.hSalary=parseInt(v/(22*8));
},
//联系记录操作
getContacts() {
    var url = "/api/pool/listContact?uid="+this.uid;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date();
        var list=[];
        for(var e of resp.data.list) {
            dt.setTime(e.at*60000);
            e.at_s=date2str(dt);
            list.push(e);
        }
        this.contacts=list;
    })
},
showCntDlg(act,i) {
    if(act=='add') {
        this.contact.tag=this.tags.add;
        this.contact.cmt='';
        this.contact.at_s=date2str(new Date());
    } else {
        this.contact.tag=this.tags.modify;
        this.contact.cmt=this.contacts[i].cmt;
        this.contact.at_s=this.contacts[i].at_s;
    }
    this.contact.act=act;
    this.contact.dlg=true;
},
doContactAct(act) {
    var vPromize;
    var dta={uid:this.uid, cmt:this.contact.cmt};
    dta.at=parseInt(new Date(this.contact.at_s).getTime()/60000);
    if(act=='add') {
        vPromize = request({method:"POST",url:"/api/pool/addContact",data:dta}, this.service.name);
    } else if(act=='rmv') {
        vPromize = request({method:"DELETE",url:"/api/pool/removeContact?uid="+dta.uid+"&at="+dta.at}, this.service.name);
    } else {
        vPromize = request({method:"PUT",url:"/api/pool/updateContact",data:dta}, this.service.name);
    }
    vPromize.then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.contact.dlg=false;
        this.getContacts();
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header>
   <q-toolbar>
    <q-btn flat icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{tags.detail}}-{{skuInfo.name}}</q-toolbar-title>
    <q-btn icon="delete" @click="remove" flat></q-btn>
    <q-btn icon="edit" @click="showModify" v-show="ctrl.fun==''" flat></q-btn>
    <q-btn :label="tags.employee.join" @click="ctrl.entryDlg=true" v-if="skuInfo.state!='JOIN'" flat></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<div v-show="ctrl.fun==''">
 <q-list dense>
  <q-item>
   <q-item-section>{{tags.sku.name}}</q-item-section>
   <q-item-section>{{skuInfo.maxEdu_s}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pool.firstEdu}}</q-item-section>
   <q-item-section>{{skuInfo.firstEdu_s}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pub.quali}}</q-item-section>
   <q-item-section>{{skuInfo.quali}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pool.expSalary}}</q-item-section>
   <q-item-section>{{skuInfo.expSalary}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pub.phone}}</q-item-section>
   <q-item-section>{{skuInfo.phone}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pub.email}}</q-item-section>
   <q-item-section>{{skuInfo.email}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pub.birth}}</q-item-section>
   <q-item-section>{{skuInfo.birth_s}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pool.state}}</q-item-section>
   <q-item-section>{{skuInfo.state_s}}</q-item-section>
  </q-item>
  <q-item>
   <q-item-section>{{tags.pool.cmt}}</q-item-section>
   <q-item-section>{{skuInfo.cmt}}</q-item-section>
  </q-item>
 </q-list>
</div>
<div v-show="ctrl.fun=='modify'">
 <q-list dense>
  <q-item><q-item-section>
   <q-input v-model="ctrl.pi.name" :label="tags.pool.name" dense maxlength=80>
    <template v-slot:after>
     <q-radio v-model="ctrl.pi.sex" class="text-caption"
     v-for="(s,v) in tags.sex" :val="v" :label="s"></q-radio>
    </template>
   </q-input>
  </q-item-section></q-item>
  <q-item><q-item-section>
   <q-select v-model="ctrl.pi.maxEdu" :label="tags.pool.maxEdu"
    :options="opts.edu" emit-value dense map-options></q-select>
  </q-item-section></q-item>
  <q-item><q-item-section>
   <q-select v-model="ctrl.pi.firstEdu" :label="tags.pool.firstEdu"
    :options="opts.edu" emit-value dense map-options></q-select>
  </q-item-section></q-item>
  <q-item><q-item-section>
   <q-input v-model.number="ctrl.pi.quali" :label="tags.pub.quali" dense></q-input>
  </q-item-section></q-item>
  <q-item><q-item-section>
   <q-input v-model.number="ctrl.pi.expSalary" :label="tags.pool.expSalary" dense></q-input>
  </q-item-section></q-item>
  <q-item><q-item-section>
   <q-input v-model.number="ctrl.pi.phone" :label="tags.pool.phone" dense maxlength=90></q-input>
  </q-item-section></q-item>
  <q-item><q-item-section>
   <date-input v-model="ctrl.pi.birth_s" :label="tags.pool.birth"
    :close="tags.ok" max="today"></date-input>
  </q-item-section></q-item>
  <q-item v-if="ctrl.pi.state!='JOIN'">
   <q-item-section>
    <q-select v-model="ctrl.pi.state" :options="opts.state" emit-value
    :label="tags.pool.state" dense map-options></q-select>
   </q-item-section>
  </q-item>
  <q-item><q-item-section>
   <q-input v-model="ctrl.pi.email" :label="tags.pub.email" dense maxlength=80></q-input>
  </q-item-section></q-item>
  <q-item><q-item-section>
   <q-input v-model="ctrl.pi.cmt" :label="tags.pool.cmt" dense maxlength=500></q-input>
  </q-item-section></q-item>
 </q-list>
 <div class="text-right">
   <q-btn flat :label="tags.cancel" color="primary" @click="ctrl.fun=''"></q-btn>
   <q-btn icon="done" :label="tags.ok" color="primary" @click="modify"></q-btn>
 </div>
</div>

<q-separator inset></q-separator>
<q-banner inline-actions class="bg-indigo-1 q-ma-sm" dense>
  {{tags.pool.contact}}
  <template v-slot:action>
   <q-icon flat color="primary" name="add_circle" @click.stop="showCntDlg('add')"></q-icon>
  </template>
</q-banner>
<q-list dense>
  <q-item v-for="(c,i) in contacts" clickable @click="showCntDlg('edit',i)">
   <q-item-section>
    <q-item-label>{{c.cmt}}</q-item-label>
   </q-item-section>
   <q-item-section side>
    <q-item-label caption>{{c.at_s}}</q-item-label>
   </q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="contact.dlg" persistent>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{contact.tag}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <div v-if="contact.act=='edit'">{{contact.at_s}}</div>
     <date-input v-else :close="tags.ok" :label="tags.pool.at" v-model="contact.at_s" max="today"></date-input>
     <q-input v-model="contact.cmt" :label="tags.cmt" type="textarea"></q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.remove" color="red" v-if="contact.act!='add'"
       @click="doContactAct('rmv')" flat></q-btn>
      <q-space></q-space>
      <q-btn :label="tags.ok" color="primary" @click="doContactAct(contact.act)"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<q-dialog v-model="ctrl.entryDlg" persistent>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.employee.entry}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-list>
      <q-item><q-item-section>{{skuInfo.name}}</q-item-section></q-item>
      <q-item><q-item-section>{{skuInfo.phone}}</q-item-section></q-item>
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
      <q-btn :label="tags.ok" color="primary" @click="entry"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs"
 :close="tags.close" ref="errMsg"></alert-dialog>
`
}