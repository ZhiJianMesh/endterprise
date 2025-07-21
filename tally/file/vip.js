const EMPTY_ORDER={val:'',vip:0,cmt:'',bankAcc:''}
const EMPTY_SERVICE={val:'',vip:0,cmt:'',suppplier:{}}
import OrderDlg from "./orderdlg.js"
import ServiceDlg from "./servicedlg.js"

export default {
components:{
    "order-dlg":OrderDlg,
    "service-dlg":ServiceDlg
},
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
	ctrl:{ord:{cur:1,max:0,total:0},srv:{cur:1,max:0,total:0},showMore:false},
    orders:[], //id,createAt,val,state,creator
    services:[], //id,createAt,val,state,creator,supplier
    vip:{name:'',createAt:'',mobile:'',ext:{},creator:'',sex:'U',birth:'',age:0,code:''},
    ext:{},
    newOrder:{},
	newService:{supplier:{},busy:false},
	dlgs:{order:false,service:false}, 
    tmpl:{},
    extChanged:false,
    alertDlg:null,
    confirmDlg:null,
    role:''
}},
created(){
	this.newOrder.vip=this.id;
    this.newService.vip=this.id;
    this.service.getTemplate().then(tpl=>{
        this.tmpl=tpl;
        this.query_info(); //放在template之后，是为了防止无template情况下，不能解析ext
    })
    this.query_orders(1);
    this.query_services(1);
    this.service.getRole().then(role=>{
        this.role=role;
    })
},
mounted(){//不能在created中赋值，更不能在data中
    this.alertDlg=this.$refs.errMsg;
    this.confirmDlg=this.$refs.confirmDlg;
},
methods:{
query_info() {
    var url="/api/vip/get?id="+this.id;
    request({method:"GET", url:url},this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.vip=resp.data;//creator,createAt,name,mobile,ext,sex,birth
		var d=new Date();
		var year=d.getYear();
		d.setTime(this.vip.birth*86400000);
        this.vip.birth=date2str(d);
		this.vip.age=year-d.getYear();
        d.setTime(this.vip.createAt*60000);
        this.vip.createAt=datetime2str(d);
        this.ext=!resp.data.ext?{}:resp.data.ext;
    })
},
query_orders(pg) {
    var offset=(parseInt(pg)-1)*this.service.NUM_PER_SMPG;
    var url="/api/order/list?vip="+this.id+"&offset="+offset+"&num="+this.service.NUM_PER_SMPG;
    request({method:"GET", url:url}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.orders=[];
            Console.info("Url:" + url + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        var dt=new Date();
        var cols=resp.data.cols;
        this.orders=resp.data.list.map(l=>{
            var o={};
            for(var i in cols) {
                o[cols[i]]=l[i];
            }
            dt.setTime(o.createAt*60000);
            o.createAt=datetime2str(dt);
            o.state_s=this.tags.osState[o.state];
            return o;
        });
        this.ctrl.ord.total=resp.data.total;
        this.ctrl.ord.val=resp.data.val;
        this.ctrl.ord.max=Math.ceil(resp.data.total/this.service.NUM_PER_SMPG);
    });
},
query_services(pg) {
    var offset=(parseInt(pg)-1)*this.service.NUM_PER_SMPG;
    var url="/api/service/list?vip="+this.id+"&offset="+offset+"&num="+this.service.NUM_PER_SMPG;
    request({method:"GET", url:url}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.services=[];
            Console.info("Url:" + url + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        var dt=new Date();
        var cols=resp.data.cols;
        this.services=resp.data.list.map(l=>{
            var s={};
            for(var i in cols) {
                s[cols[i]]=l[i];
            }
            dt.setTime(s.createAt*60000);
            s.createAt=datetime2str(dt);
            s.interval=(s.end>s.start?(s.end-s.start):0)+this.tags.service.unit;
            if(s.start<=0) {
                s.start=this.tags.service.notStart;
            } else {
                dt.setTime(s.start*60000);
                s.start=datetime2str(dt);
            }
            if(s.end<=0) {
                s.end=this.tags.service.notEnd;
            } else {
                dt.setTime(s.end*60000);
                s.end=datetime2str(dt);
            }
            s.state_s=this.tags.osState[s.state];
            return s;
        });

        this.ctrl.srv.total=resp.data.total;
        this.ctrl.srv.val=resp.data.val;
        this.ctrl.srv.max=Math.ceil(resp.data.total/this.service.NUM_PER_SMPG);
    });
},
save_base(v, _v0){
	var birth=new Date(v.birth);
	var reqDta={id:this.id, name:v.name, mobile:v.mobile, sex:v.sex, code:v.code,
        birth:Math.round(birth.getTime()/86400000)};
    var opts={method:"POST", url:"/api/vip/setBase",data:reqDta};
    request(opts, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.vip.name=v.name;
        this.vip.mobile=v.mobile;
		this.vip.sex=v.sex;
		this.vip.birth=v.birth;
		this.vip.age=new Date().getYear() - birth.getYear();
    })
},
create_order() {
    var url="/api/order/create";
    request({method:"POST",url:url,data:this.newOrder}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dlgs.order=false;
        this.query_orders(1);
    })
},
show_order(id) {
    this.$refs.orderDlg.show(id);
},
open_create_order(){
    copyObjTo(EMPTY_ORDER, this.newOrder);
    this.newOrder.vip=this.id;
    this.dlgs.order=true;
},
save_ext() {
    var url="/api/vip/setExt";
    var req={id:this.id,ext:this.ext};
    request({method:"POST",url:url,data:req}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.extChanged=false;
    })
},
open_create_service() {
    copyObjTo(EMPTY_SERVICE, this.newService);
	this.dlgs.service=true;
},
create_service(){
    var url="/api/service/create";
    var reqDta=copyObj(this.newService, ['val','cmt']);
    reqDta.vip=this.id;
    reqDta.supplier=this.newService.supplier.account;
    request({method:"POST",url:url,data:reqDta}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dlgs.service=false;
        this.query_services(1);
    })
},
show_service(id) {
    this.$refs.serviceDlg.show(id);
},
order_done() {
    this.query_info();
    this.query_orders(1);
},
service_done(r) {
    if(r.act=='cfm') {
        this.query_info();
    }
    this.query_services(1);
},
check_busy(acc) {
    var url="/api/service/isBusy?account="+acc.account;
    request({method:"GET",url:url}, this.service.name).then(resp=>{
        this.newService.busy=resp.code==RetCode.OK;
    })
}
},

