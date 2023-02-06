export default {
inject:['service', 'tags', 'icons'],
data() {return {
    id:this.$route.query.id,
    tmpl:{}, //客户模板，{k:"x",n:"y",t:"z"}...
    ordTmpl:{}, //订单模板，{k:"x",n:"y",t:"z"}...
    cntTmpl:{}, //联系人模板，{k:"x",n:"y",t:"z"}...
    
    dtl:{}, //详情name,address,createAt,creator,taxid,flowid,status,business,comment
    ext:{}, //从客户的comment转化而来
    orders:[], //id,createAt,price,skuName,creator
    contacts:[], //id,name,post,createAt
    touchlogs:[], //comment,createAt,creator
    skus:[],//id,no,name,price,lowest
    shares:[],
    relationChart:null,
    curDate:'',//当前时间，用在分享界面
    
    newOrder:{skuId:0,price:0,nextSigners:[],ext:{}},
    newContact:{name:'',sex:"0",level:0,phone:'',address:'',post:'',
                birthday:this.tags.date2str(new Date()),ext:{}},
    newTl:{n:'',t:0,tp:0,cid:0,cmt:''},
    newShare:{endT:'',to:[],power:"S"},
    
    page:{contact:1,curContact:1,touchlog:1,curTl:1,order:1,curOrder:1},
    visible:{editBase:false, order:false, contact:false, touchlog:false,
        newOrd:false, newContact:false, newTl:false,
        share:false, newShare:false, deliver:false, relation:false},
    visSegs:["name","taxid","address","business","creator","ordNum","createAt"] //控制哪些字段需要显示
}},
created(){
    this.curDate=this.tags.date2str(new Date());
    this.detail();
},
methods:{
detail() {
    var url="/api/customer/detail?id="+this.id;
    request({method:"GET", url:url}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.dtl=resp.data;//id,name,address,creator,createAt,ordNum,taxid,flowid,status,comment,power
        this.dtl.createAt=this.tags.date2str(new Date(parseInt(resp.data.createAt)));
        this.dtl.icon=this.tags.sta2icon(this.dtl.status);
        
        this.service.template('customer').then(function(tmpl) {
            this.tmpl=tmpl; //{a:{n:xxx,t:s/d/n},b:{}}
            this.ext=this.service.decodeExt(this.dtl.comment, tmpl);
        }.bind(this));
    }.bind(this));
},
query_orders(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_SMPG;
    var url="/api/order/list?customer="+this.id+"&offset="+offset+"&num="+this.service.N_SMPG;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=0||resp.data.total==0) {
            return;
        }
        var orders=[];
        var dt=new Date();
        var icon;
        for(var o of resp.data.orders){
            dt.setTime(o.createAt);
            icon=this.tags.sta2icon(o.status);
            orders.push({id:o.id,price:o.price,skuName:o.skuName,creator:o.creator,
                createAt:this.tags.date2str(dt),status:icon});
        }
        this.orders=orders;
        this.page.order=Math.ceil(resp.data.total/this.service.N_SMPG);
    }.bind(this));
},
query_contacts(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_SMPG;
    var url="/api/contact/list?customer="+this.id+"&offset="+offset+"&num="+this.service.N_SMPG;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=0||resp.data.total==0) {
            return;
        }
        var contacts=[];
        var dt=new Date();
        for(var c of resp.data.contacts) {
            dt.setTime(c.createAt);
            contacts.push({id:c.id,name:c.name,post:c.post,
             createAt:this.tags.date2str(dt),creator:c.creator});
        }
        this.contacts=contacts;
        this.page.contact=Math.ceil(resp.data.total/this.service.N_SMPG);
    }.bind(this));
},
query_touchlogs(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_SMPG;
    var url="/api/touchlog/custTouchlogs?customer="+this.id+"&offset="+offset+"&num="+this.service.N_SMPG;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=RetCode.OK||resp.data.total==0) {
            this.touchlogs=[];
            this.page.touchlog=0;
            return;
        }
        var logs=[];
        var dt=new Date();
        for(var l of resp.data.touchlogs) {
            dt.setTime(l.createAt);
            logs.push({name:l.name,comment:l.comment,createAt:dt.toLocaleString(),
            t:l.createAt/*用于删除修改*/,cid:l.contact,creator:l.creator});
        }
        this.touchlogs=logs;
        this.page.touchlog=Math.ceil(resp.data.total/this.service.N_SMPG);
    }.bind(this));
},
query_shares() {
    var url="/api/customer/shareList?id="+this.id;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=0) {
            this.shares=[];
            return;
        }
        var shares=[];
        var dt=new Date();
        var year=dt.getFullYear();
        var t1,t2;
        resp.data.list.forEach(function(s) { //account,update_time,endT
            dt.setTime(s.endT*60000);
            t1=dt.getFullYear()-year>100?'永久':dt.toLocaleDateString();
            dt.setTime(s.update_time);
            t2=dt.toLocaleDateString();
            shares.push({account:s.account,endT:t1,createAt:t2,power:this.tags.share[s.power]});
        }.bind(this));
        this.shares=shares;
    }.bind(this));
},
create_order() {
    var dta=copyObj(this.newOrder,['skuId','price','nextSigners']);
    dta['customer']=this.id;
    dta['comment']=this.service.encodeExt(this.newOrder.ext);
    var url="/api/order/create";
    request({method:"POST",url:url,data:dta}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.newOrd=false;
        this.newOrder={skuId:'',price:0,nextSigners:[],ext:{}};
        this.query_orders(1);
    }.bind(this))
},
create_contact() {
    var dta=copyObj(this.newContact,['name','address','phone','sex','level','post']);
    dta['customer']=this.id;
    dta['comment']=this.service.encodeExt(this.newContact.ext);
    dta['birthday']=Math.ceil(new Date(this.newContact.birthday).getTime()/86400000); //转为天数
    var opts={method:"POST",url:"/api/contact/add",data:dta};
    request(opts, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.visible.newContact=false;
            this.newContact={name:'',sex:0,level:0,phone:'',address:'',post:'',
                birthday:this.tags.date2str(new Date()),ext:{}};
            this.query_contacts(1);
        }
    }.bind(this))
},
opr_touchlog(opr){
    var dta;
    var reqUrl;
    if(opr==1) { //增加
        dta={contact:this.newTl.cid,comment:this.newTl.cmt};
        reqUrl="/api/touchlog/add";
    } else if(opr==2){ //修改
        dta={contact:this.newTl.cid,createAt:this.newTl.t,comment:this.newTl.cmt};
        reqUrl="/api/touchlog/modify";
    } else { //删除
        dta={contact:this.newTl.cid,createAt:this.newTl.t};
        reqUrl="/api/touchlog/remove";
    }

    request({method:"POST",url:reqUrl,data:dta}, this.service.name).then(function(resp){
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        } else {
            this.visible.newTl=false;
            this.newTl={t:0,tp:0,cid:0,cmt:''};
            this.query_touchlogs(1);
        }
    }.bind(this))
},
customer_flow(){
    var url='/task?flow='+this.dtl.flowid+"&did="+this.id+"&flName=customer&step="+this.dtl.status;
    this.$router.push(url);
},
save_base() {
    var cmt=this.service.encodeExt(this.ext);
    var url="/api/customer/setInfo";
    var req={id:this.id, name:this.dtl.name, comment:cmt,
     address:this.dtl.address, business:this.dtl.business};
    request({method:"POST",url:url,data:req}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.editBase=false;
    }.bind(this))
},
open_create_order() {
    this.service.template('order').then(function(tmpl) {
        this.ordTmpl=tmpl; //{a:{n:xxx,t:s/d/n},b:{}}
        return this.service.skuList();
    }.bind(this)).then(function(skus){
        if(!skus || skus.length==0) {
            this.$refs.errMsg.show(this.tags.noSkuDef);
            return;
        }

        var skuList=skus.map(function(sku){
            return {label:sku.name + '(' + sku.price + ')', value:sku.id, price:sku.price};
        });
        this.newOrder.price=skus[0].price;
        this.newOrder.skuId=skus[0].id;
        this.skus=skuList;
        this.visible.newOrd=true;
    }.bind(this));
},
open_new_contact() {
    this.service.template('contact').then(function(tmpl) {
        this.cntTmpl=tmpl; //{a:{n:xxx,t:s/d/n},b:{}}
        this.visible.newContact=true
    }.bind(this));
},
sku_changed(val) {
    for(var sku of this.skus) {
        if(sku.value==val) {
            this.newOrder.price=sku.price;
            return;
        }
    }
},
more_contacts() {
    this.visible.contact=!this.visible.contact;
    if(this.visible.contact && this.contacts.length==0) {
        this.query_contacts(1);
    }
},
more_orders() {
    this.visible.order=!this.visible.order;
    if(this.visible.order && this.orders.length==0) {
        this.query_orders(1);
    }
},
more_touchlogs() {
    this.visible.touchlog=!this.visible.touchlog;
    if(this.visible.touchlog && this.touchlogs.length==0) {
        this.query_touchlogs(1);
    }
},
more_shares() {
    this.visible.share=!this.visible.share;
    if(this.visible.share && this.shares.length==0) {
        this.query_shares();
    }
},
share_create(){
    if(this.newShare.to.length<=0){return;}
    var t=new Date(this.newShare.endT).getTime()/60000;
    var opts={method:"POST",url:"/api/customer/share",data:{id:this.id, endT:t,
     to:this.newShare.to, power:this.newShare.power}};
    request(opts, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.visible.newShare=false;
        this.query_shares();
    }.bind(this))
},
share_remove(acc){
    var opts={method:"POST",url:"/api/customer/unshare",data:{id:this.id,to:acc}};
    request(opts, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
        }
        this.query_shares();
    }.bind(this))
},
customer_deliver(){
    if(this.newShare.to.length<=0){return;}
    var opts={method:"POST",url:"/api/customer/deliver",data:{id:this.id, to:this.newShare.to[0]}};
    request(opts, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.service.go_back();
    }.bind(this))
},
menu_remove(){
    var msg=this.tags.cfmToDel+this.tags.customer.title+' "'+this.dtl.name+'"';
    this.$refs.confirmDlg.show(msg, function(){
        var opts={method:"POST",url:"/api/customer/remove",data:{id:this.id}};
        request(opts, this.service.name).then(function(resp){
            if(resp.code != 0) {
                this.$refs.errMsg.showErr(resp.code, resp.info);
            }else{
                this.service.go_back();
            }
        }.bind(this))
    }.bind(this));
},
show_relations(){
    this.visible.relation=!this.visible.relation;
    if(!this.visible.relation) {
        return;
    }
    if(!this.relationChart) {
        this.relationChart=Vue.markRaw(echarts.init(document.getElementById('relationChart')));
    }
    var url="/api/relation/custRelations?customer="+this.id;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        var categories=this.tags.levels.map(function(l){
            return {name:l};
        })
        var nodes=resp.data.nodes.map(function(n){
            return {id:n.id,name:n.name,category:n.level,symbolSize:(1+n.level)*5,label:{show:true}};
        })
        var labelCfg={show:true,formatter:function(p){return p.data.comment}}
        var links=resp.data.links.map(function(l){
            return {source:l.source,target:l.target,comment:l.comment,label:labelCfg};
        })
        this.relationChart.setOption({
            title: {show:false},
            tooltip: {},
            legend: [{data: this.tags.levels}],
            series: [{
                type: 'graph',
                layout: 'circular',
                //circular: {rotateLabel: true},
                data: nodes,
                links: links,
                categories: categories,
                roam: true,
                label: {position:'right',formatter:'{b}'},
                lineStyle: {color:'source',curveness: 0.3}
           }]
        })
    }.bind(this))
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{dtl.name}}</q-toolbar-title>
      <q-btn flat round dense icon="menu" v-if="dtl.power=='O'">
       <q-menu>
       <q-list style="min-width: 100px">
        <q-item clickable v-close-popup @click="visible.deliver=true">
          <q-item-section avatar><q-icon name="screen_share"></q-icon></q-item-section>
          <q-item-section>{{tags.menu.deliver}}</q-item-section>
        </q-item>
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
  <template v-slot:action>
    <q-icon name="edit" color="primary" @click.stop="visible.editBase=true" v-if="dtl.power=='O'"></q-icon>
  </template>
