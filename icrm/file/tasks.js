export default {
inject:['service', 'tags', 'icons'],
data() {return {
    tasks:[], //任务列表
    page:{cur:1, max:0}
}},
created(){
    this.query_tasks(1);
},
methods:{
query_tasks(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var url="/api/tasks?offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.WF).then(resp=>{
        if(resp.code!=RetCode.OK) {
            return;
        }
        var cols=resp.data.cols;
        var tasks=[];
        var dt=new Date();
        var flows=""; //本地无缓存信息的工作流id列表
        
        //flow,did,createAt,step,result,type,name,creator
        resp.data.tasks.forEach(task=>{
            var j=0;
            var line={};
            for(var c in cols) {
                line[cols[c]]=task[j++];
            }
            line['color']=line.result=='I'?'blue':'black'
            dt.setTime(line.createAt);
            line.createAt=datetime2str(dt);
            tasks.push(line);
            if(!this.service.getFlow(line.id)) {
                if(flows!='')flows+=',';
                flows+=line.id;
            }
        });
        if(flows!='') {
            this.ibf.flowsDef(flows).then(r => {
                if(!r)return;
                this.mergeTasks(tasks,resp.data.total);
            });
        } else {
            this.mergeTasks(tasks,resp.data.total);
        }
    });
},
mergeTasks(tasks,total) {
    this.tasks=tasks.map(t => {
        var flow=this.ibf.getFlow(t.flow);
        //flowName,stepName,descr
        t.flowName=flow.dispName;
        if(flow) {
            var step=flow.steps[t.step];
            t.stepName=step.name;
            t.descr=step.cmt;
        }
        return t;
    });
    this.page.max=Math.ceil(total/this.service.N_PAGE);
},
detail(flow, did, flName/*工作流名称，customer、order、payment、service*/) {
    this.$router.push('/workflow?flow='+flow+"&did="
        +did+"&flName="+flName+"&service=" + this.service.name);
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
    <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
    <q-toolbar-title>{{tags.home.tasks}}</q-toolbar-title>
    <q-avatar :icon="icons['task']" color="primary"></q-avatar>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<div class="q-pa-sm flex flex-center" v-if="page.max>1">
  <q-pagination color="primary" v-model="page.cur" :max="page.max" max-pages="10"
   boundary-numbers="false" @update:model-value="query_tasks" dense></q-pagination>
</div>
<q-list separator>
 <q-item v-for="t in tasks" @click="detail(t.flow,t.did,t.name)" clickable>
  <q-item-section thumbnail><q-icon :name="icons[t.name]" :color="t.color"></q-icon></q-item-section>
  <q-item-section>
    <q-item-label>{{t.flowName}}</q-item-label>
    <q-item-label caption>{{t.stepName}}:{{t.descr}}</q-item-label>
  </q-item-section>
  <q-item-section side top>
    <q-item-label>{{t.creator}}</q-item-label>
    <q-item-label caption>{{t.createAt}}</q-item-label>
  </q-item-section>
 </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>
`
}