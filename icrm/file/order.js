import BankSelector from "/ibfbase/components/bank_selector.js"

const EMPTY_PUR={expDate:'',descr:'',type:'SELL',receiver:'',buyer:[]};

export default {
components:{
    "bank-select":BankSelector
},
inject:['service', 'tags', 'icons', 'ibf'],
data() {return {
    id:this.$route.query.id,
    //customer,cname,price,skuId,skuName,skuPrice,creator,createAt,
    //flowid,status,comment,fileNo,taxid,cost
    dtl:{},
    ext:[], //从订单的comment转化而来
    
    services:[], //id,budget,createAt,creator
    payments:[], //id,amount,createAt,creator
    purList:[],
    
    newService:{cost:0,nextSigners:[],comment:'',ext:[]},
    newPayment:{amount:0,bank:'',comment:'',ext:[]},
    purchase:{dlg:false,dta:{},skus:[],sku:{sku:{},num:''}},

    page:{service:0,curSrv:1,payment:0,curPm:1},
    visible:{service:false, payment:false, editBase:false, serviceDlg:false, paymentDlg:false},
    visSegs:["taxid","price","payment","creator","createAt"]
}},
created(){
    this.service.template('order').then(tpl=>{
        this.detail(tpl);
    });
    this.query_purList();
},
methods:{
detail(tmpl) {
    var reqUrl="/api/order/detail?id="+this.id;
    request({method:"GET", url:reqUrl},this.service.name).then(resp=>{
        if(!resp || resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        var dtl=resp.data;
        dtl.createAt=date2str(new Date(dtl.createAt*60000));
        dtl.icon=this.tags.sta2icon(dtl.status);
        dtl.needPay=dtl.price-dtl.payment;
        if(!('cost' in dtl)) {
            dtl['cost']=0;
        }
        dtl.editable=dtl.status==0&&dtl.power=='O';
        this.ext=this.service.decodeExt(dtl.comment, tmpl);
        this.dtl=dtl;
    });
},
query_services(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_SMPG;
    var url="/api/service/list?customer="+this.dtl.customer+"&order="+this.id
            +"&offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(resp=>{
        if(resp.code!=0||resp.data.total==0) {
            return;
        }
        var dt=new Date();
        //id,createAt,creator,cost
        this.services=resp.data.services.map(l=>{ 
            dt.setTime(l.createAt*60000);
            l.createAt=datetime2str(dt);
            return l;
        });
        this.page.service=Math.ceil(resp.data.total/this.service.N_SMPG);
    });
},
query_payments(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_SMPG;
    var url="/api/payment/list?customer="+this.dtl.customer+"&order="+this.id+"&offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(resp=>{
        if(resp.code != 0||resp.data.total==0) {
            return;
        }
        var dt=new Date();
        this.payments=resp.data.payments.map(l=>{
            dt.setTime(l.createAt*60000);
            l.createAt=datetime2str(dt);
            if(l.cfmAt==0) {
                l.cfmAt=this.tags.payment.notCfm;
            } else {
                dt.setTime(l.cfmAt*60000);
                l.createAt=datetime2str(dt);
            }
            return l;
        })
        this.page.payment=Math.ceil(resp.data.total/this.service.N_SMPG);
    })
},
query_purList() {
    var url="/api/order/purchaselist?order="+this.id;
    request({method:"GET",url:url}, this.service.name).then(resp=>{
        if(resp.code != 0||resp.data.total==0) {
            return;
        }
        var dt=new Date();
        this.purList=resp.data.list.map(l=>{
            dt.setTime(l.createAt);
            l.createAt=date2str(dt);
            return l;
        })
    })
},
save_base() {
    var dta=copyObj(this.dtl,['price']);
    dta['comment']=this.service.encodeExt(this.ext);
    dta.id=this.id;
    request({method:"POST",url:"/api/order/setInfo",data:dta}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.editBase=false;
    })
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
    var dta={customer:this.dtl.customer, order:this.id,
         cost:this.newService.cost};
    dta.comment=this.service.encodeExt(this.newService.ext);
    request({method:"POST",url:"/api/service/create",data:dta}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.serviceDlg=false;
        this.newService={cost:'',ext:[]};
        this.query_services(1);
    })
},
add_payment() {
    var dta=copyObj(this.newPayment, ["amount","bank"]);
    dta.order=this.id;
    dta.comment=this.service.encodeExt(this.newPayment.ext);
    request({method:"POST",url:"/api/payment/create",data:dta}, this.service.name).then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.paymentDlg=false;
        this.newPayment={amount:0,ext:[]};
        this.query_payments(1);
    })
},
order_flow(){
    var url='/workflow?flName=order&flow='+this.dtl.flowid
    +"&did="+this.id+"&dtlApi="+encodeURIComponent("/order/detail");
    this.service.goto(url);
},
menu_remove(){
    var msg=this.tags.cfmToDel+this.tags.order.title+' "'+this.dtl.cname+'-'+this.dtl.skuName+'"';
    this.$refs.confirmDlg.show(msg, ()=>{
        var opts={method:"DELETE",url:"/api/order/remove?id="+this.id};
        request(opts, this.service.name).then(resp=>{
            if(resp.code != 0) {
                this.$refs.errMsg.showErr(resp.code, resp.info);
            }else{
                this.service.go_back();
            }
        })
    })
},
open_new_payment() {
    this.service.template('payment').then(tmpl=> {
        //{a:{n:xxx,t:s/d/n},b:{}}
        this.newPayment.amount='';
        this.newPayment.bank='';
        this.newPayment.ext=this.service.decodeExt('{}',tmpl);
        this.visible.paymentDlg=true
    });
},
open_new_service() {
    this.service.template('service').then(tmpl => {
        //{a:{n:xxx,t:s/d/n},b:{}}
        this.newService.cost='';
        this.newService.ext=this.service.decodeExt('{}',tmpl);
        this.visible.serviceDlg=true
    })
},
show_purchase() {
    copyObjTo(EMPTY_PUR, this.purchase.dta);
    this.purchase.skus=[];
    this.purchase.sku={sku:{id:0,name:''},num:''};
    this.purchase.dlg=true;
},
purchase_do() {
    var pur=this.purchase.dta;
    var dta=copyObj(pur, ['receiver','descr','type']);
    dta.order=this.id;
    dta.expDate=parseInt(Date.parse(pur.expDate)/60000);
    dta.buyer=pur.buyer[0];
    dta.skus=this.purchase.skus;
    request({method:"POST", url:"/order/purchase", data:dta}, this.service.name).then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.purchase.dlg=false;
        this.query_purList();
    })
},
add_purchase_sku() {
    var sku=this.purchase.sku.sku;
    var num=this.purchase.sku.num;
    if(sku.id==0 || !num)return;
    this.purchase.skus.push({sku:sku.id,skuName:sku.name,num:num});
    this.purchase.sku.sku={id:0,name:''};
    this.purchase.sku.num='';
},
rmv_purchase_sku(i){
    this.purchase.skus.splice(i,1);
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
      <q-toolbar-title>{{dtl.cname}}-{{dtl.prjName}}</q-toolbar-title>
      <q-btn flat round dense icon="menu" v-if="dtl.editable">
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
  <template v-slot:action v-if="dtl.editable">
    <q-icon name="edit" color="primary" @click.stop="visible.editBase=true"></q-icon>
  </template>
</q-banner>
<q-list dense>
  <q-item clickable @click.stop="service.goto('/customer?id='+dtl.customer)">
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
  <q-item v-for="e in ext">
    <q-item-section>{{e.n}}</q-item-section>
    <q-item-section>{{e.v}}</q-item-section>
  </q-item>
  <q-item clickable @click.stop="service.goto('/ibf/prjproc?id='+dtl.pid)">
    <q-item-section>{{tags.order.prj}}</q-item-section>
    <q-item-section class="text-blue">{{dtl.prjName}}</q-item-section>
  </q-item>
</q-list>
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1">
{{tags.order.skuList}}
</q-banner>
<q-list dense separator>
 <q-item v-for="l in dtl.skus">
  <q-item-section>{{l.skuName}}</q-item-section>
  <q-item-section>{{l.num}}/{{l.sent}}</q-item-section>
  <q-item-section side>{{l.price}}</q-item-section>
 </q-item>
</q-list>

<!-- 采购记录 -->
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1">
 <template v-slot:avatar>
  <q-icon name="shopping_cart" color="primary" size="1em"></q-icon>
 </template>
 {{tags.purchase.title}}
 <template v-slot:action>
  <q-icon name="add_circle" color="primary" @click.stop="show_purchase"></q-icon>
 </template>
</q-banner>
<q-list separator dense>
 <q-item v-for="p in purList" clickable @click="ibf.purchaseFlow(p.flowid,p.purId)">
  <q-item-section>{{p.cmt}}</q-item-section>
  <q-item-section side>{{p.createAt}}</q-item-section>
 </q-item>
</q-list>

<!-- 服务记录列表 -->
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1" @click="more_services">
 <template v-slot:avatar>
  <q-icon :name="icons.service" color="primary" size="1em"></q-icon>
 </template>
 {{tags.service.title}}({{tags.order.service}}:{{dtl.cost}})
 <template v-slot:action>
  <q-icon name="add_circle" color="primary" @click.stop="open_new_service"></q-icon>
 </template>
</q-banner>
<div v-show="visible.service">
<q-list separator dense>
 <q-item v-for="s in services" clickable @click="service.goto('/service?id='+s.id)">
  <q-item-section>{{s.creator}}</q-item-section>
  <q-item-section>{{s.cost}}</q-item-section>
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
 <template v-slot:avatar>
  <q-icon :name="icons.payment" color="primary" size="1em"></q-icon>
 </template>
 {{tags.payment.title}}({{tags.order.payment}}:{{dtl.payment}},{{tags.order.needPay}}:{{dtl.needPay}})
 <template v-slot:action>
  <q-icon name="add_circle" color="primary" @click.stop="open_new_payment"></q-icon>
 </template>
</q-banner>
<div v-show="visible.payment">
<q-list separator dense>
 <q-item v-for="p in payments"  clickable @click="service.goto('/payment?id='+p.id)">
  <q-item-section>{{p.creator}}</q-item-section>
  <q-item-section>{{p.amount}}</q-item-section>
  <q-item-section>{{p.createAt}} / {{p.cfmAt}}</q-item-section>
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
        <q-input :label="tags.service.cost" v-model.number="newService.cost" dense></q-input>
      </q-item-section></q-item>
      <!-- ext/comment -->
      <q-item v-for="e in newService.ext"><q-item-section>
        <div v-if="e.t=='d'">
          <component-date-input :close="tags.ok" :label="e.n" v-model="e.v"></component-date-input>
        </div>
        <div v-else-if="e.t=='b'">
          <q-checkbox v-model="e.v" :label="e.n" left-label></q-checkbox>
        </div>
        <div v-else>
         <q-input :label="e.n" v-model="e.v" dense :autogrow="e.t!='n'"
          :type="e.t=='n'?'number':'textarea'"></q-input>
        </div>
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
       <bank-select :label="tags.payment.bank" v-model="newPayment.bank" dense></bank-select>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input :label="tags.payment.amount" v-model="newPayment.amount" type="number" dense></q-input>
      </q-item-section></q-item>
      <!-- ext/comment -->
      <q-item v-for="e in newPayment.ext"><q-item-section>
        <div v-if="e.t=='d'">
          <component-date-input :close="tags.ok" :label="e.n" v-model="e.v"></component-date-input>
        </div>
        <div v-else-if="e.t=='b'">
          <q-checkbox v-model="e.v" :label="e.n" left-label></q-checkbox>
        </div>
        <div v-else>
         <q-input :label="e.n" v-model="e.v" dense :autogrow="e.t!='n'"
          :type="e.t=='n'?'number':'textarea'"></q-input>
        </div>
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
<q-dialog v-model="visible.editBase" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.baseInfo}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list dense>
      <q-item><q-item-section>{{dtl.cname}}</q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.order.price" v-model="dtl.price" dense></q-input>
      </q-item-section></q-item>
      <q-item v-for="e in ext"><q-item-section>
        <div v-if="e.t=='d'">
          <component-date-input :close="tags.ok" :label="e.k" v-model="e.v"></component-date-input>
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

