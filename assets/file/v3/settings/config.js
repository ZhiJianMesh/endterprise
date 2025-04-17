const _defaultCfgTags = {
    changeNotSaved:"修改的内容尚未保存，请确认是否放弃修改？",
    needAz:'字段必须是a-z、A-Z字符的组合',
    segTypes:{'s':'文字','n':"数值",'d':'日期'},

    asMap:'模板格式',
    segKey:'字段',
    segName:"名称",
    segType:"类型",
    val:'配置内容'
}

export default {
props: {
    service:{type:String,required:true},
    cfgTags:{type:Object, required:false},
    confirmDlg:{type:Object, required:true},
    alertDlg:{type:Object, required:true}
},
emits: ['update:modelValue'],
data() {return {
    chged:0,    
    segTypes:[],
    cfgOpts:[],
    cfgs:[], //配置列表K-V
    cur:{k:'',v:'',tmpl:{},asMap:false/*多字段模板方式*/}, //字符串形式或map形式
    newSeg:{k:'', n:'', t:'s'},
}},
created(){
    if(this.cfgTags&&Object.keys(this.cfgTags).length>0) {
        copyObjTo(this.cfgTags, this.tags);
    } else {
        this.tags=_defaultCfgTags;
    }

    for(var n in this.tags.segTypes){
        this.segTypes.push({value:n,label:this.tags.segTypes[n]})
    }
    var url="/settings/list?service="+this.service;
    return request({method:"GET",url:url}, SERVICE_CONFIG).then((resp)=>{
        if(resp.code!=RetCode.OK) {
            this.changed(false);
            return this.cur.asMap?{}:'';
        }
        this.cfgs=resp.data.cfgs;
        var opts=[];
        for(var i in resp.data.cfgs) {
            opts.push({value:i,label:resp.data.cfgs[i].k})
        }
        this.cfgOpts=opts;
        this.setCur(0);
    })
},

methods:{
rmv_tpl_seg(k){
    delete this.cur.tmpl[k];
    this.changed(true);
},
add_tpl_seg(){
    if(!/^[a-zA-Z]{1,30}$/.test(this.newSeg.k)) {
        this.alertDlg.show(this.tags.needAz);
        return;
    }
    this.cur.tmpl[this.newSeg.k]={n:this.newSeg.n,t:this.newSeg.t};
    this.changed(true);
    this.newSeg={k:'', n:'', t:'s'};
},
save(){
    var v=this.cur.asMap?JSON.stringify(this.cur.tmpl):this.cur.v;
    var opts={url:"/settings/put",method:"PUT",data:{service:this.service,k:this.cur.k,v:v}};
    request(opts, SERVICE_CONFIG).then(resp=>{
        if(resp.code != 0) {
            this.alertDlg.showErr(resp.code, resp.info);
        } else {
            this.changed(false);
        }
    });
},
change_cfg(i) {
    if(this.chged!=0) {
        this.confirmDlg.show(this.tags.changeNotSaved, ()=>{
            this.setCur(i);
        });
    } else {
        this.setCur(i);
    }
},
setCur(i) {
    var v=this.cfgs[i].v;
    this.cur.k=this.cfgs[i].k;
    this.cur.asMap=v.startsWith('{')&&v.endsWith('}');
    if(this.cur.asMap) {
        this.cur.tmpl=JSON.parse(v);
        this.cur.v='';
    } else {
        this.cur.tmpl={};
        this.cur.v=v;
    }
    this.newSeg={k:'', n:'', t:'s'};
    this.changed(false);
},
changed(chged) {
    this.chged=chged;
    this.$emit('update:modelValue', {changed:chged,
        name:this.cur.k,size:this.cfgs.length});
}
},
template:`
<div class="row">
 <div class="col-8">
  <q-select v-model="cur.k" :options="cfgOpts" outlined dense
   @update:model-value="change_cfg" emit-value map-options></q-select>
 </div>
 <div class="col-4">
  <q-checkbox v-model="cur.asMap" :label="tags.asMap"></q-checkbox>
 </div>
</div>
<div v-if="cur.asMap">
 <q-list>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.segKey}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.segName}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.segType}}</q-item-label></q-item-section>
  <q-item-section avatar></q-item-section>
 </q-item>
 <q-item v-for="(tpl,k) in cur.tmpl">
  <q-item-section>{{k}}</q-item-section>
  <q-item-section>{{tpl.n}}</q-item-section>
  <q-item-section>{{tags.segTypes[tpl.t]}}</q-item-section>
  <q-item-section avatar><q-icon name="cancel" color="green" @click="rmv_tpl_seg(k)"></q-icon></q-item-section>
 </q-item>
 <q-item>
  <q-item-section>
   <q-input v-model="newSeg.k" :label="tags.segKey"></q-input>
  </q-item-section>
  <q-item-section>
   <q-input v-model="newSeg.n" :label="tags.segName"></q-input>
  </q-item-section>
  <q-item-section>
   <q-select v-model="newSeg.t" :options="segTypes" emit-value map-options></q-select>
  </q-item-section>
  <q-item-section avatar><q-icon name="add_circle" color="primary" @click="add_tpl_seg()"></q-icon></q-item-section>
 </q-item>
</q-list>
</div>
<div v-else>
 <q-input v-model="cur.v" :label="tags.val"></q-input>
</div>
`
}