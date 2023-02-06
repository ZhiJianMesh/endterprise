export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    orderNum:0,
    curPage:1,
    maxPages:0,
    orders:[], //id,createAt,pkgName,balance
    vip:{name:'',createAt:'',mobile:'',ext:{},creator:0},
    ext:{},
    creatorName:'',
    newOrder:{pkgId:'',pwd:'',price:0,vip:0},
    newOrderDlg:false,
    chkOrderDlg:false,
    chkOrder:{id:'',pwd:'',createAt:'',balance:0},
    chkOrderResult:2,//不显示结果
    packages:[],
    packageOpts:[],
    isMore:false,
    tmpl:{},
    extChanged:false
}},
created(){
    this.query_orders(0);
    this.service.getTemplate().then(function(tpl) {
        this.tmpl=tpl;
        this.query_info(); //放在template之后，是为了防止无template情况下，解析ext
    }.bind(this)).catch(function(err) {
        Console.info(err);
    });
},
methods:{
query_info() {
    var url="/api/vip/get?id="+this.id;
    request({method:"GET", url:url},this.service.name).then(function(resp){
        if(resp.code != 0) {
            Console.info("Url:" + url + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.vip=resp.data;//creator,createAt,name,mobile,ext
        this.get_creator(this.vip.creator);
        this.ext=resp.data.ext;
    }.bind(this));
},
query_orders(offset) {
    var url="/api/order/list?vip="+this.id+"&offset="+offset+"&num="+this.service.NUM_PER_SMPG;
    request({method:"GET", url:url}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            Console.info("Url:" + url + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.orders=resp.data.orders;
        this.orderNum=resp.data.total;
        this.maxPages=Math.ceil(resp.data.total/this.service.NUM_PER_SMPG);
    }.bind(this));
},
get_creator(uid) {
    var opts={method:"GET",url:"/api/getNickName?uid="+uid};
    request(opts, SERVICE_USER).then(function(resp){
        if(resp.code != 0) {
            Console.info("Url:" + url + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.creatorName=resp.data.nickName;
    }.bind(this));
},
change_page(page) {
    this.query_orders((parseInt(page)-1)*this.service.NUM_PER_SMPG);
},
save_base(v, v0){
    var opts={method:"POST", url:"/api/vip/setBase",data:{id:this.id,name:v.name,mobile:v.mobile}};
    request(opts, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.vip.name=v.name;
        this.vip.mobile=v.mobile;
    }.bind(this));
},
create_order() {
    var url="/api/order/create";
    request({method:"POST",url:url,data:this.newOrder}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.newOrderDlg=false;
        this.query_orders(0);
    }.bind(this))
},
open_crt_order(){
    this.service.getPackages().then(function(data){
        this.packages=data.pkgs;
        this.packageOpts=data.opts;
        this.newOrderDlg=true;
        var pkg=this.packages[0];
        this.newOrder={pkgId:pkg.id,pwd:'',vip:this.id,price:pkg.price};
    }.bind(this)).catch(function(err) {
        Console.info(err);
    });
},
pkg_changed(pkgId) {
    for(var k in this.packages) {
        if(pkgId==this.packages[k].id) {
            this.newOrder.price=this.packages[k].price;
            break;
        }
    }
},
save_ext() {
    var url="/api/vip/setExt";
    var req={id:this.id,ext:this.ext};
    request({method:"POST",url:url,data:req}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.extChanged=false;
    }.bind(this))
},
open_check_order(o){
    this.chkOrder={id:o.id,pwd:'',createAt:o.createAt,balance:o.balance};
    this.chkOrderResult=2;
    this.chkOrderDlg=true;
},
check_order(){
    var url="/api/order/check";
    var req={id:this.chkOrder.id,pwd:this.chkOrder.pwd};
    request({method:"POST",url:url,data:req}, this.service.name).then(function(resp){
        if(resp&&resp.code==0){
            this.chkOrderResult=0;
        }else {
            this.chkOrderResult=1;
        }
    }.bind(this))
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{vip.name}}</q-toolbar-title>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-px-md q-pb-lg">
<q-banner dense inline-actions class="q-mb-md text-dark bg-blue-grey-1">
  {{vip.name}}   {{vip.mobile}}
  <template v-slot:action>
    <q-icon name="edit" color="primary"></q-icon>
    <q-popup-edit v-model="vip" cover="false" buttons auto-save v-slot="scope"
      @save="save_base" :label-set="tags.save" :label-cancel="tags.cancel">
      <q-input color="accent" v-model="scope.value.name" dense autofocus>
       <template v-slot:prepend><q-icon name="person"></q-icon></template>
      </q-input>
      <q-input color="accent" v-model="scope.value.mobile" dense 
      :rules="[v=>/^1[0-9]{10}$/.test(v)||tags.mobilePls]">
       <template v-slot:prepend><q-icon name="contact_phone"></q-icon></template>
      </q-input>
    </q-popup-edit>
  </template>
</q-banner>

<div class="q-gutter-md">
<q-chip><q-avatar icon="date_range" color="primary" text-color="white"></q-avatar>{{vip.createAt}}</q-chip>
</div>
<div class="q-gutter-md">
<q-chip><q-avatar icon="person_add" color="primary" text-color="white"></q-avatar>{{creatorName}}</q-chip>
</div>

<q-banner dense inline-actions class="q-my-md text-dark bg-blue-grey-1">
 {{tags.more}}
 <template v-slot:action>
  <q-icon name="done_all" color="primary" @click="save_ext" v-show="extChanged" class="q-mr-md"></q-icon>
  <q-icon :name="isMore?'expand_less':'expand_more'" color="primary" @click="isMore=!isMore"></q-icon>
 </template>
</q-banner>
<q-list v-show="isMore">
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

<q-banner dense inline-actions class="q-mb-md text-dark bg-blue-grey-1">
{{tags.orders}}
  <template v-slot:action>
    <q-icon name="add_circle" color="primary" @click="open_crt_order"></q-icon>
  </template>
</q-banner>
<q-list separator>
  <q-item v-for="o in orders">
      <q-item-section>{{o.pkgName}}</q-item-section>
      <q-item-section>{{o.balance}}</q-item-section>
      <q-item-section>{{o.price}}</q-item-section>
      <q-item-section>{{o.createAt}}</q-item-section>
      <q-item-section avatar><q-icon name="list" @click="service.jumpTo('/consumelogs?orderId='+o.id)" color="primary"></q-btn></q-item-section>
      <q-item-section avatar><q-icon name="security" @click="open_check_order(o)" color="primary"></q-btn></q-item-section>
  </q-item>
</q-list>
<div class="q-pa-lg flex flex-center" v-if="maxPages>1">
 <q-pagination v-model="curPage" color="black" :max="maxPages" max-pages="10"
  boundary-numbers="false" @update:model-value="change_page"></q-pagination>
</div>
    </q-page>
  </q-page-container>
</q-layout>

<!-- 新建订单弹窗 -->
<q-dialog v-model="newOrderDlg">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.addOrder}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-select v-model="newOrder.pkgId" emit-value map-options
     :options="packageOpts" @update:model-value="pkg_changed"></q-select>
     <q-input v-model="newOrder.price" :label="tags.payment" dense
     :rules="[v=>/^[0-9]+(\\.[0-9]{1,2})?$/.test(v)|| tags.numberPls]"></q-input>
     <q-input v-model="newOrder.pwd" :label="tags.pwd" type="password" dense
     :rules="[v=>/^[0-9]{4,20}$/.test(v)|| tags.pwdPls]"></q-input>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="tags.ok" color="primary" @click="create_order"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
<!-- 校验弹窗 -->
<q-dialog v-model="chkOrderDlg">
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.checkOrder}}</div>
    </q-card-section>
    <q-card-section dense horizontal>
     <q-card-section>
      <q-list>
      <q-item>
       <q-item-section>{{tags.createAt}}</q-item-section>
       <q-item-section no-wrap>{{chkOrder.createAt}}</q-item-section>
      </q-item>
      <q-item>
       <q-item-section>{{tags.balance}}</q-item-section>
       <q-item-section>{{chkOrder.balance}}</q-item-section>
      </q-item>
      <q-item>
       <q-item-section>{{tags.pwd}}</q-item-section>
       <q-item-section>
        <q-input v-model="chkOrder.pwd" type="password" dense maxlength=11
        :rules="[v=>/^[0-9]{4,20}$/.test(v)||tags.pwdPls]"></q-input>
       </q-item-section>
      </q-item>
     </q-card-section>
     <q-card-section>
        <q-card-section v-if="chkOrderResult==0">
         <div align="center"><q-icon name="verified_user" style="font-size:4rem;" class="text-teal"></q-icon></div>
         <div>{{tags.checkOk}}</div>
        </q-card-section>
        <q-card-section v-if="chkOrderResult==1">
         <div align="center"><q-icon name="warning" style="font-size:4rem;" class="text-red"></q-icon></div>
         <div>{{tags.checkFailed}}</div>
        </q-card-section>
        <q-card-section v-if="chkOrderResult==2">
         <div align="center"><q-icon name="security" style="font-size:4rem;" class="text-primary"></q-icon></div>
         <div>{{tags.checking}}</div>
        </q-card-section>        
     </q-card-section>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat :label="tags.checkOrder" color="primary" @click="check_order"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}