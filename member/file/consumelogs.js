export default {
inject:['service', 'tags'],
data() {return {
    orderId:this.$route.query.orderId,
    logs:[],
    pkgName:'',
    vipName:'',
    creatorName:'',
    detailDlg:false,
    logDetail:{id:0,creator:0,createAt:'',val:0,comment:''}
}},
created(){
    var url="/api/order/getNames?id="+this.orderId;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.pkgName=resp.data.pkgName;
        this.vipName=resp.data.vipName;
    }.bind(this))
},

methods:{
query_logs(offset,done) {
    var start=(offset-1)*this.service.NUM_PER_PAGE;
    var url="/api/consume/list?offset="+start+"&num="+this.service.NUM_PER_PAGE+"&order="+this.orderId;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=RetCode.OK || !('data' in resp)
           || !('logs' in resp.data) || resp.data.logs.length==0) {
            done(true);
            return;
        }
        this.logs=this.logs.concat(resp.data.logs);
        done(resp.data.logs.length<this.service.NUM_PER_PAGE);
    }.bind(this))
},
get_creator(uid) {
    request({method:"GET",url:"/api/getNickName?uid="+uid},SERVICE_USER).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.creatorName=resp.data.nickName;
    }.bind(this));
},
detail(i){
    this.detailDlg=true;
    this.logDetail=this.logs[i];
    this.get_creator(this.logDetail.creator);
},
set_comment(){
    var url="/api/consume/setComment";
    var req={id:this.logDetail.id,comment:this.logDetail.comment};
    request({method:"POST",url:url,data:req}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.detailDlg=false;
    }.bind(this))
},
on_load_logs(offset,done){
    this.query_logs(offset,done);
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{vipName}}-{{pkgName}}</q-toolbar-title>
   </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-md">
<div id="logs_scroll_area">
 <q-infinite-scroll @load="on_load_logs" :offset="250" scroll-target="#logs_scroll_area">
  <q-list>
   <q-item v-for="(l,i) in logs">
    <q-item-section>{{l.createAt}}</q-item-section>
    <q-item-section>{{l.val}}</q-item-section>
    <q-item-section>{{l.comment}}</q-item-section>
    <q-item-section><q-icon name="edit" @click="detail(i)" color="primary"></q-icon></q-item-section>
   </q-item>
  </q-list>
  <template v-slot:loading>
    <div class="row justify-center q-my-md">
      <q-spinner-dots color="primary" size="40px"></q-spinner-dots>
    </div>
  </template>
 </q-infinite-scroll>
</div><!-- end of #logs_scroll_area -->
        </q-page>
      </q-page-container>
    </q-layout>

<q-dialog v-model="detailDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
      <div class="text-h6">{{tags.detailInfo}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-list>
    <q-item>
     <q-item-section>{{tags.creator}}</q-item-section>
     <q-item-section>{{creatorName}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.createAt}}</q-item-section>
     <q-item-section>{{logDetail.createAt}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.consumeVal}}</q-item-section>
     <q-item-section>{{logDetail.val}}</q-item-section>
    </q-item>
    <q-item>
     <q-item-section>{{tags.comment}}</q-item-section>
     <q-item-section><q-input v-model="logDetail.comment" dense
     type="textarea" autogrow></q-input></q-item-section>
    </q-item>
   </q-list>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn flat :label="tags.ok" color="primary" @click="set_comment"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}