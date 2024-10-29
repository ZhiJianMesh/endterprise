export default {
inject:['service', 'tags', 'icons'],
data() {return {
    id:this.$route.query.id,
    tmpl:{},
    payTmpl:{},
    srvTmpl:{},
    //customer,cname,price,skuId,skuName,skuPrice,creator,createAt,
    //flowid,status,comment,fileNo,taxid,cost
    dtl:{},
    ext:{}, //从订单的comment转化而来
    
    services:[], //id,budget,createAt,creator
    payments:[], //id,amount,createAt,creator
    
    newService:{budget:0,nextSigners:[],comment:'',ext:{}},
    newPayment:{amount:0,nextSigners:[],comment:'',ext:{}},

    page:{service:0,curSrv:1,payment:0,curPm:1},
    visible:{service:false, payment:false, editBase:false, serviceDlg:false, paymentDlg:false},
    visSegs:["taxid","price","skuName","skuPrice","payment","creator","createAt"]
}},
created(){
    this.service.template('order').then(function(tpl){
        this.tmpl=tpl;
        this.detail();
    }.bind(this))
},
methods:{
detail() {
    var reqUrl="/api/order/detail?id="+this.id;
    request({method:"GET", url:reqUrl},this.service.name).then(function(resp){
        if(!resp || resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        var dtl=resp.data;
        dtl.createAt=this.tags.date2str(new Date(parseInt(dtl.createAt)));
        dtl.icon=this.tags.sta2icon(dtl.status);
        dtl.needPay=dtl.price-dtl.payment;
        if(!('cost' in dtl)) {
            dtl['cost']=0;
        }
        this.ext=this.service.decodeExt(dtl.comment, this.tmpl);
        this.dtl=dtl;
    }.bind(this));
},
query_services(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_SMPG;
    var url="/api/service/list?customer="+this.dtl.customer+"&order="+this.id+"&offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=0||resp.data.total==0) {
            return;
        }
        var services=[];
        var dt=new Date();
        var icon;
        for(var s of resp.data.services) { //id,createAt,creator,budget,status
            dt.setTime(s.createAt*60000);
            icon=this.tags.sta2icon(s.status);
            services.push({id:s.id,creator:s.creator,createAt:dt.toLocaleString(),budget:s.budget,status:icon});
        }
        this.services=services;
        this.page.service=Math.ceil(resp.data.total/this.service.N_SMPG);
    }.bind(this));
},
query_payments(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_SMPG;
    var url="/api/payment/list?customer="+this.dtl.customer+"&order="+this.id+"&offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code != 0||resp.data.total==0) {
            return;
        }
        var payments=[];
        var dt=new Date();
        var p,icon;
        for(var i in resp.data.payments) { //id,createAt,creator,amount,status
            p=resp.data.payments[i];
            dt.setTime(p.createAt*60000);
            icon=this.tags.sta2icon(p.status);
            payments.push({id:p.id,creator:p.creator,createAt:dt.toLocaleString(),amount:p.amount,status:icon});
        }
        this.payments=payments;
        this.page.payment=Math.ceil(resp.data.total/this.service.N_SMPG);
    }.bind(this));
},
save_base() {
    var dta=copyObj(this.dtl,['price']);
    dta['comment']=this.service.encodeExt(this.ext);
    dta.id=this.id;

    var cmt=JSON.stringify(this.ext);
    request({method:"POST",url:"/api/order/setInfo",data:dta}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.editBase=false;
    }.bind(this))
},
more_services() {
    this.visible.service=!this.visible.service;
    if(this.visible.service && this.services.length==0) {
        this.query_services(1);
    }
},
more_payments() {
    this.visible.payment=!this.visible.payment;
    if(this.visible.payment && this.payments.length==0) {
        this.query_payments(1);
    }
},
add_service() {
    var dta=copyObj(this.newService,['budget','nextSigners']);
    dta['order']=this.id;
    dta['comment']=this.service.encodeExt(this.newService.ext);
    request({method:"POST",url:"/api/service/create",data:dta}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.visible.serviceDlg=false;
            this.newService={budget:0,nextSigners:[],ext:{}};
            this.query_services(1);
        }
    }.bind(this))
},
add_payment() {
    var dta=copyObj(this.newPayment,['amount','nextSigners']);
    dta['order']=this.id;
    dta['comment']=this.service.encodeExt(this.newPayment.ext);
    request({method:"POST",url:"/api/payment/create",data:dta}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.visible.paymentDlg=false;
            this.newPayment={amount:0,nextSigners:[],ext:{}};
            this.query_payments(1);
        }
    }.bind(this))
},
order_flow(){
    var url='/task?flow='+this.dtl.flowid+"&did="+this.id+"&flName=order&step="+this.dtl.status;
    this.$router.push(url);
},
menu_remove(){
    var msg=this.tags.cfmToDel+this.tags.order.title+' "'+this.dtl.cname+'-'+this.dtl.skuName+'"';
    this.$refs.confirmDlg.show(msg, function(){
        var opts={method:"DELETE",url:"/api/order/remove?id="+this.id};
        request(opts, this.service.name).then(function(resp){
            if(resp.code != 0) {
                this.$refs.errMsg.showErr(resp.code, resp.info);
            }else{
                this.service.go_back();
            }
        }.bind(this))
    }.bind(this));
},
open_new_payment() {
    this.service.template('payment').then(function(tmpl) {
        this.payTmpl=tmpl; //{a:{n:xxx,t:s/d/n},b:{}}
        this.visible.paymentDlg=true
    }.bind(this));
},
open_new_service() {
    this.service.template('service').then(function(tmpl) {
        this.srvTmpl=tmpl; //{a:{n:xxx,t:s/d/n},b:{}}
        this.visible.serviceDlg=true
    }.bind(this));
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{dtl.cname}}-{{dtl.skuName}}</q-toolbar-title>
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
  <template v-slot:action v-if="dtl.status==0&&dtl.power=='O'">
    <q-icon name="edit" color="primary" @click.stop="visible.editBase=true"></q-icon>
  </template>
