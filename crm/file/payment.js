export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    tmpl:{},
    //amount,creator,createAt,comment,status,flowid,cname,skuName
    dtl:{},
    ext:{}, //从订单的comment转化而来
    visible:{editBase:false},
    visSegs:["cname","skuName","amount","creator","createAt"]
}},
created(){
    this.service.template('payment').then(function(tpl){
        this.tmpl=tpl;
        this.detail();
    }.bind(this))
},
methods:{
detail() {
    var reqUrl="/api/payment/detail?id="+this.id;
    request({method:"GET", url:reqUrl},this.service.name).then(resp=>{
        if(!resp || resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dtl=resp.data;
        this.dtl.createAt=new Date(resp.data.createAt*60000).toLocaleString();
        this.dtl.icon=this.tags.sta2icon(this.dtl.status);
        this.ext=this.service.decodeExt(this.dtl.comment, this.tmpl);
    });
},
save_base() {
    var dta=copyObj(this.dtl,['amount']);
    dta['comment']=this.service.encodeExt(this.ext);
    dta.id=this.id;
    request({method:"POST",url:"/api/payment/setInfo",data:dta}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.editBase=false;
    })
},
payment_flow(){
    this.$router.push('/workflow?flow='+this.dtl.flowid+"&did="+this.id+"&flName=payment&step="+this.dtl.status);
},
menu_remove(){
    var msg=this.tags.cfmToDel+this.tags.payment.title+' "'+this.dtl.cname+'-'+this.dtl.skuName+'"';
    this.$refs.confirmDlg.show(msg, ()=>{
        var opts={method:"DELETE",url:"/api/payment/remove?id="+this.id};
        request(opts, this.service.name).then(resp=>{
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
<q-layout view="hHh lpr fFf" container style="height:100vh">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
      <q-toolbar-title>{{tags.payment.title}}({{dtl.cname}}-{{dtl.skuName}})</q-toolbar-title>
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
    <q-item-section>{{tags.payment.cname}}</q-item-section>
    <q-item-section><span class="text-primary">{{dtl.cname}}</span></q-item-section>
  </q-item>
  <q-item clickable @click.stop="service.goto('/order?id='+dtl.orderId)">
    <q-item-section>{{tags.order.title}}</q-item-section>
    <q-item-section><span class="text-primary">{{dtl.skuName}}</span></q-item-section>
  </q-item>
  <q-item v-for="i in visSegs">
    <q-item-section>{{tags.payment[i]}}</q-item-section>
    <q-item-section>{{dtl[i]}}</q-item-section>
  </q-item>
  <q-item v-if="dtl.power=='O'" clickable @click.stop="payment_flow">
    <q-item-section>{{tags.order.status}}</q-item-section>
    <q-item-section><q-icon :name="dtl.icon" color="blue"></q-icon></q-item-section>
  </q-item>
  <q-item v-for="(tpl,k) in tmpl">
    <q-item-section>{{tpl.n}}</q-item-section>
    <q-item-section>{{ext[k]}}</q-item-section>
  </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
<component-confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></component-confirm-dialog>

<!-- 修改回款基本信息弹窗 -->
<q-dialog v-model="visible.editBase" no-backdrop-dismiss v-if="dtl.status!=100">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.baseInfo}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list dense>
      <q-item><q-item-section>{{dtl.cname}}</q-item-section></q-item>
      <q-item><q-item-section>{{dtl.skuName}}</q-item-section></q-item>
      <q-item v-show="dtl.status==0"><q-item-section>
        <q-input :label="tags.payment.amount" v-model="dtl.amount" dense></q-input>
      </q-item-section></q-item>
      <q-item v-for="(tpl,k) in tmpl"><q-item-section>
        <div v-if="tpl.t=='d'">
          <component-date-input :close="tags.ok" :label="tpl.n" v-model="ext[k]"></component-date-input>
        </div>
        <div v-else-if="tpl.t=='b'">
          <q-checkbox v-model="ext[k]" :label="tpl.n" left-label></q-checkbox>
        </div>
        <div v-else>
         <q-input borderless :label="tpl.n" v-model="ext[k]" dense :autogrow="tpl.t!='n'"
          :type="tpl.t=='n'?'number':'textarea'"></q-input>
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