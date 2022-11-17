export default {
inject:['service', 'tags'],
data() {return {
    tab:'ext',
    tmplProxyUrl:"/api/proxy/template",
    
    segTypes:[],
    tmpl:{}, //当前模板内容
    tmplOpts:[],
    curTpl:'',
    newSeg:{k:'', n:'', t:'s'},
    
    skus:[],
    skuPage:{max:0,cur:1},
    skuDlg:{show:false, state:0},//state,0:detail,1:edit,2:add
    newSku:{id:0,cost:0,price:0,lowest:0,highest:0,no:'',name:'',comment:''}
}},
created(){
    for(var n in this.tags.segTypes){
        this.segTypes.push({value:n,label:this.tags.segTypes[n]})
    }
    this.query_sku(1);
    
    for(var k in this.service.tmpl) {
        this.tmplOpts.push({label:this.tags[k].title,value:k});
    }
    this.curTpl=this.tmplOpts[0].value;
    this.service.template(this.curTpl,true).then(function(tpl){
        this.tmpl=tpl;
    }.bind(this))
},

methods:{
tmpl_req(req){
    var dta={'_service':SERVICE_CONFIG,'_method':req.method,'_url':req.url};
    if(req.method=='POST'&&req.data){
        for(var k in req.data) {
            dta[k]=req.data[k];
        }
    }
    var opts={method:"POST",url:this.tmplProxyUrl,data:dta};
    return request(opts, this.service.name);
},
//sku管理
query_sku(pg) {
    var offset=(parseInt(pg)-1)*this.service.N_PAGE;
    var url="/api/sku/list?offset="+offset+"&num="+this.service.N_PAGE;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=0) {
            Console.info(url + ",code:"+resp.code+",info:"+resp.info);
            return;
        }
        this.skus=resp.data.skus;
        this.skuPage.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    }.bind(this))
},
show_sku_detail(id) {
    var url="/api/sku/detail?id="+id;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code!=0) {
            console.info("response->code:"+resp.code+",info:"+resp.info);
            return;
        }
        this.newSku=resp.data;
        this.newSku['id']=id;
        this.skuDlg={show:true,state:0};
    }.bind(this))
},
rmv_sku(id){
    var url="/api/sku/remove?id="+id;
    request({method:"POST",url:url}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.skuDlg={show:false,state:0};
        this.query_sku(this.skuPage.cur);
    }.bind(this));
},
open_add_sku(){
    this.newSku={id:0,cost:0,price:'',lowest:0,highest:0,no:'',name:'',comment:''};
    this.skuDlg={show:true,state:2};
},
confirm_sku(){
    var url=this.skuDlg.state==1?"/api/sku/modify":"/api/sku/add";
    var opts={method:"POST",url:url, data:this.newSku};
    request(opts, this.service.name).then(function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        var pg=this.skuDlg.state==2?1:this.skuPage.cur;//按时间倒序排列，新增的必然在第一页
        this.query_sku(pg);
        this.skuDlg={show:false,state:0};
    }.bind(this));
},
//模板设置
rmv_tpl_seg(rmvK){
    var tpls={};
    for(var k in this.tmpl) {
        if(k!=rmvK) {
            tpls[k]=this.tmpl[k];
        }
    }
    this.tmpl=tpls;
    this.save_tpl();
},
add_tpl_seg(){
    this.tmpl[this.newSeg.k]={n:this.newSeg.n,t:this.newSeg.t};
    this.save_tpl();
    this.newSeg={k:'', n:'', t:'s'};
},
save_tpl(){
    var opts={url:"/put",method:"POST",data:{k:this.curTpl,v:this.tmpl}};
    this.tmpl_req(opts, this.service.name, function(resp){
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
    }.bind(this));
},
tmpl_changed(v){
    this.curTpl=v;
    this.service.template(this.curTpl).then(function(tpl){
        this.tmpl=tpl;
    }.bind(this))    
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.home.settings}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">

<q-tabs v-model="tab" class="text-primary">
  <q-tab name="ext" icon="perm_contact_calendar" :label="tags.extSegs"></q-tab>
  <q-tab name="sku" icon="business_center" :label="tags.sku.title"></q-tab>
