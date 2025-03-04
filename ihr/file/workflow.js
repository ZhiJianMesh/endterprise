import Workflow from "/assets/v3/components/workflow.js"
import {_WF_} from "/assets/v3/components/workflow.js"

export default {
inject:['service','tags'],
components:{
	"workflow":Workflow
},
data() {return {
    flowid:this.$route.query.flow,
    did:this.$route.query.did,
    flName:this.$route.query.flName,
    rmvBroken:this.$route.query.rmvBroken,
    dtlApi:this.$route.query.dtlApi,
    dtlPage:this.$route.query.dtlPage,
	flow:{}//流程定义信息{name,maxStep,steps}
}},
created(){
    //此处有约定:1)type为customer、order、payment、service等；
    // 2）languages中必须由对应名称的tag集合；
    // 3)必须由对应的detail接口，并且接口中响应中segs字段指定了要显示的字段名；
    var dtlUrl=appendParas(this.dtlApi,{id:this.did});
    var segments=this.tags[this.flName]['wfSegs'];
    request({method:"GET",url:dtlUrl}, this.service.name).then(resp=>{
        if(resp.code!=RetCode.OK) {
            if(resp.code==RetCode.NOT_EXISTS&&this.rmvBroken) {
                this.removeWf();
            }
            return;
        }
        this.dtl=_WF_.formDtlData(resp.data, segments);
    });
	_WF_.flowDef(this.flowid).then(sd=>{
        this.flow=sd;
    });
},
methods:{
removeWf() { //数据不存在，工作流数据错乱的情况下，删除工作流记录
    this.$refs.confirmDlg.show(this.tags.wrongFlowState, ()=>{
        var rmvUrl = appendParas(this.rmvBroken,{flowid:this.flowid,did:this.did});
        request({method:"DELETE",url:rmvUrl}, this.service.name).then(resp=>{
            if(resp.code!=RetCode.OK) {
                this.$refs.errMsg.showErr(resp.code, resp.info);
            }else{
                this.$router.back();
            }
        })
    })
},
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header>
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{flow.name}}</q-toolbar-title>
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