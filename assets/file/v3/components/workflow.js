import AlertDialog from "/assets/v3/components/alert_dialog.js";
import UserSelector from "/assets/v3/components/user_selector.js"

const cn_flow_tags = {
    close:"关闭",
    failToCall:"调用失败",
    wrongWfDef:"工作流定义错误",
    wfClkSuccess:'执行成功!',
    unHandled:'未处理',
    
    opinion:"意见",
    agree:'同意',
    disAgree:'不同意',
    finish:"完成",
    reject:"返回",
    nextStep:"下一步",
    signers:'权签人',

    errMsgs:{
      '10104':"会签仍未结束",
      '10106':"输入的帐号不符合要求",
      '10108':"下一步会签，参与会签的人不可以有自己",
      '10109':"下一步只可指定一个责任人",
      '10110':"必须指定下一步责任人",
      'unknown':"未知错误"
    }
};
const _WF_={
flowInfos:{},
service:"workflow",
flowDefs:function(ids){
    var fids='';
    for(var id of ids){
        if(this.flowInfos[id]) continue;
        if(fids!='')fids+=',';
        fids+=id;
    }
    var url="/api/flow/infos?flowids="+fids
    return request({method:"GET",url:url}, this.service).then(resp=>{
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
flowDef:function(id,refresh){//不能用箭头函数，否则不能用this，箭头函数的this是在运行时所在的对象
    if(!refresh && this.flowInfos[id]) {
        return new Promise(resolve=>{resolve(this.flowInfos[id])});
    }
    return this.flowDefs([id]).then(r=>{
        return r ? this.flowInfos[id] : {};
    });
},
getFlowDef:function(id) {
    return this.flowInfos[id];
}
}
export {_WF_};

export default {
components:{
    "alert-dialog":AlertDialog,
    "user-selector":UserSelector
},
data() {return {
    flow:{},//流程定义信息{name,maxStep,steps}
    base:{creator:'',createAt:0,step:0},
    dtl:{}, //数据详情
    steps:[],//每一步的数据，并非定义
    opinion:'',//处理意见
    nextSigners:[],//下一步处理人
    allDone:true,
    oIcons:{P:'thumb_up',R:'thumb_down'},
    errMap:{},
    tags:{}
}},
props: {
    service:{type:String,required:true},
    flowid:{type:Number,required:true},
    did:{type:Number,required:true},
    apiErrors:{type:Object,required:true},//错误码对应的信息
    flowTags:{type:Object, required:false},
    serviceTags:{type:Object,required:true} //引用此组件的服务的标签，用于显示ext中的tag      
},
created(){
    _WF_.flowDef(this.flowid).then(sd=>{
        this.flow=sd;
        this.query_opinions();
    });
    if(this.flowTags&&Object.keys(this.flowTags).length>0) {
        copyObjTo(this.flowTags, this.tags);
    } else {
        this.tags=cn_flow_tags
    }
    copyObjTo(this.apiErrors, this.errMap);
    copyObjTo(this.tags.errMsgs, this.errMap);
},
methods:{
query_opinions() {
    this.opinion='';
    this.nextSigners=[];
    var url="/api/opinions?flowid="+this.flowid+"&did="+this.did
        +"&service="+this.service;
    request({method:"GET",url:url}, _WF_.service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var curStep=resp.data.step;
        this.base.step=curStep; //待处理的步骤
        this.base.nextStepType=resp.data.nextStepType; //下一步类型，用于决定帐号输入是单选还是多选
        this.base.creator=resp.data.creator;
        var dt=new Date();
        dt.setTime(resp.data.update_time);
        this.base.createAt=datetime2str(dt);
        if(curStep<this.flow.maxStep) {
            var nextSigner=this.flow.steps[resp.data.nextStep].signer;//工作流定义中指定的权签人
            this.get_next_signers(nextSigner,curStep).then(r=>{
                this.init_steps(resp, curStep);
            });
        } else {
            this.init_steps(resp, curStep);
        }
    });
},
init_steps(resp, curStep) {
    var signer=resp.data.signer;//当前查看人
    var steps=[]; //预填充步骤的数据
    this.flow.steps.forEach(o=>{
        var step={step:o.step,title:o.title,
            type:o.type/*类型：O-ne单签，M-ulti会签*/,
            t:0/*时间戳*/, ts:''/*时间*/,
            list:[]/*当前步骤的意见列表*/,
            olist:[]/*其他人的意见*/,
            ext:{}};
            
        if(curStep==o.step && o.ext!='') {
            //附加参数解析{page:xxx,tag:yyy}，用于处理特殊功能。
            //比如采购中设置采购价，或者确认采购清单等，支持button、page两种
            //在过程初始化中需要设置好ext，并在language中添加相应的语言标签
            var ext=JSON.parse(o.ext);
            ext.tag=this.serviceTags[ext.tag];
            if(ext.page) {
                ext.page=appendParas(ext.page,{flowid:this.flowid,did:this.did,step:curStep});
            } else if(ext.button) {
                ext.button=appendParas(ext.button,{flowid:this.flowid,did:this.did,step:curStep});
            }
            step.ext=ext;
        }
        steps[o.step]=step;
    });

    var dt=new Date();
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
},
get_next_signers(signer,step) { //请求默认的处理人，如果存在，则不显示下一步权签人输入
    var url,service;
    if(/^\d+$/.test(signer)) {//步骤号
        service=_WF_.service;
        url=appendParas("/stepSigners",{flowid:this.flowid,did:this.did,service:this.service,step:signer});
    } else if(/^\/.+/.test(signer)){
        service=this.service;
        url=appendParas(signer,{flowid:this.flowid,did:this.did,step:step});
    } else {
        return new Promise(resolve=>resolve(true));
    }
    return request({method:"GET", url:url}, service).then(resp=>{
        if(resp.code==RetCode.OK) {
            this.nextSigners=resp.data.signers
        }
        return true;
    });
},
confirm() {
    if(this.base.step>this.flow.maxStep) {
        this.$refs.wf_errMsg.show(this.tags.wrongWfDef);
        return;
    }
    var url="/api/confirm";
    var data={flowid:this.flowid, did:this.did,service:this.service,
        opinion:this.opinion, nextSigners:this.nextSigners};
    request({method:"POST",url:url, data:data}, _WF_.service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.wf_errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.base.step=resp.data.nextStep;
        this.query_opinions();
    });
},
counterSign(agree) {//多人会签，不会向下一步走，等待主签人决定(上一步的责任人)
    var url="/api/counterSign";
    var data={flowid:this.flowid, did:this.did,service:this.service,
        opinion:this.opinion, result:agree?'P':'R'};
    request({method:"POST",url:url,data:data}, _WF_.service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.wf_errMsg.showErr(resp.code, resp.info);
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
    var data={flowid:this.flowid, did:this.did, opinion:this.opinion, service:this.service};
    request({method:"POST",url:url, data:data}, _WF_.service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.wf_errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.base.step=resp.data.foreStep;
        this.query_opinions();
    });
},
btn_clk(api) {//ext中的button点击事件
    var idx=api.indexOf('@');
    var service=api.substring(0,idx);
    var url=api.substring(idx+1);
    request({method:"GET",url:url}, service).then(resp=>{
        if(resp.code!=RetCode.OK) {
            this.$refs.wf_errMsg.showErr(resp.code, resp.info);
        } else {
            this.$refs.wf_errMsg.show(this.tags.wfClkSuccess);
        }
    });
},
goto(url) {
    this.$router.goto(url);
}
},
template:`
<q-timeline color="secondary">
<q-timeline-entry v-for="s in steps" :title="s.title" :subtitle="s.ts"
 :color="s.step==base.step?'orange':'primary'">

 <q-btn v-if="s.ext.page" color="primary" :label="s.ext.tag"
  @click="goto(s.ext.page)" dense></q-btn>
 <q-btn v-if="s.ext.button" color="primary" :label="s.ext.tag"
  @click="btn_clk(s.ext.button)" dense></q-btn>

 <q-list dense>
  <q-item v-for="o in s.list">
   <q-item-section>
    <q-item-label>{{o.signer}}</q-item-label>
    <q-item-label caption>
     <div v-if="o.result=='I' && o.step==base.step">
       <q-input v-model="opinion" :label="tags.opinion" outlined dense maxlength=100></q-input>
       <div v-if="o.type!='S'"><!-- 会签时的从签不必设置下一步责任人,O/S/M -->
        <user-selector :label="tags.signers" :multi="base.nextStepType=='M'"
         :accounts="nextSigners"
         v-if="s.step!=flow.maxStep && nextSigners.length==0"></user-selector>
        <div class="row justify-end q-mt-lg">
         <q-btn @click="confirm" color="primary" :disable="!allDone"
          :label="s.step!=flow.maxStep?tags.nextStep:tags.finish" dense></q-btn>
         <q-btn v-if="base.step>0" flat @click="reject" color="primary" :label="tags.reject" class="q-ml-sm" dense></q-btn>
        </div>
       </div>
       <div v-else class="row justify-end q-mt-lg"> <!-- 会签时从签人发表意见后，不会向下一步走 -->
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

<alert-dialog :title="tags.failToCall" :errMsgs="errMap" :close="tags.close" ref="wf_errMsg"></alert-dialog>
`
}