template:`
<q-layout view="hHh lpr fFf">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.back"></q-btn>
      <q-toolbar-title>{{vip.name}}/{{vip.code}}</q-toolbar-title>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-px-none">
<q-banner dense inline-actions class="text-dark bg-blue-grey-1">
  {{vip.name}}<q-icon :name="tags.sexInfo[vip.sex].i" color="primary" size="1.5em"></q-icon>({{vip.age}}{{tags.age}})
  <template v-slot:action>
    <q-icon name="edit" color="primary"></q-icon>
    <q-popup-edit v-model="vip" cover="false" buttons auto-save v-slot="scope"
      @save="save_base" :label-set="tags.save" :label-cancel="tags.cancel" style="min-width:40vw">
      <q-input v-model="scope.value.name" dense autofocus>
       <template v-slot:append><q-icon name="person" color="accent"></q-icon></template>
      </q-input>
      <div class="q-gutter-sm">
       <q-radio v-model="scope.value.sex" val="M" :label="tags.sexInfo.M.n"></q-radio>
       <q-radio v-model="scope.value.sex" val="F" :label="tags.sexInfo.F.n"></q-radio>
       <q-radio v-model="scope.value.sex" val="U" :label="tags.sexInfo.U.n"></q-radio>
      </div>
      <q-input v-model="scope.value.code" dense :label="tags.vip.code"></q-input>
      <q-input v-model="scope.value.mobile" dense :label="tags.mobile"
      :rules="[v=>/^1[0-9]{10}$/.test(v)||tags.mobilePls]">
       <template v-slot:append>
        <q-icon name="contact_phone" color="accent"></q-icon>
       </template>
      </q-input>
 	  <component-date-input :close="tags.ok" :label="tags.birth"
       v-model="scope.value.birth" max="today"></component-date-input>
    </q-popup-edit>
  </template>
</q-banner>
<q-list>
 <q-item>
  <q-item-section avatar><q-icon name="date_range" color="primary"></q-icon></q-item-section>
  <q-item-section>{{tags.createAt}}</q-item-section>
  <q-item-section side>{{vip.createAt}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section avatar><q-icon name="person_add" color="primary"></q-icon></q-item-section>
  <q-item-section>{{tags.creator}}</q-item-section>
  <q-item-section side>{{vip.creator}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section avatar><q-icon name="contact_phone" color="accent"></q-icon></q-item-section>
  <q-item-section>{{tags.mobile}}</q-item-section>
  <q-item-section side>{{vip.mobile}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section avatar><q-icon name="cake" color="primary"></q-icon></q-item-section>
  <q-item-section>{{tags.birth}}</q-item-section>
  <q-item-section side>{{vip.birth}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section avatar><q-icon name="monetization_on" color="orange"></q-icon></q-item-section>
  <q-item-section>{{tags.vip.total}}</q-item-section>
  <q-item-section side>{{vip.total}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section avatar><q-icon name="attach_money" color="amber"></q-icon></q-item-section>
  <q-item-section>{{tags.vip.balance}}</q-item-section>
  <q-item-section side>{{vip.balance}}</q-item-section>
 </q-item>
</q-list>

<q-banner dense inline-actions class="q-mt-md text-dark bg-blue-grey-1">
 {{tags.more}}
 <template v-slot:action>
  <q-icon name="done_all" color="primary" @click="save_ext" v-show="extChanged" class="q-mr-md"></q-icon>
  <q-icon :name="ctrl.showMore?'expand_less':'expand_more'" color="primary" @click="ctrl.showMore=!ctrl.showMore"></q-icon>
 </template>
</q-banner>
<q-list v-show="ctrl.showMore" dense>
  <q-item v-for="(tpl,k) in tmpl">
   <q-item-section>
    <div v-if="tpl.t=='d'">
      <component-date-input :close="tags.ok" :label="tpl.n" v-model="ext[k]"
      @update:model-value="extChanged=true"></component-date-input>
    </div>
    <div v-else-if="tpl.t=='b'">
      <q-checkbox v-model="ext[k]" :label="tpl.n" left-label 
      @update:model-value="extChanged=true"></q-checkbox>
    </div>
    <div v-else>
     <q-input borderless :label="tpl.n" v-model="ext[k]" dense :autogrow="tpl.t!='n'"
      :type="tpl.t=='n'?'number':'textarea'"
      @update:model-value="extChanged=true"></q-input>
    </div>
   </q-item-section>
  </q-item>
</q-list>

<q-banner dense inline-actions class="q-mt-md text-dark bg-blue-grey-1">
{{tags.order.title}} ({{ctrl.ord.val}}/{{ctrl.ord.total}})
  <template v-slot:action>
    <q-icon name="add_circle" color="primary" @click="open_create_order"></q-icon>
  </template>
</q-banner>
<q-list separator dense>
 <q-item v-for="o in orders" clickable @click="show_order(o.id)">
  <q-item-section>
   <q-item-label>{{o.creator}}</q-item-label>
   <q-item-label caption>{{o.createAt}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label>{{o.bankAcc}}</q-item-label>
   <q-item-label caption>{{o.cmt}}</q-item-label>
  </q-item-section>
  <q-item-section side>
   <q-item-label>{{o.val}}</q-item-label>
   <q-item-label :class="o.state=='OK'?'text-caption':'text-primary'">{{o.state_s}}</q-item-label>
  </q-item-section>
 </q-item>
</q-list>
<div class="q-pa-lg flex flex-center" v-if="ctrl.ord.max>1">
 <q-pagination v-model="ctrl.ord.cur" color="primary" :max="ctrl.ord.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_orders"></q-pagination>
</div>

<q-banner dense inline-actions class="q-mt-md text-dark bg-blue-grey-1">
{{tags.service.title}} ({{ctrl.srv.val}}/{{ctrl.srv.total}})
  <template v-slot:action>
   <q-icon name="add_circle" color="primary" @click="open_create_service"></q-icon>
  </template>
</q-banner>
<q-list separator dense>
 <q-item v-for="s in services" clickable @click="show_service(s.id)">
  <q-item-section>
   <q-item-label>{{s.creator}}</q-item-label>
   <q-item-label caption>{{s.createAt}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label>{{s.supplier}}</q-item-label>
   <q-item-label caption>{{s.cmt}}</q-item-label>
  </q-item-section>
  <q-item-section>
   <q-item-label>{{s.start}}->{{s.end}}</q-item-label>
   <q-item-label caption>{{s.interval}}</q-item-label>
  </q-item-section>
  <q-item-section side>
   <q-item-label>{{s.val}}</q-item-label>
   <q-item-label :class="s.state=='OK'?'text-caption':'text-primary'">{{s.state_s}}</q-item-label>
  </q-item-section>
 </q-item>
</q-list>
<div class="q-pa-lg flex flex-center" v-if="ctrl.srv.max>1">
 <q-pagination v-model="ctrl.srv.cur" color="primary" :max="ctrl.srv.max" max-pages="10"
  boundary-numbers="false" @update:model-value="query_services"></q-pagination>
</div>
    </q-page>
  </q-page-container>
</q-layout>

<!-- 新建订单弹窗 -->
<q-dialog v-model="dlgs.order">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.addOrder}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-input v-model="newOrder.bankAcc" :label="tags.order.bankAcc" dense></q-input>
     <q-input v-model.number="newOrder.val" :label="tags.order.val" dense></q-input>
     <q-input v-model="newOrder.cmt" :label="tags.cmt" dense></q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="tags.ok" color="primary" @click="create_order"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<!-- 新建服务弹窗 -->
<q-dialog v-model="dlgs.service">
 <q-card style="min-width:70vw">
  <q-card-section>
   <div class="text-h6">{{tags.addService}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
    <q-input v-model.number="newService.val" :label="tags.serviceVal" dense></q-input>
    <component-user-input :label="tags.supplier" v-model="newService.supplier"
     @update:modelValue="check_busy"></component-user-input>
    <div v-if="newService.busy" class="text-red text-body2">
    {{tags.service.busy}}
    </div>
    <q-input v-model="newService.cmt" :label="tags.cmt" dense autogrow></q-input>
  </q-card-section>
  <q-card-actions align="right">
     <q-btn flat :label="tags.ok" color="primary" @click="create_service"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<order-dlg :tags="tags" :alertDlg="alertDlg" :confirmDlg="confirmDlg" :role="role" :service="service.name" @done="order_done" ref="orderDlg"></order-dlg>
<service-dlg :tags="tags" :alertDlg="alertDlg" :confirmDlg="confirmDlg" :role="role" :service="service.name" @done="service_done" ref="serviceDlg"></service-dlg>
<component-confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></component-confirm-dialog>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" ref="errMsg"></component-alert-dialog>
`
}