</q-tabs>
<q-separator></q-separator>
<q-tab-panels v-model="tab" animated swipeable transition-prev="jump-up" transition-next="jump-up">
  <q-tab-panel name="ext">
    <q-select v-model="curTpl" :options="tmplOpts" outlined dense
     @update:model-value="tmpl_changed" emit-value map-options></q-select>
    <q-list>
    <q-item>
     <q-item-section><q-item-label caption>{{tags.segKey}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.segName}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.segType}}</q-item-label></q-item-section>
     <q-item-section avatar></q-item-section>
    </q-item>
    <q-item v-for="(tpl,k) in tmpl">
     <q-item-section>{{k}}</q-item-section>
     <q-item-section>{{tpl.n}}</q-item-section>
     <q-item-section>{{tags.segTypes[tpl.t]}}</q-item-section>
     <q-item-section avatar><q-icon name="cancel" color="green" @click="rmv_tpl_seg(k)"><q-icon></q-item-section>
    </q-item>
    <q-item>
     <q-item-section>
      <q-input v-model="newSeg.k" :label="tags.segKey"
      :rules="[v=>/^[a-zA-Z]+$/.test(v)||tags.segKeyRule]"></q-input>
     </q-item-section>
     <q-item-section>
      <q-input v-model="newSeg.n" :label="tags.segName"></q-input>
     </q-item-section>
     <q-item-section>
      <q-select v-model="newSeg.t" :options="segTypes" emit-value map-options></q-select>
     </q-item-section>
     <q-item-section avatar><q-icon name="add_circle" color="primary" @click="add_tpl_seg()"><q-icon></q-item-section>
    </q-item>
    </q-list>
  </q-tab-panel>
  
  <q-tab-panel name="sku">
    <q-list separator>
    <q-item>
     <q-item-section><q-item-label caption>{{tags.sku.no}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.sku.name}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.sku.price}}</q-item-label></q-item-section>
    </q-item>
    <q-item v-for="s in skus" clickable @click="show_sku_detail(s.id)">
     <q-item-section>{{s.no}}</q-item-section>
     <q-item-section>{{s.name}}</q-item-section>
     <q-item-section>{{s.price}}</q-item-section>
    </q-item>
    </q-list>
    <div align="center">
       <q-btn color="primary" icon="add_circle" :label="tags.add" @click="open_add_sku"></q-btn>
    </div>
  </q-tab-panel>
  <q-tab-panel name="flow">
    <q-list separator>
    <q-item>
     <q-item-section><q-item-label caption>{{tags.sku.no}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.sku.name}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{tags.sku.price}}</q-item-label></q-item-section>
    </q-item>
    <q-item v-for="s in skus" clickable @click="show_sku_detail(s.id)">
     <q-item-section>{{s.no}}</q-item-section>
     <q-item-section>{{s.name}}</q-item-section>
     <q-item-section>{{s.price}}</q-item-section>
    </q-item>
    </q-list>
    <div align="center">
       <q-btn color="primary" icon="add_circle" :label="tags.add" @click="open_add_sku"></q-btn>
    </div>
  </q-tab-panel>
</q-tab-panels>

    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>

<!-- 增加/修改/显示SKU信息弹窗 -->
<q-dialog v-model="skuDlg.show" no-backdrop-dismiss>
  <q-card style="min-width:70vw">
    <q-card-section>
     <div class="row items-center no-wrap">
      <div class="col">
       <div class="text-h6">{{tags.sku.title}}</div>
      </div>
      <div class="col-auto">
        <q-btn color="blue" :label="tags.modify" round flat icon="edit" v-show="skuDlg.state==0" @click="skuDlg.state=1"></q-btn>
      </div>
    </div>
    </q-card-section>
    <q-card-section class="q-pt-none">
    <q-list>
      <q-item><q-item-section>
        <q-input :label="tags.sku.no" v-model="newSku.no" maxlength=30 dense :disable="skuDlg.state!=2"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.sku.name" v-model="newSku.name" maxlength=80 dense :disable="skuDlg.state==0"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.sku.price" v-model="newSku.price" type="number" dense :disable="skuDlg.state==0"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.sku.lowest" v-model="newSku.lowest" type="number" dense :disable="skuDlg.state==0"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.sku.cost" v-model="newSku.cost" type="number" dense :disable="skuDlg.state==0"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.sku.highest" v-model="newSku.highest" type="number" dense :disable="skuDlg.state==0"></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
        <q-input :label="tags.sku.comment" v-model="newSku.comment" type="textarea" autogrow maxlength=100 dense :disable="skuDlg.state==0"></q-input>
      </q-item-section></q-item>
    </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click.stop="confirm_sku" v-show="skuDlg.state!=0"></q-btn>
      <q-btn :label="tags.remove" color="primary" @click.stop="rmv_sku(newSku.id)" v-show="skuDlg.state==0"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}