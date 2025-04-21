export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    //ord,creator,createAt,comment,cost,cname,customer
    dtl:{},
    ext:{}, //从订单的comment转化而来
    visible:{editBase:false},
    visSegs:["cost","creator","createAt"]
}},
created(){
    var defaultVal={cmt:{n:this.tags.cmt,t:'s'}};
    var url="/api/proxy/gettemplate?name=service";
    this.ibf.template('service', url, defaultVal).then(tmpl=> {
        this.detail(tmpl);
    })
},
methods:{
detail(tmpl) {
    var reqUrl="/api/service/detail?id="+this.id;
    request({method:"GET", url:reqUrl},this.service.name).then(resp=>{
        if(!resp || resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dtl=resp.data;
        var dt=new Date();
        dt.setTime(resp.data.createAt*60000);
        this.dtl.createAt=datetime2str(dt);
        this.ext=this.ibf.decodeExt(this.dtl.comment, tmpl);
    });
},
save_base() {
    var dta={comment:this.ibf.encodeExt(this.ext), id:this.id};
    var url="/api/service/setComment";
    request({method:"PUT",url:url,data:dta}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.editBase=false;
    })
},
menu_remove(){
    var msg=this.tags.cfmToDel+this.tags.service.title+' "'+this.dtl.cname+'-'+this.dtl.skuName+'"';
    this.$refs.confirmDlg.show(msg, ()=>{
        var opts={method:"DELETE",url:"/api/service/remove?id="+this.id};
        request(opts, this.service.name).then((resp)=>{
            if(resp.code != 0) {
                this.$refs.errMsg.showErr(resp.code, resp.info);
            }else{
                this.service.back();
            }
        })
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
      <q-toolbar-title>{{tags.service.title}}({{dtl.cname}})</q-toolbar-title>
      <q-btn flat round dense icon="menu" v-if="dtl.power='O'">
       <q-menu>
       <q-list style="min-width: 100px">
        <q-item clickable v-close-popup @click="menu_remove">
          <q-item-section avatar><q-icon name="delete"></q-icon></q-item-section>
          <q-item-section>{{tags.menu.remove}}</q-item-section>
        </q-item>
       </q-list>
      </q-menu>
     </q-btn>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-px-md q-pb-lg">
<q-banner dense inline-actions class="q-mb-md text-dark bg-blue-grey-1">
{{tags.baseInfo}}
  <template v-slot:action v-if="dtl.status!=100">
    <q-icon name="edit" color="primary" @click.stop="visible.editBase=true"></q-icon>
  </template>
</q-banner>
<q-list dense>
  <q-item clickable @click.stop="service.goto('/customer?id='+dtl.customer)">
    <q-item-section>{{tags.service.cname}}</q-item-section>
    <q-item-section><span class="text-primary">{{dtl.cname}}</span></q-item-section>
  </q-item>
  <q-item v-for="i in visSegs">
    <q-item-section>{{tags.service[i]}}</q-item-section>
    <q-item-section>{{dtl[i]}}</q-item-section>
  </q-item>
  <q-item v-for="e in ext">
    <q-item-section>{{e.n}}</q-item-section>
    <q-item-section>{{e.v}}</q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" ref="errMsg"></component-alert-dialog>
<component-confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></component-confirm-dialog>

<!-- 修改服务基本信息弹窗 -->
<q-dialog v-model="visible.editBase" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.baseInfo}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list dense>
      <q-item><q-item-section>{{dtl.cname}}</q-item-section></q-item>
      <q-item v-for="e in ext"><q-item-section>
        <div v-if="e.t=='d'">
          <component-date-input :close="tags.ok" :label="e.n" v-model="e.v"></component-date-input>
        </div>
        <div v-else-if="e.t=='b'">
          <q-checkbox v-model="e.v" :label="e.n" left-label></q-checkbox>
        </div>
        <div v-else>
         <q-input borderless :label="e.n" v-model="e.v" dense :autogrow="e.t!='n'"
          :type="e.t=='n'?'number':'textarea'"></q-input>
        </div>
      </q-item-section></q-item>
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="save_base"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}