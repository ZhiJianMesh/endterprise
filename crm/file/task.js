export default {
inject:['service', 'tags', 'icons'],
data() {return {
    flowid:this.$route.query.flow,
    did:this.$route.query.did,
    flName:this.$route.query.flName, //customer客户、order订单、service服务、payment回款
    flow:{},//流程定义信息{name,maxStep,steps}
    base:{creator:'',createAt:0,step:0},
    dtl:{}, //数据详情
    steps:[],
    opinion:'',//处理意见
    nextSigners:[],//下一步处理人
    allProced:true,
    oIcons:{P:'thumb_up',R:'thumb_down'}
}},
created(){
    //此处有约定:1)type为customer、order、payment、service等；
    // 2）languages中必须由对应名称的tag集合；
    // 3)必须由对应的detail接口，并且接口中响应中segs字段指定了要显示的字段名；
    var dtlUrl="/api/"+this.flName+"/detail";
    var segNames=this.tags[this.flName];
    request({method:"GET",url:dtlUrl+"?id="+this.did}, this.service.name).then(function(resp){
        if(resp.code!=RetCode.OK) {
            this.removeWf(this.did, this.flName)
            return;
        }
        var dtl=[];
        resp.data.segs.forEach(function(s) {
            if(s!='createAt') {
                dtl.push({k:segNames[s], v:resp.data[s]});
            } else {
                dtl.push({k:segNames[s], v:new Date(parseInt(resp.data[s])).toLocaleString()});
            }
        });
        this.dtl=dtl;
    }.bind(this));
    
    this.service.flowDef(this.flowid).then(function(sd){
        this.flow=sd;
        this.query_opinions();
    }.bind(this));
},
methods:{
query_opinions() {
    this.opinion='';
    this.nextSigners=[];
    var url="/api/opinions?flowid="+this.flowid+"&did="+this.did;
    request({method:"GET",url:url}, this.service.WF).then(function(resp){
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date(resp.data.update_time);
        var curStep=resp.data.step;
        this.base.step=curStep; //待处理的步骤
        this.base.creator=resp.data.creator;
        this.base.createAt=dt.toLocaleString();
        var signer=resp.data.signer;//当前查看人

        var steps=[]; //预填充步骤的数据
        this.flow.steps.forEach(function(o){
            steps[o.step]={step:o.step,title:o.title,
                type:o.type/*类型：O-ne单签，M-ulti会签*/,
                t:0/*时间戳*/, ts:''/*时间*/,
                list:[]/*当前步骤的意见列表*/,
                olist:[]/*其他人的意见*/};
        });
        
        var cols=resp.data.cols;
        var s, opt, ts;
        var allProced=true;
        var opts=resp.data.opinions;//step,opinion,result,type,signer,turn,update_time
        for(var i=0;i<opts.length;i++) {
            opt=opts[i];
            var o={};
            var j=0;
            for(var c in cols) {
                o[cols[c]]=opt[j++];
            }
            dt.setTime(o.update_time);
            ts=dt.toLocaleString();
            s=steps[o.step];
            if(!s){
                continue;
            }
            if(s.t<o.update_time){//标题上只显示最后一次时间
                s.t=o.update_time;
                s.ts=ts;
            }
            
            if(o.signer==signer) {//当前处理人的意见
                s.list.push({signer:o.signer,time:ts,opinion:o.opinion,
                result:o.result,turn:o.turn,type:o.type,step:o.step});
            } else {
                s.olist.push({signer:o.signer,time:ts,
                opinion:o.result=='I'?this.tags.unHandled:o.opinion,
                result:o.result,turn:o.turn,type:o.type,step:o.step});
                if(curStep==o.step && s.type=='M') {//会签中，所有从签人都处理完毕才能向下走
                    if(o.result=='I') {
                        allProced=false;
                    }
                }
            }            
        }
        this.allProced=allProced;
        this.steps=steps;
    }.bind(this));
},
confirm() {
    if(this.base.step>this.flow.maxStep) {
        this.$refs.errMsg.show(this.tags.wrongWfDef);
        return;
    }
    var url="/api/confirm";
    var data={flowid:this.flowid, did:this.did,
        opinion:this.opinion, nextSigners:this.nextSigners};
    request({method:"POST",url:url,data:data}, this.service.WF).then(function(resp){
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.base.step=resp.data.nextStep;
        this.query_opinions();
    }.bind(this));
},
counterSign(agree) {
    var url="/api/counterSign";
    var data={flowid:this.flowid, did:this.did,
        opinion:this.opinion, result:agree?'P':'R'};
    request({method:"POST",url:url,data:data}, this.service.WF).then(function(resp){
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_opinions();
    }.bind(this));
},
reject() {
    if(this.base.step<=0) {
        return;
    }
    var url="/api/reject";
    var data={flowid:this.flowid, did:this.did, opinion:this.opinion};
    request({method:"POST",url:url, data:data}, this.service.WF).then(function(resp){
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.base.step=resp.data.foreStep;
        this.query_opinions();
    }.bind(this));
},
removeWf() { //工作流数据错乱的情况下，删除工作流记录
    var url="/api/"+this.flName+"/exists?id="+this.did;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(resp.data.num > 0) {
            reutrn;
        }
        this.$refs.confirmDlg.show(this.tags.wrongFlowState, function(){
            var dta={flowid:this.flowid, did:this.did};
            var opts={method:"POST",url:"/api/proxy/removeBrokenWf",data:dta};
            request(opts, this.service.WF).then(function(resp){
                if(resp.code!=RetCode.OK) {
                    this.$refs.errMsg.showErr(resp.code, resp.info);
                }else{
                    this.service.go_back();
                }
            }.bind(this))
        }.bind(this));
    }.bind(this));
},
showDtl() {
    this.service.jumpTo('/'+this.flName+'?id='+this.did)    
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
    <q-toolbar-title>{{flow.name}}</q-toolbar-title>
    <q-avatar :icon="icons[flName]" color="primary" size="2em" @click="showDtl"></q-avatar>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list dense>
  <q-item v-for="d in dtl" dense>
    <q-item-section>{{d.k}}</q-item-section>
    <q-item-section>{{d.v}}</q-item-section>
  </q-item>
</q-list>
<q-separator color="primary" inset></q-separator>
<q-timeline color="secondary">
<q-timeline-entry v-for="s in steps" :title="s.title" :subtitle="s.ts"
 :color="s.step==base.step?'orange':'primary'">
 <q-list dense>
  <q-item v-for="o in s.list">
   <q-item-section>
    <q-item-label>{{o.signer}}</q-item-label>
    <q-item-label caption>
     <div v-if="o.result=='I' && o.step==base.step">
       <q-input v-model="opinion" :label="tags.flow.opinion" outlined dense maxlength=100></q-input>
       <div v-if="o.type!='S'">
        <component-user-selecter :label="tags.signers" :multi="s.type=='M'"
         v-model="nextSigners" v-if="s.step!=flow.maxStep"></component-user-selecter>
        <div class="row justify-end q-mt-lg">
         <q-btn @click="confirm" color="primary" :disable="!allProced"
          :label="s.step!=flow.maxStep?tags.flow.nextStep:tags.flow.finish" dense></q-btn>
         <q-btn v-if="base.step>0" flat @click="reject" color="primary" :label="tags.flow.reject" class="q-ml-sm" dense></q-btn>
        </div>
       </div>
       <div v-else class="row justify-end q-mt-lg">
        <q-btn @click="counterSign(true)" color="primary" :label="tags.flow.agree" dense></q-btn>
        <q-btn flat @click="counterSign(false)" color="primary" :label="tags.flow.disAgree" class="q-ml-sm" dense></q-btn>
       </div>
     </div>
     <div v-else> <!-- o.result!='I' -->
       {{o.opinion}}
     </div>
    </q-item-label>
   </q-item-section>
   <q-item-section side v-if="o.result!='I'">
      <q-item-label caption>{{o.time}}</q-item-label>
      <q-icon :name="oIcons[o.result]" :color="o.result=='P'?'primary':'red'"></q-icon>
   </q-item-section>
  </q-item>
  <!-- 会签时，其他人的意见 -->
  <q-item v-for="o in s.olist">
   <q-item-section>
    <q-item-label>{{o.signer}}</q-item-label>
    <q-item-label caption>
     <div>{{o.opinion}}</div>
    </q-item-label>
   </q-item-section>
   <q-item-section side v-if="o.result!='I'">
      <q-item-label caption>{{o.time}}</q-item-label>
      <q-icon :name="oIcons[o.result]" :color="o.result=='P'?'primary':'red'"></q-icon>
   </q-item-section>
  </q-item>
 </q-list>
</q-timeline-entry>
</q-timeline>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
<component-confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></component-confirm-dialog>
`
}