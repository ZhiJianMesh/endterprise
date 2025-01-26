import ConfirmDialog from "/assets/v3/components/confirm_dialog.js";
import AlertDialog from "/assets/v3/components/alert_dialog.js";
import UserSelector from "/assets/v3/components/user_selector.js"
import Language from "./language.js"
const l=Platform.language();
const tags = l.indexOf("zh") == 0 ? Language.cn : Language.en;
const WF="workflow";
const Workflow={
    flowInfos:{},
    SERVICE_WF:"workflow",
    flowDefs(ids){
        var fids='';
        for(var id of ids){
            if(this.flowInfos[id]) continue;
            if(fids!='')fids+=',';
            fids+=id;
        }
        var url="/api/flow/infos?flowids="+fids
        return request({method:"GET",url:url}, this.SERVICE_WF).then(resp=>{
            if(resp.code!=0) {
                return false;
            }
            //flows:{flow,name,dispName,cmt,callback}
            //steps:{flow,step,type,name,ext,cmt}
            resp.data.flows.forEach(f=>{
                var sd={name:f.dispName,maxStep:0,steps:[]};
                this.flowInfos[f.id]=sd;
            });
            resp.data.steps.forEach(s=> {
                var sd=this.flowInfos[s.flow];
                sd.steps[s.step]={step:s.step,type:s.type,title:s.name+'('+s.cmt+')',ext:s.ext,comment:s.cmt};
                if(s.step>sd.maxStep){
                    sd.maxStep=s.step;
                }
            });
            return true;
        });
    },
    flowDef(id,refresh){//不能用箭头函数，否则不能用this，箭头函数的this是在运行时所在的对象
        if(!refresh && this.flowInfos[id]) {
            return new Promise(resolve=>{resolve(this.flowInfos[id])});
        }
        return this.flowsDef([id]).then(r=>{
            return r ? this.flowInfos[id] : {};
        });
    },
    getFlowDef(id) {
        return this.flowInfos[id];
    }
}
export {Workflow};