</q-banner>
<q-list dense>
  <q-item clickable @click.stop="service.jumpTo('/customer?id='+dtl.customer)">
    <q-item-section>{{tags.order.cname}}</q-item-section>
    <q-item-section><span class="text-primary">{{dtl.cname}}</span></q-item-section>
  </q-item>
  <q-item v-for="i in visSegs">
    <q-item-section>{{tags.order[i]}}</q-item-section>
    <q-item-section>{{dtl[i]}}</q-item-section>
  </q-item>
  <q-item v-if="dtl.power=='O'" clickable @click.stop="order_flow">
    <q-item-section>{{tags.order.status}}</q-item-section>
    <q-item-section><q-icon :name="dtl.icon" color="blue"></q-icon></q-item-section>
  </q-item>
  <q-item v-for="(tpl,k) in tmpl">
    <q-item-section>{{tpl.n}}</q-item-section>
    <q-item-section>{{ext[k]}}</q-item-section>
  </q-item>
</q-list>

<!-- 服务记录列表 -->
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1" @click="more_services">
{{tags.service.title}}({{tags.order.service}}:{{dtl.cost}})
  <template v-slot:action>
    <q-icon name="add_circle" color="primary" @click.stop="open_new_service"></q-icon>
  </template>
</q-banner>
<div v-show="visible.service">
<q-list separator dense>
 <q-item v-for="s in services" dense>
  <q-item-section>{{s.creator}}</q-item-section>
  <q-item-section>{{s.budget}}</q-item-section>
  <q-item-section>{{s.createAt}}</q-item-section>
  <q-item-section thumbnail><q-icon :name="s.status"></q-icon></q-item-section>
 </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-if="page.service>1">
 <q-pagination color="primary" :max="page.service" max-pages="10" v-model="page.curSrv"
 dense boundary-numbers="false" @update:model-value="query_services"></q-pagination>
