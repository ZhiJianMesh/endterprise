const EMPTY_ZONE={subsidy:'',salary:'',fowSalary:'',oowSalary:'',wowSalary:'',timeOff:480,name:'',cmt:'',
    taxFunc:'if(s<5000)return 0;\nif(s>5000&&s<=36000)return 0.03*(s-5000);\nreturn 930+(s-36000)*0.1;'};
export default {
inject:['service', 'tags'],
data() {return {
    zones:[],
    edt:{zone:{}},
    ctrl:{no:-2,tag:'',zoneDlg:false}
}},
created(){
    this.query_zones();
},
methods:{
query_zones(){//查询区域
    var opts={method:"GET", url:"/config/queryZone"}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        this.zones=resp.data.list;
    })  
},
show_zone(i) {
    if(i>-1) {
        this.ctrl.tag=this.tags.modify;
        this.edt.zone.id=this.zones[i].id;
        copyObjTo(this.zones[i], this.edt.zone);
    } else {
        this.ctrl.tag=this.tags.add;
        copyObjTo(EMPTY_ZONE, this.edt.zone);
    }
    this.ctrl.tag+=this.tags.cfg.zone;
    this.ctrl.no=i;
    this.ctrl.zoneDlg=true;
},
zone_do() {
    var opts;
    if(this.ctrl.no>-1) {
        opts={method:"PUT",url:"/config/updateZone",data:this.edt.zone};
    } else {
        opts={method:"POST",url:"/config/addZone",data:this.edt.zone};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(this.ctrl.no>-1) {
            copyObjTo(this.edt.zone, this.zones[this.ctrl.no]);
        } else {
            var zone = {id:resp.data.id};
            copyObjTo(this.edt.zone, zone);
            this.zones.push(zone);
        }
        this.ctrl.no=-2;
        this.ctrl.zoneDlg=false;
    });
},
remove_perf(i) {
    var opts={method:"DELETE",url:"/config/removeZone?id="+this.zones[i].id};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.zones.splice(i,1);
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
     <q-btn flat round icon="arrow_back" dense @click="service.back()"></q-btn>
     <q-toolbar-title>{{tags.cfg.zone}}</q-toolbar-title>
     <q-btn icon="add_circle" @click="show_zone(-1)" flat dense></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-none">
<q-list>
 <q-item v-for="(z,i) in zones">
  <q-item-section>
   <q-item-label>{{z.name}}</q-item-label>
   <q-item-label>{{tags.cfg.timeOff}}:{{z.timeOff}}</q-item-label>
   <q-item-label caption>{{z.cmt}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label caption>{{tags.cfg.salary}}:{{z.salary}}</q-item-label>
   <q-item-label caption>{{tags.cfg.wowSalary}}:{{z.wowSalary}}<q-item-label>
   <q-item-label caption>{{tags.cfg.oowSalary}}:{{z.oowSalary}}<q-item-label>
   <q-item-label caption>{{tags.cfg.fowSalary}}:{{z.fowSalary}}<q-item-label>
   <q-item-label caption>{{tags.cfg.subsidy}}:{{z.subsidy}}</q-item-label>
  </q-item-section>
  <q-menu touch-position context-menu>
    <q-list dense style="min-width:100px">
      <q-item clickable v-close-popup @click="show_zone(i)">
        <q-item-section avatar><q-icon name="edit" color="primary"></q-icon></q-item-section>
        <q-item-section>{{tags.modify}}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="remove_zone(i)">
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

<q-dialog v-model="ctrl.zoneDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{ctrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input :label="tags.name" v-model="edt.zone.name" dense></q-input>
   <q-input :label="tags.cfg.salary" v-model.number="edt.zone.salary" dense></q-input>
   <q-input :label="tags.cfg.wowSalary" v-model.number="edt.zone.wowSalary" dense></q-input>
   <q-input :label="tags.cfg.oowSalary" v-model.number="edt.zone.oowSalary" dense></q-input>
   <q-input :label="tags.cfg.fowSalary" v-model.number="edt.zone.fowSalary" dense></q-input>
   <q-input :label="tags.cfg.subsidy" v-model.number="edt.zone.subsidy" dense></q-input>
   <q-input :label="tags.cfg.timeOff" v-model.number="edt.zone.timeOff" dense></q-input>
   <q-input :label="tags.cfg.taxFunc" v-model="edt.zone.taxFunc" dense type="textarea"></q-input>
   <q-input :label="tags.cmt" v-model="edt.zone.cmt" dense type="textarea"></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="zone_do"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
`
}