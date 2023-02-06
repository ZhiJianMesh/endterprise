export default {
inject:['service', 'tags'],
data() {return {
    isOwner:false,
    vips:[], //会员列表
    search:'',
    curVipPg:1,
    maxVipPgs:0,
    newVip:{name:'',mobile:'',pwd:''},
    newConsume:{order:0,pwd:'',val:'',vip:0,comment:''},
    orders:[], //消费时，查询某个vip的所有订单
    curOrderPg:1,
    maxOrderPgs:0,
    newVipDlg:false,
    newConsumeDlg:false,
    curVip:0, //当前点击的会员，用于alert中
    message:'',
    resetFun:null //让滑动菜单归位的函数
}},
created(){
    var url="/grp/getrole?service="+this.service.name;
    request({method:"GET",url:url}, SERVICE_USER).then(function(resp){
        if(resp.code!=0) {
            Console.warn("request "+url+" failed:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.isOwner=resp.data.role=='admin';
    }.bind(this)); 
    this.query_vips(0);
},
methods:{
query_vips(offset) {
    this.search="";
    var url="/api/vip/list?offset="+offset+"&num="+this.service.NUM_PER_PAGE;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=RetCode.OK) {
            this.vips=[];
            this.maxVipPgs=0;
        } else {
            this.vips=resp.data.vips;
            this.maxVipPgs=Math.ceil(resp.data.total/this.service.NUM_PER_PAGE);
        }
    }.bind(this))
},
search_vips() {
    if(this.search=='') {
        this.query_vips(0);
        return;
    }
    var url="/api/vip/search?s="+this.search+"&limit="+this.service.NUM_PER_PAGE
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.vips=resp.data.vips;
        this.maxVipPgs=1;
    }.bind(this))
},
jumpTo(url) {
    this.resetFun=null;//避免跳页时再执行它，导致异常
    this.$router.push(url);
},
add_vip() {
    var url="/api/vip/add";
    request({method:"POST",url:url,data:this.newVip}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.newVipDlg=false;
        this.query_vips(0);
    }.bind(this))
},
change_vip_page(page) {
    this.query_vips((parseInt(page)-1)*this.service.NUM_PER_PAGE);
},
on_slide({reset}) {
    this.hide_slider();//关闭已经打开的，如果有
    this.resetFun=reset;
},
hide_slider() {
    if(!this.resetFun || typeof(this.resetFun) !== 'function') {
        return;
    }
    try{
        this.resetFun();
    }catch(e) {
        console.error(e);
    }finally{
        this.resetFun=null;
    }
},
query_orders(offset,done) {
    var url="/api/order/validOrders?vip="+this.curVip+"&offset="+offset+"&num="+this.service.NUM_PER_SMPG;
    request({method:"GET", url:url}, this.service.name).then(function(resp){
        if(resp.code==RetCode.OK) {
            this.maxOrderPgs=Math.ceil(resp.data.total/this.service.NUM_PER_SMPG);
            this.orders=resp.data.orders;
        }
        done(true);
    }.bind(this));
},
change_order_page(page) {
    this.query_orders((parseInt(page)-1)*this.service.NUM_PER_SMPG,function(){});
},
open_create_consume(vip){
    this.curVip=vip;
    this.newConsume={order:-1,val:'',pwd:'',vip:vip};
    this.orders=[];
    this.query_orders(0,function(){
        if(this.orders.length<=0) {
            this.$refs.errMsg.show(this.tags.noOrders);
            return;
        }
        this.newConsume.order=this.orders[0].id;
        this.newConsumeDlg=true;
    }.bind(this))
},
create_consume(){
    var url="/api/consume/create";
    request({method:"POST",url:url,data:this.newConsume}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.newConsumeDlg=false;
    }.bind(this))
},
on_load_orders(offset,done){
    this.query_orders(this.newConsume.vip,offset,done);
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
    <q-avatar square><img src="./favicon.png"></q-avatar>
    <q-toolbar-title>{{tags.app_name}}</q-toolbar-title>
    <q-btn flat round dense icon="menu" v-if="isOwner">
     <q-menu>
      <q-list style="min-width: 100px">
        <q-item clickable v-close-popup @click="jumpTo('/settings')">
          <q-item-section>{{tags.settings}}</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="jumpTo('/employees?service=member&proxy=%2Fapi%2Fproxy%2Femployee')">
          <q-item-section>{{tags.employees}}</q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable v-close-popup @click="jumpTo('/reports')">
          <q-item-section>{{tags.reports}}</q-item-section>
        </q-item>
       </q-list>
     </q-menu>
    </q-btn>
   </q-toolbar>
  </q-header>
  <q-footer class="bg-white q-px-md q-pt-md">
    <q-input outlined bottom-slots v-model="search" :label="tags.search" dense>
    <template v-slot:append>
      <q-icon v-if="search!==''" name="close" @click="query_vips(0)" class="cursor-pointer"></q-icon>
      <q-icon name="search" @click="search_vips"></q-icon>
    </template>
    <template v-slot:after>
      <q-btn round color="primary" icon="add_circle"
       @click="newVip={name:'',mobile:'',pwd:''};newVipDlg=true;"></q-btn>
    </template>
    </q-input>
  </q-footer>

  <q-page-container>
    <q-page class="q-pa-md">
<div class="q-pa-lg flex flex-center" v-if="maxVipPgs>1">
 <q-pagination v-model="curVipPg" color="primary" :max="maxVipPgs" max-pages="10"
  boundary-numbers="false" @update:model-value="change_vip_page"></q-pagination>
</div>
<q-list separator>
  <q-slide-item @right="on_slide" @click="hide_slider" v-for="v in vips" right-color="purple">
    <template v-slot:right>
      <q-icon name="payment" @click="open_create_consume(v.id)" class="q-mr-md"></q-icon> 
      <q-icon name="person_pin_circle" @click="jumpTo('/vip?id='+v.id)"></q-icon> 
    </template>

    <q-item>
      <q-item-section>{{v.name}}</q-item-section>
      <q-item-section>{{v.mobile}}</q-item-section>
      <q-item-section>{{v.update_time}}</q-item-section>
    </q-item>
 </q-slide-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>
    
<q-dialog v-model="newVipDlg">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.addVip}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-input v-model="newVip.name" :label="tags.name" dense
     :rules="[v=>v!=''|| tags.namePls]"></q-input>
     <q-input v-model="newVip.mobile" :label="tags.mobile" maxlength=11
     :rules="[v=>/^1[0-9]{10}$/.test(v)|| tags.mobilePls]" dense></q-input>
     <q-input v-model="newVip.pwd" :label="tags.pwd" type="password" dense
     :rules="[/^[0-9]{4,20}$/.test(v)|| tags.pwdPls]"></q-input>
    </q-card-section>
    <q-card-section class="q-pt-none">{{message}}</q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="tags.ok" color="primary" @click="add_vip"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<q-dialog v-model="newConsumeDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
      <div class="text-h6">{{tags.addConsume}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
    <q-list>
     <q-item v-for="o in orders">
      <q-item-section>
       <q-radio dense v-model="newConsume.order" :val="o.id" :label="o.pkgName" ></q-radio>
      </q-item-section>
      <q-item-section>{{o.balance}}</q-item-section>
      <q-item-section>{{o.createAt}}</q-item-section>
     </q-item>
    </q-list>
    <div class="q-pa-lg flex flex-center" v-if="maxOrderPgs>1">
    <q-pagination v-model="curOrderPg" color="primary" :max="maxOrderPgs" max-pages="10"
     boundary-numbers="false" @update:model-value="change_order_page"></q-pagination>
    </div>
    <q-input v-model="newConsume.val" :label="tags.consumeVal" dense
     :rules="[v=>/^[0-9]+(.[0-9]{1,2})?$/.test(v)|| tags.numberPls]"></q-input>
    <q-input v-model="newConsume.pwd" :label="tags.pwd" type="password" dense
     :rules="[v=>/^[0-9]{4,20}$/.test(v)|| tags.pwdPls]"></q-input>
    <q-input v-model="newConsume.comment" :label="tags.comment" dense
     type="textarea" autogrow></q-input>
  </q-card-section>
  <q-card-section class="q-pt-none">{{message}}</q-card-section>
  <q-card-actions align="right">
     <q-btn flat :label="tags.ok" color="primary" @click="create_consume"></q-btn>
     <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}