</div>
</div>

<!-- 回款列表 -->
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1" @click="more_payments">
{{tags.payment.title}}({{tags.order.payment}}:{{dtl.payment}},{{tags.order.needPay}}:{{dtl.needPay}})
  <template v-slot:action>
    <q-icon name="add_circle" color="primary" @click.stop="open_new_payment"></q-icon>
  </template>
</q-banner>
<div v-show="visible.payment">
<q-list separator dense>
 <q-item v-for="p in payments" dense>
  <q-item-section>{{p.creator}}</q-item-section>
  <q-item-section>{{p.amount}}</q-item-section>
  <q-item-section>{{p.createAt}}</q-item-section>
  <q-item-section thumbnail><q-icon :name="p.status"></q-icon></q-item-section>
 </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-if="page.payment>1">
 <q-pagination color="primary" :max="page.payment" max-pages="10" v-model="page.curPm"
 dense boundary-numbers="false" @update:model-value="query_payments"></q-pagination>
</div>
</div>
    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
<component-confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></component-confirm-dialog>

<!-- 新增服务弹窗 -->
<q-dialog v-model="visible.serviceDlg" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.service.title}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <q-input :label="tags.service.budget" v-model="newService.budget" type="number" dense></q-input>
      </q-item-section></q-item>
      <!-- ext/comment -->
      <q-item v-for="(tpl,k) in srvTmpl"><q-item-section>
        <div v-if="tpl.t=='d'">
          <component-date-input :close="tags.ok" :label="tpl.n" v-model="newService.ext[k]"></component-date-input>
        </div>
        <div v-else-if="tpl.t=='b'">
          <q-checkbox v-model="newService.ext[k]" :label="tpl.n" left-label></q-checkbox>
        </div>
        <div v-else>
         <q-input :label="tpl.n" v-model="newService.ext[k]" dense :autogrow="tpl.t!='n'"
          :type="tpl.t=='n'?'number':'textarea'"></q-input>
        </div>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <component-user-selector :label="tags.signers" :accounts="newService.nextSigners"></component-user-selector>
      </q-item-section></q-item>      
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="add_service"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<!-- 新增回款弹窗 -->
<q-dialog v-model="visible.paymentDlg" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.payment.title}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <q-input :label="tags.payment.amount" v-model="newPayment.amount" type="number" dense></q-input>
      </q-item-section></q-item>
      <!-- ext/comment -->
      <q-item v-for="(tpl,k) in payTmpl"><q-item-section>
        <div v-if="tpl.t=='d'">
          <component-date-input :close="tags.ok" :label="tpl.n" v-model="newPayment.ext[k]"></component-date-input>
        </div>
        <div v-else-if="tpl.t=='b'">
          <q-checkbox v-model="newPayment.ext[k]" :label="tpl.n" left-label></q-checkbox>
        </div>
        <div v-else>
         <q-input :label="tpl.n" v-model="newPayment.ext[k]" dense :autogrow="tpl.t!='n'"
          :type="tpl.t=='n'?'number':'textarea'"></q-input>
        </div>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <component-user-selector :label="tags.signers" :accounts="newPayment.nextSigners"></component-user-selector>
      </q-item-section></q-item>      
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="add_payment"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<!-- 修改订单基本信息弹窗 -->
<q-dialog v-model="visible.editBase" no-backdrop-dismiss v-if="dtl.status==0">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.baseInfo}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list dense>
      <q-item><q-item-section>{{dtl.cname}}</q-item-section></q-item>
      <q-item><q-item-section>{{dtl.skuName}}</q-item-section></q-item>
      <q-item v-show="dtl.status==0"><q-item-section>
        <q-input :label="tags.order.price" v-model="dtl.price" dense></q-input>
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