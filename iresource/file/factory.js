const EMPTY_FAC={name:'',addr:'',cmt:'',createAt:''};
export default {
inject:['service', 'tags'],
data() {return {
    factories:[], //工厂
    edt:{fac:{}},
    ctrl:{no:-2,tag:'',facDlg:false}
}},
created(){
    this.query_factories();
},
methods:{
query_factories(){
    var opts={method:"GET", url:"/factory/list"}
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.factories=[];
            return;
        }
        var dt=new Date();
        for(var f of resp.data.list) {
            dt.setTime(f.createAt*60000);
            f.createAt_s=date2str(dt);
        }
        this.factories=resp.data.list;
    })  
},
show_factory(i) {
    if(i>-1) {
        this.ctrl.tag=this.tags.modify;
        this.edt.fac.id=this.factories[i].id;
        copyObjTo(this.factories[i], this.edt.fac);
    } else {
        this.ctrl.tag=this.tags.add;
        copyObjTo(EMPTY_FAC, this.edt.fac);
    }
    this.ctrl.tag+=this.tags.factory.title;
    this.ctrl.no=i;
    this.ctrl.facDlg=true;
},
factory_do() {
    var opts;
    if(this.ctrl.no>-1) {
        opts={method:"PUT",url:"/factory/update",data:this.edt.fac};
    } else {
        opts={method:"POST",url:"/factory/add",data:this.edt.fac};
    }
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        if(this.ctrl.no>-1) {
            copyObjTo(this.edt.fac, this.factories[this.ctrl.no]);
        } else {
            var o = {id:resp.data.id,createAt_s:date2str(new Date())};
            copyObjTo(this.edt.fac, o);
            this.factories.push(o);
        }
        this.ctrl.no=-2;
        this.ctrl.facDlg=false;
    });
},
remove_factory(i) {
    var opts={method:"DELETE",url:"/factory/remove?id="+this.factories[i].id};
    request(opts, this.service.name).then(resp => {
        if(resp.code!=RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.factories.splice(i,1);
    });
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:99vh">
  <q-header>
   <q-toolbar>
     <q-btn flat round icon="arrow_back" dense @click="service.back()"></q-btn>
     <q-toolbar-title>{{tags.factory.title}}</q-toolbar-title>
     <q-btn flat icon="add_circle" @click="show_factory(-2)"></q-btn>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
<q-list separator>
 <q-item>
  <q-item-section><q-item-label caption>{{tags.name}}/{{tags.factory.addr}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.factory.createAt}}</q-item-label></q-item-section>
  <q-item-section><q-item-label caption>{{tags.cmt}}</q-item-label></q-item-section>
 </q-item>
 <q-item v-for="(f,i) in factories">
  <q-item-section>
   <q-item-label>{{f.name}}</q-item-label>
   <q-item-label caption>{{f.addr}}</q-item-label>
  </q-item-section>
  <q-item-section>{{f.createAt_s}}</q-item-section>
  <q-item-section>{{f.cmt}}</q-item-section>
  <q-menu touch-position context-menu>
    <q-list dense style="min-width:100px">
      <q-item clickable v-close-popup @click="show_factory(i)">
        <q-item-section avatar><q-icon name="edit" color="primary"></q-icon></q-item-section>
        <q-item-section>{{tags.modify}}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="remove_factory(i)">
        <q-item-section avatar><q-icon name="delete_forever" color="red"></q-icon></q-item-section>
        <q-item-section>{{tags.remove}}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
 </q-item>
</q-list>
    </q-page>
  </q-page-container>
</q-layout>

<q-dialog v-model="ctrl.facDlg">
 <q-card style="min-width:70vw">
  <q-card-section>
    <div class="text-h6">{{ctrl.tag}}</div>
  </q-card-section>
  <q-card-section class="q-pt-none">
   <q-input :label="tags.name" v-model="edt.fac.name" dense></q-input>
   <q-input :label="tags.factory.addr" v-model="edt.fac.addr" dense></q-input>
   <q-input :label="tags.cmt" v-model="edt.fac.cmt" dense></q-input>
  </q-card-section>
  <q-card-actions align="right">
   <q-btn :label="tags.ok" color="primary" @click="factory_do"></q-btn>
   <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
  </q-card-actions>
 </q-card>
</q-dialog>

<alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></alert-dialog>
`
}