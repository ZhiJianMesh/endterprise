import AlertDialog from "/assets/v3/components/alert_dialog.js"

export default {
inject:["ibf"],
components:{
    "alert_dlg" : AlertDialog
},
data() {return {
    pid:this.$route.query.id,
    prj:{}, //项目详情
    editable:false, //项目是否可编辑
    isLeader:false,
    tags:this.ibf.tags,
    tab:'worktime', //worktime,busi
    wt:{list:[],month:'-1m',cur:1,max:0,dlg:false,no:-1}, //按月查询工时申请
    busi:{list:[],cur:1,max:0}
}},
created(){
    request({method:'GET',url:'/project/detail?id='+this.pid}, this.ibf.SERVICE_PRJ).then(resp => {
        if(resp.code!=RetCode.OK) {
            return;
        }
        this.prj=resp.data;
        var dt=new Date();
        dt.setTime(this.prj.start*60000);
        this.prj.start_s=date2str(dt); //用于输入计划时限制时间范围
        dt.setTime(this.prj.end*60000);
        this.prj.end_s=date2str(dt);
        this.isLeader=this.prj.role=='L';
        this.editable=this.isLeader&&this.prj.stage==this.ibf.PrjStage.init;
        this.query_wts(1);
    })
},
methods:{
tab_changed(tab) {
    if(tab=='worktime'){
        this.showAdd=false;
        if(this.wt.list.length==0) {
            this.query_wts(this.wt.cur);
        }
    } else {
        if(this.busi.list.length==0) {
            this.query_busi(this.busi.cur);
        }
    }
},
query_busi(pg) {
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var opts={method:"GET", url:"/business/listbypid?pid="
        +this.pid+"&offset="+offset+'&num='+this.ibf.N_PAGE}
    request(opts, this.ibf.SERVICE_BUSINESS).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.busi.list=[];
            this.busi.max=0;
            this.busi.cur=1;
            return;
        }
        //id,prjName,flowid,status,start,end,
        //expense,subsidy,dest,account,reason
        var dt=new Date();
        var busi=[];
        for(var l of resp.data.list) {
            var b={};
            var i=0;
            for(var c of resp.data.cols) {
                b[c]=l[i++];
            }
            dt.setTime(b.start*60000);
            b.start_s=date2str(dt);
            dt.setTime(b.end*60000);
            b.end_s=date2str(dt);
            busi.push(b);
        }
        this.busi.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
        this.busi.list=busi;
    })
},
busi_flow(i) {
    var busi = this.busi.list[i];
    
    var url='/ibf/workflow?flow='+busi.flowid+"&did="+busi.id
        +"&flName=busi&service="+this.ibf.SERVICE_BUSINESS+"&step="+busi.status
        +"&dtlApi=" + encodeURI('/business/detail')
        +"&dtlPage=" + encodeURI('/ibf/busidtl');
    this.ibf.goto(url);
},
query_wts(pg) {
    if(!this.wt.month.num)return;//第一次切换到此tab，month还没准备好
    var offset=(parseInt(pg)-1)*this.ibf.N_PAGE;
    var url="/tasktime/wait?pid="+this.pid
            +"&offset="+offset+'&num='+this.ibf.N_PAGE
            +"&month="+this.wt.month.num
    request({method:"GET", url:url}, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.wt.list=[];
            this.wt.max=0;
            return;
        }
        this.wt.list=resp.data.list.map(l=>{
            l.state_s=this.tags.aplSta[l.state];
            return l;
        });
        this.wt.max=Math.ceil(resp.data.total/this.ibf.N_PAGE);
    })
},
month_changed() {
    this.wt.cur=1;
    this.query_wts(1);
},
show_wt(no) {
    this.wt.no=no;
    this.wt.dlg=true;
},
wt_do(state) {
    if(this.wt.no<0)return;
    var uid=this.wt.list[this.wt.no].uid;
    var dta={pid:this.pid,uid:uid,month:this.wt.month.num,state:state};
    request({method:'POST',url:'/tasktime/confirm', data:dta}, this.ibf.SERVICE_HR).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.query_wts(this.wt.cur);
        this.wt.no=-1;
        this.wt.dlg=false;
    });
}
},
template:`
<q-layout view="hhh lpr fff" container style="height:99.9vh">
  <q-header>
   <q-toolbar>
     <q-btn flat round icon="arrow_back" dense @click="ibf.back()"></q-btn>
     <q-toolbar-title>{{tags.prj.title}}-{{prj.name}}</q-toolbar-title>
     <month-input v-model="wt.month" v-if="tab=='worktime'"
      @update:modelValue="month_changed" min="-3" max="-1m"></month-input>
     <q-btn flat round icon="add_circle" dense @click="show_add()" v-show="showAdd"></q-btn>
   </q-toolbar>
  </q-header>
  <q-footer>
   <q-tabs v-model="tab" @update:model-value="tab_changed"
    dense align="justify" switch-indicator inline-label
    class="text-grey bg-grey-3" active-color="primary" indicator-color="primary">
    <q-tab name="worktime" icon="work_history" :label="tags.prj.worktime"></q-tab>
    <q-tab name="busi" icon="business" :label="tags.busi.title"></q-tab>
   </q-tabs>
  </q-footer>
  <q-page-container>
    <q-page class="q-pa-none">
<q-tab-panels v-model="tab">

<q-tab-panel name="busi">
 <q-list dense separator>
  <q-item v-for="(b,i) in busi.list" @click="busi_flow(i)" clickable>
   <q-item-section>
    <q-item-label>{{b.account}}</q-item-label>
    <q-item-label caption>{{b.dest}}</q-item-label>
   </q-item-section>
   <q-item-section>
    <q-item-label>{{b.reason}}</q-item-label>
    <q-item-label caption>{{b.start_s}}-&gt;{{b.end_s}}</q-item-label>
   </q-item-section>
   <q-item-section side>
    <q-item-label>{{tags.busi.expense}}:{{b.expense}}</q-item-label>
    <q-item-label>{{tags.busi.subsidy}}:{{b.subsidy}}</q-item-label>
   </q-item-section>
  </q-item>
 </q-list>
 <div class="q-pa-sm flex flex-center" v-show="busi.max>1">
  <q-pagination v-model="busi.cur" color="primary" :max="busi.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_busi"></q-pagination>
 </div>
</q-tab-panel>

<q-tab-panel name="worktime">
 <q-list dense separator>
  <q-item v-for="(l,i) in wt.list" @click="show_wt(i)" clickable>
   <q-item-section>{{l.account}}</q-item-section>
   <q-item-section>
    <q-item-label>{{l.ratio}}%({{l.state_s}})</q-item-label>
    <q-item-label caption>{{l.cmt}}</q-item-label>
   </q-item-section>
  </q-item>
 </q-list>
 <div class="q-pa-sm flex flex-center" v-show="wt.max>1">
  <q-pagination v-model="wt.cur" color="primary" :max="wt.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_wts"></q-pagination>
 </div>
</q-tab-panel>

</q-tab-panels>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="wt.dlg" position="right">
<q-card style="width:6em;">
 <q-card-section class="text-center">
  <div class="q-pb-lg">
   <q-btn icon="thumb_up" :label="Stacked" stack flat color="primary"
   @click="wt_do('OK')"></q-btn>
  </div>
  <div>
   <q-btn icon="thumb_down" :label="Stacked" stack flat color="red"
   @click="wt_do('REJ')"></q-btn>
  </div>
 </q-card-section>
</q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="alertDlg"></alert-dialog>
`
}