</q-banner>
<q-list dense>
  <q-item v-for="i in visSegs">
    <q-item-section>{{tags.customer[i]}}</q-item-section>
    <q-item-section>{{dtl[i]}}</q-item-section>
  </q-item>
  <q-item v-if="dtl.power=='O'||dtl.power=='W'" clickable @click.stop="customer_flow">
    <q-item-section>{{tags.customer.status}}</q-item-section>
    <q-item-section><q-icon :name="dtl.icon" color="blue"><q-icon></q-item-section>
  </q-item>
  <q-item v-if="dtl.power=='O'" clickable @click.stop="show_relations">
    <q-item-section>{{tags.contactRelations}}</q-item-section>
    <q-item-section><q-icon name="people" color="primary"></q-icon></q-item-section>
  </q-item>
  <q-item v-for="(tpl,k) in tmpl">
    <q-item-section>{{tpl.n}}</q-item-section>
    <q-item-section>{{ext[k]}}</q-item-section>
  </q-item>
</q-list>

<!-- 联系人列表 -->
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1" @click="more_contacts">
{{tags.contact.title}}
  <template v-slot:action>
    <q-icon name="add_circle" color="primary" @click.stop="open_new_contact"></q-icon>
  </template>
</q-banner>
<div v-show="visible.contact">
<q-list separator>
  <q-item v-for="c in contacts" dense clickable @click="service.jumpTo('/contact?id='+c.id)">
    <q-item-section>{{c.name}}</q-item-section>
    <q-item-section>{{c.post}}</q-item-section>
    <q-item-section>{{c.creator}}</q-item-section>
    <q-item-section>{{c.createAt}}</q-item-section>
    <q-item-section avatar><q-icon :name="icons['touchlog']" @click.stop="newTl={n:c.name,t:0,cid:c.id,tp:1,cmt:''};visible.newTl=true" color="primary"></q-btn></q-item-section>
  </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-if="page.contact>1">
 <q-pagination color="primary" :max="page.contact" max-pages="10" v-model="page.curContact"
  dense boundary-numbers="false" @update:model-value="query_contacts"></q-pagination>
