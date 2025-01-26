import AlertDialog from "/assets/v3/components/alert_dialog.js"
import ConfirmDialog from "/assets/v3/components/confirm_dialog.js"
import Language from "./language.js"

const l=Platform.language();
const tags = l.indexOf("zh") == 0 ? Language.cn : Language.en;

const URL_SAVESTEPS="/flow/saveSteps";
const URL_INFO="/flow/getInfoByName";
const SERVICE_WF="workflow";
const EMPTY_STEP={step:'',type:'S',name:'',ext:'{}',cmt:'',signer:''};

//简易的用户&群组管理
export default {
data() {return {
    service:this.$route.query.service, //运行的服务
    proxyUrl:decodeURIComponent(this.$route.query.proxy), //代理url
    tags:tags,
    
    curFlow:'',
    cmt:'',
    steps:[],
    changed:false,
    
    flowOpts:[], //工作流选项
    typeOpts:[], //步骤类型选项
    
    newStep:{},
    flowDlg:{show:false,state:0}//state,0:detail,1:edit,2:add
}},
components:{
    "alert-dialog":AlertDialog,
    "confirm-dialog":ConfirmDialog
},
created(){
    request({method:"GET", url:"/flow/list?service="+this.service}, "workflow").then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        for(var i in resp.data.flows) {
            var f=resp.data.flows[i];
            this.flowOpts.push({label:f.dispName,value:f.name});
        }
        this.curFlow=this.flowOpts[0].value;
        this.get_flow_info(this.curFlow);
    });

    for(var k in this.tags.flowTypes) {
        var v=this.tags.flowTypes[k];
        this.typeOpts.push({label:v, value:k});
    }
    this.newStep.type=this.typeOpts[0].value;
},
methods:{
proxy_req(req){
    var dta={'_service':SERVICE_WF,'_method':req.method,'_url':req.url};
    if(req.method=='POST'&&req.data){
        for(var k in req.data){
            dta[k]=req.data[k];
        }
    }
    return request({method:"POST", url:this.proxyUrl, data:dta}, this.service);
},
show_step_detail(i) {
    this.newStep=this.steps[i];
    this.flowDlg={show:true,state:0};
},
remove_step(n){
    this.changed=true;
    var steps=[];
    for(var i in this.steps) {
        if(n!=i) {
            steps.push(this.steps[i]);
        }
    }
    this.steps=steps;
},
confirm_step(){
    if(this.flowDlg.state==2) {//add
        this.steps.push(this.newStep);
        copyObjTo(EMPTY_STEP, this.newStep);
        this.steps.sort(function(a,b){
            return a.step-b.step;
        });
    } else { //1,modify
        for(var i in this.steps) {
            if(this.steps[i].step==this.newStep.step) {
                this.steps[i]=this.newStep;
                break;
            }
        }
    }
    
    this.changed=true;
    this.flowDlg.show=false;
    copyObjTo(EMPTY_STEP, this.newStep);
},
open_add_step(){
    var max=-1;
    for(var i in this.steps) {
        var v=parseInt(this.steps[i].step)
        if(max < v) {
            max = v;
        }
    }
    copyObjTo(EMPTY_STEP, this.newStep);
    this.newStep.step=max+1;
    this.newStep.type=this.typeOpts[0].value;
    this.flowDlg={show:true,state:2};
},
save_flow(){
    var opts={method:"POST",url:URL_SAVESTEPS, data:{cmt:this.cmt,
        service:this.service, name:this.curFlow, steps:this.steps}};
    this.proxy_req(opts).then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.changed=false;
    });
},
get_flow_info(flow) {
    var opts={method:"GET",url:URL_INFO+"?name="+flow+"&service="+this.service};
    request(opts, SERVICE_WF).then(resp=>{
        if(resp.code != 0) {
            return;
        }
        this.cmt=resp.data.cmt;
        this.steps=resp.data.steps;
        this.changed=false;
    });
},
flow_changed() {
    if(this.changed) {
        this.$refs.confirmDlg.show(this.tags.changeNotSaved, ()=>{
            this.get_flow_info(this.curFlow);
        });
    } else {
        this.get_flow_info(this.curFlow);
    }
},
go_back() {
    this.$router.back();
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="go_back"></q-btn>
      <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
   </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-md">

<q-select v-model="curFlow" :options="flowOpts" outlined dense
 @update:model-value="flow_changed" emit-value map-options></q-select>
<q-input :label="tags.comment" v-model="cmt" maxlength=120
 @update:model-value="changed=true"></q-input>
<q-list>
<q-item>
 <q-item-section side><q-item-label caption>{{tags.step.step}}</q-item-label></q-item-section>
 <q-item-section><q-item-label caption>{{tags.step.name}}</q-item-label></q-item-section>
 <q-item-section><q-item-label caption>{{tags.step.type}}</q-item-label></q-item-section>
 <q-item-section avatar><q-icon name="add_circle" color="primary" @click="open_add_step"></q-icon></q-item-section>
</q-item>
<q-item v-for="(s,i) in steps" clickable @click="show_step_detail(i)">
 <q-item-section side>{{s.step}}</q-item-section>
 <q-item-section>{{s.name}}</q-item-section>
 <q-item-section>{{tags.flowTypes[s.type]}}</q-item-section>
 <q-item-section avatar><q-icon name="cancel" color="green" @click="remove_step(i)"></q-icon></q-item-section>
</q-item>
</q-list>
<div align="center" v-show="changed">
   <q-btn color="primary" icon="save" :label="tags.save" @click="save_flow" :disable="!changed"></q-btn>
</div>
    </q-page>
  </q-page-container>
</q-layout>
<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
<confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></confirm-dialog>

<!-- 增加/修改/显示步骤信息弹窗 -->
<q-dialog v-model="flowDlg.show" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
     <div class="row items-center no-wrap">
      <div class="col">
       <div class="text-h6">{{tags.stepNo}}.{{newStep.step}}</div>
      </div>
      <div class="col-auto">
        <q-btn color="blue" :label="tags.modify" round flat icon="edit" v-show="flowDlg.state==0" @click="flowDlg.state=1"></q-btn>
      </div>
    </div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <q-input :label="tags.step.step" v-model="newStep.step" maxlength=30 dense :disable="flowDlg.state!=2"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.step.name" v-model="newStep.name" maxlength=80 dense :disable="flowDlg.state==0"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.step.signer" v-model="newStep.signer" maxlength=80 dense :disable="flowDlg.state==0"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-select v-model="newStep.type" :options="typeOpts" :label="tags.step.type"
         emit-value map-options :disable="flowDlg.state==0"></q-select>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.step.comment" v-model="newStep.cmt" type="text" autogrow maxlength=100 dense :disable="flowDlg.state==0"></q-input>
      </q-item-section></q-item>
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click.stop="confirm_step" v-show="flowDlg.state!=0"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}