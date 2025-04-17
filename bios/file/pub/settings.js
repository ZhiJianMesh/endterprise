import AlertDialog from "/assets/v3/components/alert_dialog.js"

const URL_LIST="/config/list";
const URL_PUT="/config/put";

const tags={settings:"设置",content:"内容",
failToCall:"调用失败",name:"名称",val:"值",
item:"配置项",save:"保存",close:"关闭"};
export default {
data() {
return {
    service:this.$route.query.service, //调用来自哪个服务
    proxyUrl:this.$route.query.proxy, //代理url
    tags:tags,
    cfgs:[],
    cur:0,
    newSeg:{k:'',v:''}
}},
components:{
    "alert-dialog":AlertDialog
},
created(){
    var cfgs={};
    //需要的配置项[{k:名称,n:显示名称,t:0/字符串,1:对象}...]
    var items=JSON.parse(decodeURIComponent(this.$route.query.items));
    for(var j in items){
        var i=items[j];
        cfgs[i.k]={v:{},t:i.t,k:i.k,label:i.n,value:j};
    }

    this.proxy_req({method:"GET",url:URL_LIST}).then(function(resp){
        if(resp.code!=RetCode.OK) {
            console.info("Fail to call "+URL_LIST+","+resp);
            return;
        }
        for(var i in resp.data.cfgs){
            var c=resp.data.cfgs[i];
            if(cfgs[c.k]) {
                if(c.t==0){
                    cfgs[c.k].v[this.tags.content]=c.v;
                }else{
                    cfgs[c.k].v=JSON.parse(c.v);
                }
            }
        }
        for(var k in cfgs) {
            this.cfgs.push(cfgs[k]);
        }
        this.cur="0";
    }.bind(this));
},

methods:{
proxy_req(req){
    var dta={'_service':"bios",'_method':req.method,'_url':req.url};
    if(req.method=='POST'&&req.data){
        for(var k in req.data){
            dta[k]=req.data[k];
        }
    }
    return request({method:"POST",url:this.proxyUrl,data:dta}, this.service);
},
save_setting(){
    var cfg=this.cfgs[this.cur];
    var v=cfg.t==0?cfg.v[this.tags.content]:JSON.stringify(cfg.v);
    var dta={k:cfg.k,v:v};
    this.proxy_req({method:"POST",url:URL_PUT,data:dta}).then(function(resp){
        if(resp.code!=0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
    }.bind(this));
},
rmv_seg(k){
    delete this.cfgs[this.cur].v[k];
},
add_seg(){
    this.cfgs[this.cur].v[this.newSeg.k]=this.newSeg.v;
    this.newSeg={k:'',v:''};
},
cfg_changed(val) {
    this.cur=val;
},
go_back() {
    this.$router.back();
}
},
template:`
<div class="q-pa-none">  
   <q-layout view="lHh lpr lFf" container style="height:100vh">
      <q-header elevated>
       <q-toolbar>
          <q-btn flat round icon="arrow_back" dense @click="go_back"></q-btn>
          <q-toolbar-title>{{tags.settings}}</q-toolbar-title>
       </q-toolbar>
      </q-header>
      <q-page-container>
        <q-page class="q-pa-md">
<q-select :label="tags.item" v-model="cur" :options="cfgs" @update:model-value="cfg_changed"
emit-value map-options></q-select>
<q-list v-if="cfgs.length>0">
    <q-item v-for="(v,k) in cfgs[cur].v">
     <q-item-section><q-item-label caption>{{k}}</q-item-label></q-item-section>
     <q-item-section><q-item-label caption>{{v}}</q-item-label></q-item-section>
     <q-item-section thumbnail><q-icon name="cancel" @click="rmv_seg(k)" color="red"></q-icon></q-item-section>
    </q-item>
    <q-item v-if="cfgs[cur].t!=0">
     <q-item-section><q-input :label="tags.name" v-model="newSeg.k" dense></q-input></q-item-section>
     <q-item-section><q-input :label="tags.val" v-model="newSeg.v" dense></q-input></q-item-section>
     <q-item-section thumbnail><q-icon name="add" @click="add_seg()" color="primary"></q-icon></q-item-section>
    </q-item>
</q-list>
<div align="center">
   <q-btn color="primary" icon="save" :label="tags.save" @click="save_setting"></q-btn>
</div>
        </q-page>
      </q-page-container>
    </q-layout>
<alert-dialog :title="tags.failToCall" ref="errMsg"></alert-dialog>
</div>
`
}