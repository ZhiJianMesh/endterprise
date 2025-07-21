import ServiceDlg from "./servicedlg.js"

export default {
components:{
    "service-dlg":ServiceDlg
},
inject:['service', 'tags'],
data() {return {
    state:'ALL',
    stateOpts:[],
    role:'',
    services:[], //服务单列表
    ctrl:{cur:1,max:0,onlyMine:false},
    score:{nService:0,vService:0,vBrokerage:0,total:0},
    alertDlg:null,
    confirmDlg:null
}},
created(){
    var oss=this.tags.osState;
    this.stateOpts=[
        {label:oss.ALL, value:'ALL'},
        {label:oss.OK, value:'OK'},
        {label:oss.WAIT, value:'WAIT'}
    ];
    this.service.getRole().then(role=>{
        this.role=role;
        this.query(1);
    })
},
mounted(){//不能在created中赋值，更不能在data中
    this.alertDlg=this.$refs.errMsg;
    this.confirmDlg=this.$refs.confirmDlg;
},
methods:{
query(pg) {
    var offset=(parseInt(pg)-1)*this.service.NUM_PER_PAGE;
    var url=this.role=='admin'&&!this.ctrl.onlyMine?"/service/listAll":"/service/my";
    url+="?offset="+offset+"&num="+this.service.NUM_PER_PAGE+"&state="+this.state;
    request({method:"GET",url:url}, this.service.name).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.services=[];
            this.ctrl.max=0;
        } else {
            this.score.total=resp.data.total;
            this.score.nService=resp.data.nService;
            this.score.vService=resp.data.vService;
            this.score.vBrokerage=resp.data.vBrokerage;
            this.formatData(resp.data.list, resp.data.cols);
            this.ctrl.max=Math.ceil(resp.data.total/this.service.NUM_PER_PAGE);
        }
    })
},
formatData(rows,cols) {
    var dt=new Date();
    var now=parseInt(dt.getTime()/60000);
    this.services=rows.map(l=>{
        var r={};
        for(var i in cols) {
            r[cols[i]]=l[i];
        }
        dt.setTime(r.createAt*60000);
        r.createAt=datetime2str(dt);
        
        if(r.end>r.start) r.interval=r.end-r.start;
        else r.interval=r.start>0?(now-r.start):0;
        r.interval+=' '+this.tags.service.unit;

        if(r.start<=0) {
            r.start=this.tags.service.notStart;
        } else {
            dt.setTime(r.start*60000);
            r.start=datetime2str(dt);
        }
        if(r.end<=0) {
            r.end=this.tags.service.notEnd;
        } else {
            dt.setTime(r.end*60000);
            r.end=datetime2str(dt);
        }
        r.state_s=this.tags.osState[r.state];
        return r;
    })
},
show_service(id) {
    this.$refs.serviceDlg.show(id);
},
service_done() {
    this.query(this.ctrl.cur);
}
},

template:`
<q-layout view="hHh lpr fFf">
  <q-header class="bg-grey-1 text-primary">
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{tags.service.title}}</q-toolbar-title>
    <q-btn flat round dense icon="menu"><q-menu>
     <div v-if="role=='admin'">
      <q-checkbox v-model="ctrl.onlyMine" :label="tags.onlyMine"
       @update:model-value="query(1)"></q-checkbox>
      <q-separator></q-separator>
     </div>
     <q-option-group :options="stateOpts" type="radio" v-model="state"
      @update:model-value="query(1)" style="min-width:10em"></q-option-group>
    </q-menu></q-btn>
   </q-toolbar>
   <q-card class="q-mx-sm" flat>
    <q-card-action>
    <q-markup-table flat dark style="background:radial-gradient(circle,#33a2ff 0%,#014aaa 100%)">
     <tr>
      <th>{{tags.score.total}}</th>
      <th>{{tags.score.nService}}</th>
      <th>{{tags.score.vService}}</th>
      <th>{{tags.score.vBrokerage}}</th>
     </tr>
     <tr>
      <td class="text-h6 text-center">{{score.total}}</td>
      <td class="text-h6 text-center">{{score.nService}}</td>
      <td class="text-h6 text-center">{{score.vService}}</td>
      <td class="text-h6 text-center">{{score.vBrokerage}}</td>
     </tr>
    </q-markup-table>
    </q-card-section>
   </q-card>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-md">

<div class="q-pa-lg flex flex-center" v-if="ctrl.max>1">
 <q-pagination v-model="ctrl.cur" color="primary" :max="ctrl.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query"></q-pagination>
</div>
<q-markup-table flat>
 <thead><tr>
  <th class="text-left">{{tags.vip.name}}</th>
  <th class="text-right">{{tags.service.start}}/{{tags.service.end}}</th>
  <th class="text-right">{{tags.creator}}/{{tags.supplier}}</th>
  <th class="text-right">{{tags.service.val}}</th>
 </tr></thead>
 <tbody>
 <tr v-for="v in services" style="cursor:pointer;" @click="show_service(v.id)">
  <td class="text-left">
   <div>{{v.name}}</div>
   <div class="text-caption">{{v.code}}</div>
  </td>
  <td class="text-right">
   <div>{{v.start}}</div>
   <div>{{v.end}}</div>
   <div class="text-caption">{{v.interval}}</div>
  </td>
  <td class="text-right">
   <div>{{v.creator}}/{{v.supplier}}</div>
   <div class="text-caption">{{v.createAt}}</div>
  </td>
  <td class="text-right">
   <div>{{v.val}}</div>
   <div :class="v.state=='OK'?'text-caption':'text-primary'">{{v.state_s}}</div>
  </td>
 </tr>
 </tbody>
</q-markup-table>
    </q-page>
  </q-page-container>
</q-layout>

<service-dlg :tags="tags" :alertDlg="alertDlg" :confirmDlg="confirmDlg" :role="role" :service="service.name" @done="service_done" ref="serviceDlg"></service-dlg>
<component-confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></component-confirm-dialog>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" ref="errMsg"></component-alert-dialog>
`
}