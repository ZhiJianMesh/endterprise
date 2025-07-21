export default {
data() {return {
    id:0,
    ctrl:{dlg:false,cmt:'',level:0},
    dtl:{},
    cmts:[]
}},
emits: ['done'],
props: {
    role:{type:String,required:true},
    service:{type:String,required:true},
    tags:{type:Object,required:true},
    alertDlg:{type:Object,required:true},
    confirmDlg:{type:Object,required:true}
},
methods:{
show(id) {
    this.id=id;
    var url="/api/service/get?id="+id
    request({method:"GET",url:url}, this.service).then(resp=>{
        if(resp.code != 0) {
            this.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        var dt=new Date();
        var dtl=resp.data;
        if(dtl.start>0) {
            dtl.interval=dtl.end>0?(dtl.end-dtl.start):(parseInt(dt.getTime()/60000)-dtl.start);
        } else {
            dtl.interval=0;
        }
        dt.setTime(dtl.createAt*60000);
        dtl.createAt=datetime2str(dt);
        dtl.state_s=this.tags.osState[dtl.state];
        if(dtl.start<=0) {
            dtl.start_s=this.tags.service.notStart;
        } else {
            dt.setTime(dtl.start*60000);
            dtl.start_s=datetime2str(dt);
        }
        if(dtl.end<=0) {
            dtl.end_s=this.tags.service.notEnd;
        } else {
            dt.setTime(dtl.end*60000);
            dtl.end_s=datetime2str(dt);
        }
        this.dtl=dtl;
        this.ctrl.dlg=true;
    });
},
confirm() {
    this.confirmDlg.show(this.tags.cfmServiceAlert, ()=>{
        var url="/api/service/confirm"
        request({method:"PUT",url:url, data:{id:this.id}}, this.service).then(resp=>{
            if(resp.code != 0) {
                this.alertDlg.showErr(resp.code, resp.info);
                return;
            }
            this.$emit('done', {act:'cfm'});
            this.ctrl.dlg=false;
        })
    })
},
remove() {
    this.confirmDlg.show(this.tags.rmvServiceAlert, ()=>{
        var url="/api/service/remove?id="+this.id;
        request({method:"DELETE", url:url}, this.service).then(resp=>{
            if(resp.code != 0) {
                this.alertDlg.showErr(resp.code, resp.info);
                return;
            }
            this.$emit('done', {act:'rmv'});
            this.ctrl.dlg=false;
        })
    })
},
add_cmt() {
    var url="/api/service/addComment";
    var dta={service:this.id,cmt:this.ctrl.cmt,level:this.ctrl.level};
    request({method:"POST",url:url,data:dta}, this.service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.ctrl.cmt='';
        this.query_cmts();
    })
},
rmv_cmt(at) {
    var url="/api/service/rmvComment?service="+this.id+"&at="+at;
    request({method:"DELETE",url:url}, this.service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.alertDlg.showErr(resp.code, resp.info);
            return;
        }
        this.query_cmts();
    })
},
query_cmts() {
    var url="/service/comments?service="+this.id;
    request({method:"GET", url:url}, this.service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.cmts=[];
            return;
        }
        var dt=new Date();
        this.cmts=resp.data.list.map(c=>{
            dt.setTime(c.at);
            c.at_s=datetime2str(dt);
            return c;
        })
    })
},
expend_cmts() {
    if(this.cmts.length>0) return;
    this.query_cmts();
}
},
template: `
<q-dialog v-model="ctrl.dlg">
<q-card style="min-width:70vw;max-width:90vw">
<q-card-section class="row items-center q-pb-none">
  <div class="text-h6">{{dtl.name}}/{{dtl.code}}</div>
  <q-space></q-space>
  <q-btn icon="close" flat round dense v-close-popup></q-btn>
</q-card-section>
<q-card-section>
 <q-markup-table style="width:100%;" flat>
  <tr><td>{{tags.creator}}</td><td>{{dtl.creator}}</td></tr>
  <tr><td>{{tags.createAt}}</td><td>{{dtl.createAt}}</td></tr>
  <tr><td>{{tags.service.state}}</td><td :class="dtl.state=='OK'?'':'text-primary'">{{dtl.state_s}}</td></tr>
  <tr><td>{{tags.service.val}}</td><td>{{dtl.val}}</td></tr>
  <tr><td>{{tags.vip.total}}</td><td>{{dtl.total}}</td></tr>
  <tr><td>{{tags.vip.balance}}</td><td>{{dtl.balance}}</td></tr>
  <tr><td>{{tags.service.start}}</td><td>{{dtl.start}}</td></tr>
  <tr><td>{{tags.service.end}}</td><td>{{dtl.end}}</td></tr>
  <tr><td>{{tags.service.useTime}}</td><td>{{dtl.interval}} {{tags.service.unit}}</td></tr>
  <tr><td>{{tags.cmt}}</td><td>{{dtl.cmt}}</td></tr>
 </q-markup-table>
 <q-expansion-item dense dense-toggle expand-separator icon="comment"
  :label="tags.service.cmt" @before-show="expend_cmts"
  header-class="text-primary">
 <q-markup-table style="width:100%;" flat>
  <tr v-for="c in cmts">
   <td>{{c.at_s}}</td>
   <td>
    <div class="text-caption">{{c.cmt}}</div>
    <q-rating v-model="c.level" size="1em" color="orange" readonly></q-rating>
   </td>
   <td class="text-right">
    <q-btn color="red" icon="cancel" @click="rmv_cmt(c.at)" flat dense></q-btn>
   </td>
  </tr>
 </q-markup-table>
 <q-input v-model="ctrl.cmt" dense :label="tags.service.cmt">
  <template v-slot:after>
   <q-rating v-model="ctrl.level" color="orange" :max="5"></q-rating>
   <q-btn color="primary" icon="add_circle" @click="add_cmt" flat></q-btn>
  </template>
 </q-input>
 </q-expansion-item>
</q-card-section>

<q-card-actions class="row">
 <div class="col text-left">
  <q-btn flat v-if="role=='admin'&&dtl.state=='WAIT'"
   :label="tags.remove" color="red" @click="remove()"></q-btn>
 </div>
 <div class="col text-right q-gutter-sm">
  <q-btn v-if="dtl.state=='WAIT'&&dtl.end>0" dense color="primary"
   :label="tags.confirm" @click="confirm()"></q-btn>
  <q-btn :label="tags.close" flat dense v-close-popup></q-btn>
 </div>
</q-card-actions>
</q-card>
</q-dialog>
`
}