</div>
</div>

<!-- 联系记录列表 -->
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1" @click="more_touchlogs">
{{tags.touchlog}}
</q-banner>
<div v-show="visible.touchlog">
<q-list separator>
 <q-item v-for="t in touchlogs" dense clickable @click="newTl={n:t.name,t:t.t,tp:2,cid:t.cid,cmt:t.comment};visible.newTl=true">
  <q-item-section>{{t.name}}</q-item-section>
  <q-item-section>{{t.comment}}</q-item-section>
  <q-item-section>{{t.creator}}</q-item-section>
  <q-item-section>{{t.createAt}}</q-item-section>
 </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-if="page.touchlog>1">
 <q-pagination color="primary" :max="page.touchlog" max-pages="10" v-model="page.curTl"
 dense boundary-numbers="false" @update:model-value="query_touchlogs"></q-pagination>
</div>
</div>

<!-- 订单列表 -->
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1" @click="more_orders">
{{tags.order.title}}
  <template v-slot:action>
    <q-icon name="add_circle" color="primary" @click.stop="open_create_order"></q-icon>
  </template>
</q-banner>
<q-list separator v-show="visible.order">
  <q-item v-for="o in orders" dense clickable @click="service.jumpTo('/order?id='+o.id)">
      <q-item-section>{{o.skuName}}</q-item-section>
      <q-item-section>{{o.price}}</q-item-section>
      <q-item-section>{{o.creator}}</q-item-section>
      <q-item-section size>{{o.createAt}}</q-item-section>
        <q-item-section thumbnail><q-icon :name="o.status"></q-icon></q-item-section>
  </q-item>