<!-- 新建采购单 -->
<q-dialog v-model="purchase.dlg">
<q-card style="min-width:70vw">
 <q-card-section>
  <div class="text-h6">{{tags.purchase.title}}</div>
 </q-card-section>
 <q-card-section class="q-pt-none">
  <q-input v-model="purchase.dta.receiver" dense
   :label="tags.purchase.receiver"></q-input>
  <component-date-input v-model="purchase.dta.expDate" :format="tags.dateFmt"
  :label="tags.purchase.expDate" min="today"></component-date-input>
  <component-user-selector :accounts="purchase.dta.buyer"
  :label="tags.purchase.buyer"></component-user-selector>
  <q-input v-model="purchase.dta.descr" :label="tags.cmt" dense></q-input>
  <q-banner inline-actions class="bg-indigo-1 q-mt-sm" dense>
    {{tags.purchase.skuList}}
  </q-banner>
  <q-list>
   <q-item clickable v-for="(s,i) in purchase.skus">
    <q-item-section>{{s.skuName}}</q-item-section>
    <q-item-section>{{s.num}}</q-item-section>
    <q-item-section side>
     <q-icon color="red" name="clear" @click="rmv_purchase_sku(i)"></q-icon>
    </q-item-section>
   </q-item>
   <q-item>
    <q-item-section>
     <component-sku-selector v-model="purchase.sku.sku"
      :label="tags.purchase.sku"></component-sku-selector>
    </q-item-section>
    <q-item-section>
     <q-input v-model.number="purchase.sku.num" :label="tags.order.skuNum" dense></q-input>
    </q-item-section>
    <q-item-section side>
     <q-icon name="add_circle" @click="add_purchase_sku" color="primary"></q-icon>
    </q-item-section>
   </q-item>
  </q-list>
 </q-card-section>
 <q-card-actions align="right">
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
   <q-btn :label="tags.ok" color="primary" @click="purchase_do"></q-btn>
 </q-card-actions>
</q-card>
</q-dialog>
`
}