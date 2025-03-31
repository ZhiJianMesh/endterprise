import Workflow from "/assets/v3/components/workflow.js"
import {_WF_} from "/assets/v3/components/workflow.js"

const _SEGS_={ //不放在data中是为了避免不必要的双向绑定
  customer:[
    {t:'s',n:"name"},
    {t:'s',n:"taxid"},
    {t:'s',n:"address"},
    {t:'s',n:"business"},
    {t:'s',n:"creator"},
    {t:'d',n:"createAt"}
  ],
  order:[
    {t:'s',n:"cname"},
    {t:'s',n:"taxid"},
    {t:'n',n:"price"},
    {t:'s',n:"creator"},
    {t:'d',n:"createAt"}
  ]
};
export default {
inject:['service', 'tags', 'icons'],
components:{
	"workflow":Workflow
},
data() {return {
    flowid:this.$route.query.flow,
    did:this.$route.query.did,
    flName:this.$route.query.flName,
    dtlApi:this.$route.query.dtlApi,
    dtlPage:this.$route.query.dtlPage,
    curStep:0,
    dtl:[],
	flow:{}//流程定义信息{name,maxStep,steps}
}},
created(){
    var tags=this.tags[this.flName];
    var segments=_SEGS_[this.flName];
    for(var s of segments) { //初始化标签
        s.s=tags[s.n];
    }
    this.service.template(this.flName).then(tmpl=>{
        this.detail(tmpl,segments);
    });
	_WF_.flowDef(this.flowid).then(sd=>{
        this.flow=sd;
    });
},
methods:{
showDtl() {
    var url=appendParas(this.dtlPage,{id:this.did,flowid:this.flowid,service:this.service.name});
    this.service.goto(url)
},
detail(tmpl,segments) {
    var dtlUrl=appendParas(this.dtlApi,{id:this.did});
    request({method:"GET",url:dtlUrl}, this.service.name).then(resp=>{
        if(resp.code!=RetCode.OK) {
            if(resp.code==RetCode.NOT_EXISTS) {
                this.removeWf();
            }
            return;
        }
        var dta=_WF_.formDtlData(resp.data, segments);
        var ext=this.service.decodeExt(dta.comment, tmpl);
        if(ext) {
            dta=dta.concat(ext);
        }
        this.dtl=dta;
    });
},
removeWf() { //数据不存在，工作流数据错乱的情况下，删除工作流记录
    if(this.curStep>0)return;//只有第0步权签人(创建人)才有权限删除

    this.$refs.confirmDlg.show(this.tags.wrongFlowState, ()=>{
        _WF_.remove(this.flowid,this.did,this.service.name).then(resp=>{
            if(resp.code!=RetCode.OK) {
                this.$refs.errMsg.showErr(resp.code, resp.info);
            }else{
                this.service.back();
            }
        })
    })
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header>
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
    <q-toolbar-title>{{flow.name}}</q-toolbar-title>
    <q-btn flat :icon="icons[flName]" @click="showDtl" v-if="dtlPage"></q-btn>
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
 :apiErrors="tags.errMsgs" v-model="curStep"></workflow>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
<component-confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></component-confirm-dialog>
`
}