</q-list>
<div class="q-pa-sm flex flex-center" v-if="page.order>1">
 <q-pagination color="primary" :max="page.order" max-pages="10" v-model="page.curOrder"
  dense boundary-numbers="false" @update:model-value="query_orders"></q-pagination>
</div>

<div v-if="dtl.power=='O'">
<!-- 分享列表 -->
<q-banner dense inline-actions class="q-mb-sm text-dark bg-blue-grey-1" @click="more_shares">
{{tags.share.title}}
<template v-slot:action>
   <q-icon name="add_circle" color="primary" @click.stop="visible.newShare=true"></q-icon>
</template>
</q-banner>
<q-list separator dense v-show="visible.share">
 <q-item clickable v-for="s in shares" dense>
  <q-item-section>{{s.account}}</q-item-section>
  <q-item-section>{{s.endT}}</q-item-section>
  <q-item-section>{{s.power}}</q-item-section>
  <q-item-section>{{s.createAt}}</q-item-section>
  <q-item-section thumbnail>
   <q-icon name="delete" color="red" @click="share_remove(s.account)"></q-icon>
  </q-item-section>
 </q-item>
</q-list>
</div>
<div id="relationChart" :style="{width:'90vw',height:'90vw'}" v-show="visible.relation"></div>
    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
<component-confirm-dialog :title="tags.alert" :close="tags.cancel" :ok="tags.ok" ref="confirmDlg"></component-confirm-dialog>

