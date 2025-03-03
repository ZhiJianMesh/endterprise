import ConfirmDialog from "/assets/v3/components/confirm_dialog.js";
import AlertDialog from "/assets/v3/components/alert_dialog.js";
import UserSelector from "/assets/v3/components/user_selector.js"
import Workflow from "/assets/v3/components/workflow.js"
import {_WF_} from "/assets/v3/components/workflow.js"

export default {
inject:['ibf'],
components:{
    "alert-dialog":AlertDialog,
    "confirm-dialog":ConfirmDialog,
    "user-selector":UserSelector,
	"workflow":Workflow,
},
data() {return {
    service:this.$route.query.service,
    flowid:this.$route.query.flow,
    did:this.$route.query.did,
    flName:this.$route.query.flName,
    rmvBroken:this.$route.query.rmvBroken,
    dtlApi:this.$route.query.dtlApi,
    dtlPage:this.$route.query.dtlPage,
    tags:this.ibf.tags,
	flow:{}//流程定义信息{name,maxStep,steps}
}},
created(){
    //此处有约定:1)type为customer、order、payment、service等；
    // 2）languages中必须由对应名称的tag集合；
    // 3)必须由对应的detail接口，并且接口中响应中segs字段指定了要显示的字段名；
    var dtlUrl=appendParas(this.dtlApi,{id:this.did});
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
                dt.setTime(resp.data[s.n]*60000); //时间都用分钟
                v=datetime2str(dt);
            } else if(s.t=='d') {
                dt.setTime(resp.data[s.n]*60000);
                v=date2str(dt);
            } else {/*(s.t=='s'||s.t=='n')*/
                v=resp.data[s.n];
            }
            dtl.push({k:s.s,v:v});
        });
        this.dtl=dtl;
    });
	_WF_.flowDef(this.flowid).then(sd=>{
        this.flow=sd;
    });
},
methods:{
showDtl() {
    var url=appendParas(this.dtlPage,{id:this.did,flowid:this.flowid,service:this.service});
    this.ibf.goto(url)
},
removeWf() { //判断数据是否存在，工作流数据错乱的情况下，删除工作流记录
    if(!this.rmvBroken)return;

    var dtlUrl=appendParas(this.dtlApi, {id:this.did});
    request({method:"GET",url:dtlUrl}, this.service).then(resp=>{
        if(resp.code!=RetCode.NOT_EXISTS) { //数据不存在返回NOT_EXISTS
            return;
        }
        this.$refs.confirmDlg.show(this.tags.wrongFlowState, ()=>{
            var rmvUrl = appendParas(this.rmvBroken,{flowid:this.flowid,did:this.did});
            request({method:"DELETE",url:rmvUrl}, _WF_.service).then(resp=>{
                if(resp.code!=RetCode.OK) {
                    this.$refs.errMsg.showErr(resp.code, resp.info);
                }else{
                    this.$router.back();
                }
            })
        });
    });
},
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header>
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="ibf.back"></q-btn>
    <q-toolbar-title>{{flow.name}}</q-toolbar-title>
    <q-btn flat icon="info" @click="showDtl" v-if="dtlPage"></q-btn>
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
<workflow :service="service" :flowid="flowid" :did="did"
 :serviceTags="tags" :flowTags="tags.flow"
 :apiErrors="tags.errMsgs"></workflow>
    </q-page>
  </q-page-container>
</q-layout>
<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
<confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></confirm-dialog>
`
}