export default {
components:{
    "alert-dialog":AlertDialog,
    "confirm-dialog":ConfirmDialog,
    "user-selector":UserSelector
},
data() {return {
    tags:tags,
    service:this.$route.query.service,
    flowid:this.$route.query.flow,
    did:this.$route.query.did,
    flName:this.$route.query.flName,
    rmvBroken:this.$route.query.rmvBroken,
    dtlApi:this.$route.query.dtlApi,
    dtlPage:this.$route.query.dtlPage,
    tags:this.ibf.tags,
    flow:{},//流程定义信息{name,maxStep,steps}
    base:{creator:'',createAt:0,step:0},
    dtl:{}, //数据详情
    steps:[],
    opinion:'',//处理意见
    nextSigners:[],//下一步处理人
    allDone:true,
    oIcons:{P:'thumb_up',R:'thumb_down'}
}},
created(){
    //此处有约定:1)type为customer、order、payment、service等；
    // 2）languages中必须由对应名称的tag集合；
    // 3)必须由对应的detail接口，并且接口中响应中segs字段指定了要显示的字段名；
    var dtlUrl=this.dtlApi
        +(this.dtlApi.indexOf('?')>0?'&':'?')
        +"id="+this.did;
    var segNames=this.tags[this.flName]['wfSegs'];
    request({method:"GET",url:dtlUrl}, this.service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dtl=[];
        var dt=new Date();
        segNames.forEach(s => {
            var v;
            if(s.t=='dt') {
                dt.setTime(resp.data[s.n]);
                v=datetime2str(dt);
            } else if(s.t=='d') {
                dt.setTime(resp.data[s.n]);
                v=date2str(dt);
            } else {/*(s.t=='s'||s.t=='n')*/
                v=resp.data[s.n];
            }
            dtl.push({k:s.s,v:v});
        });
        this.dtl=dtl;
    });
    
    Workflow.flowDef(this.flowid).then(sd=>{
        this.flow=sd;
        this.query_opinions();
    });
},
methods:{
query_opinions() {
    this.opinion='';
    this.nextSigners=[];
    var url="/api/opinions?flowid="+this.flowid+"&did="+this.did
        +"&service="+this.service;
    request({method:"GET",url:url}, WF).then(resp=>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var dt=new Date(resp.data.update_time);
        var curStep=resp.data.step;
        this.base.step=curStep; //待处理的步骤
        this.base.creator=resp.data.creator;
        this.base.createAt=datetime2str(dt);
        var signer=resp.data.signer;//当前查看人

        var steps=[]; //预填充步骤的数据
        this.flow.steps.forEach(o=>{
            steps[o.step]={step:o.step,title:o.title,
                type:o.type/*类型：O-ne单签，M-ulti会签*/,
                t:0/*时间戳*/, ts:''/*时间*/,
                list:[]/*当前步骤的意见列表*/,
                olist:[]/*其他人的意见*/};
        });

        var cols=resp.data.cols;
        var s, opt, ts;
        var allDone=true;
        var opts=resp.data.opinions;//step,opinion,result,type,signer,turn,update_time
        for(var i=0;i<opts.length;i++) {
            opt=opts[i];
            var o={};
            var j=0;
            for(var c in cols) {
                o[cols[c]]=opt[j++];
            }
            dt.setTime(o.update_time);
            ts=datetime2str(dt);
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
                        allDone=false;
                    }
                }
            }
        }
        this.allDone=allDone;
        this.steps=steps;
    });
},
confirm() {
    if(this.base.step>this.flow.maxStep) {
        this.$refs.errMsg.show(this.tags.wrongWfDef);
        return;
    }
    var url="/api/confirm";
    var data={flowid:this.flowid, did:this.did,service:this.service,
        opinion:this.opinion, nextSigners:this.nextSigners};
    request({method:"POST",url:url, data:data}, WF).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.base.step=resp.data.nextStep;
        this.query_opinions();
    });
},
counterSign(agree) {
    var url="/api/counterSign";
    var data={flowid:this.flowid, did:this.did,service:this.service,
        opinion:this.opinion, result:agree?'P':'R'};
    request({method:"POST",url:url,data:data}, WF).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.query_opinions();
    });
},
reject() {
    if(this.base.step<=0) {
        return;
    }
    var url="/api/reject";
    var data={flowid:this.flowid, did:this.did, opinion:this.opinion};
    request({method:"POST",url:url, data:data}, WF).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.base.step=resp.data.foreStep;
        this.query_opinions();
    });
},
removeWf() { //判断数据是否存在，工作流数据错乱的情况下，删除工作流记录
    var dtlUrl=this.dtlApi;
    dtlUrl += (dtlUrl.indexOf('?')>0?'&':'?')+"id="+this.did;
    request({method:"GET",url:dtlUrl}, this.service).then(resp=>{
        if(resp.code!=RetCode.NOT_EXISTS) { //数据不存在返回NOT_EXISTS
            return;
        }
        this.$refs.confirmDlg.show(this.tags.wrongFlowState, ()=>{
            var rmvUrl = this.rmvBroken
                + this.rmvBroken.indexOf('?')>0?'&':'?'
                + "flowid="+this.flowid+"&did="+this.did;
            request({method:"DELETE",url:rmvUrl}, WF).then(resp=>{
                if(resp.code!=RetCode.OK) {
                    this.$refs.errMsg.showErr(resp.code, resp.info);
                }else{
                    this.$router.back();
                }
            })
        });
    });
},
showDtl() {
    var url=this.dtlPage;
    url+=(url.indexOf('?')>0?'&':'?')+'id='+this.did;
    this.$router.goto(url);
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header>
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="ibf.back"></q-btn>
    <q-toolbar-title>{{flow.name}}</q-toolbar-title>
    <q-btn flat icon="info" @click="showDtl"></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-sm">
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
       <q-input v-model="opinion" :label="tags.opinion" outlined dense maxlength=100></q-input>
       <div v-if="o.type!='S'"><!-- 会签时的从签不必设置下一步责任人 -->
        <component-user-selector :label="tags.signers" :multi="true"
         :accounts="nextSigners" v-if="s.step!=flow.maxStep"></component-user-selector>
        <div class="row justify-end q-mt-lg">
         <q-btn @click="confirm" color="primary" :disable="!allDone"
          :label="s.step!=flow.maxStep?tags.nextStep:tags.finish" dense></q-btn>
         <q-btn v-if="base.step>0" flat @click="reject" color="primary" :label="tags.reject" class="q-ml-sm" dense></q-btn>
        </div>
       </div>
       <div v-else class="row justify-end q-mt-lg">
        <q-btn @click="counterSign(true)" color="primary" :label="tags.agree" dense></q-btn>
        <q-btn flat @click="counterSign(false)" color="primary" :label="tags.disAgree" class="q-ml-sm" dense></q-btn>
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
<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
<confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></confirm-dialog>
`
}