<!-- 新建联系人弹窗 -->
<q-dialog v-model="visible.newContact" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.addContact}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <q-input :label="tags.contact.name" v-model="newContact.name" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section><div class="row">
          <div class="col">{{tags.sex}}</div>
          <div class="col">
         <q-radio dense v-model="newContact.sex" val="0" :label="tags.sexName[0]" color="indigo" keep-color></q-radio>
         &nbsp;<q-radio dense v-model="newContact.sex" val="1" :label="tags.sexName[1]" color="pink" keep-color></q-radio>
        </div>
      </div></q-item-section></q-item>
      <q-item><q-item-section><div class="row">
          <div class="col">{{tags.contactLevel}}</div>
          <div class="col">
            <q-rating v-model="newContact.level" max="5" size="1em"
             color="yellow" color-selected="orange"></q-rating>
          </div>
      </div></q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.contact.post" v-model="newContact.post" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.contact.address" v-model="newContact.address" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.contact.phone" v-model="newContact.phone" dense
        :rules="[v=>/^1[0-9]{10}$/.test(v)||tags.mobilePls]" maxlength=11></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <component-date-input :label="tags.contact.birthday" v-model="newContact.birthday"></component-date-input>
      </q-item-section></q-item>
      <!-- ext/comment -->
      <q-item v-for="(tpl,k) in cntTmpl"><q-item-section>
        <div v-if="tpl.t=='d'">
          <component-date-input :close="tags.ok" :label="tpl.n" v-model="newContact.ext[k]"></component-date-input>
        </div>
        <div v-else-if="tpl.t=='b'">
          <q-checkbox v-model="newContact.ext[k]" :label="tpl.n" left-label></q-checkbox>
        </div>
        <div v-else>
         <q-input :label="tpl.n" v-model="newContact.ext[k]" dense :autogrow="tpl.t!='n'"
          :type="tpl.t=='n'?'number':'textarea'"></q-input>
        </div>
      </q-item-section></q-item>
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="create_contact"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<!-- 新建订单弹窗 -->
<q-dialog v-model="visible.newOrd" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.modify}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <q-select :label="tags.order.skuName" v-model="newOrder.skuId"
         emit-value map-options :options="skus" @update:model-value="sku_changed"></q-select>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.order.price" v-model="newOrder.price" dense></q-input>
      </q-item-section></q-item>
      <!-- ext/comment -->
      <q-item v-for="(tpl,k) in ordTmpl"><q-item-section>
        <div v-if="tpl.t=='d'">
          <component-date-input :close="tags.ok" :label="tpl.n" v-model="newOrder.ext[k]"></component-date-input>
        </div>
        <div v-else-if="tpl.t=='b'">
          <q-checkbox v-model="newOrder.ext[k]" :label="tpl.n" left-label></q-checkbox>
        </div>
        <div v-else>
         <q-input :label="tpl.n" v-model="newOrder.ext[k]" dense :autogrow="tpl.t!='n'"
          :type="tpl.t=='n'?'number':'textarea'"></q-input>
        </div>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <component-user-selector :label="tags.signers" v-model="newOrder.nextSigners"></component-user-selector>
      </q-item-section></q-item>
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="create_order"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<!-- 新建/修改/删除联系记录弹窗 -->
<q-dialog v-model="visible.newTl" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{newTl.n}}-{{tags.touchlog}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <q-input :label="tags.touchCtnt" v-model="newTl.cmt" type="textarea"
        dense autogrow></q-input>
      </q-item-section></q-item>
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="opr_touchlog(newTl.tp)"></q-btn>
      <q-btn :label="tags.remove" color="primary" @click="opr_touchlog(3)" v-show="newTl.tp==2"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<!-- 修改客户基本信息弹窗 -->
<q-dialog v-model="visible.editBase" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{tags.baseInfo}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <q-input :label="tags.customer.name" v-model="dtl.name" dense></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.customer.address" v-model="dtl.address" dense autogrow></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.customer.business" v-model="dtl.business" dense autogrow></q-input>
      </q-item-section></q-item>
      <!-- ext/comment -->
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

<!-- 分享客户弹窗 -->
<q-dialog v-model="visible.newShare" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{dtl.name}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
          <div class="q-gutter-sm">
         <q-radio dense v-model="newShare.power" val="S" :label="tags.share.S"></q-radio>
         <q-radio dense v-model="newShare.power" val="O" :label="tags.share.O" color="red" keep-color></q-radio>
        </div>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <component-date-input :label="tags.share.endT" v-model="newShare.endT" :min="curDate"></component-date-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <component-user-selector :label="tags.share.to" v-model="newShare.to"></component-user-selector>
      </q-item-section></q-item>
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="share_create"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<!-- 将客户转交给其他用户的弹窗 -->
<q-dialog v-model="visible.deliver" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
      <div class="text-h6">{{dtl.name}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <component-user-selector :label="tags.share.to" v-model="newShare.to"></component-user-selector>
      </q-item-section></q-item>
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="customer_deliver"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}