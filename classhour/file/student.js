export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
	pages:{cur:1,max:0},
    orders:[], //id,createAt,pkgName,balance
    student:{name:'',createAt:'',mobile:'',points:0,birth:'',sex:'U',ext:{},creator:'',age:0},
    ext:{},
    newOrder:{pkgId:'',pwd:'',price:0,student:0},
	newOrderDlg:false,
    packages:[],
    packageOpts:[],
    isMore:false,
    tmpl:{},
	usePoint:null, //兑换积分数
    extChanged:false
}},
created(){
	this.newOrder.student=this.id;
    this.query_orders(0);
    this.service.getTemplate().then(tpl=>{
        this.tmpl=tpl;
        this.query_info(); //放在template之后，是为了防止无template情况下，不能解析ext
    }).catch(err=>{
        Console.info(err);
    });
},
methods:{
query_info() {
    var url="/api/student/get?id="+this.id;
    request({method:"GET", url:url},this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.student=resp.data;//creator,createAt,name,mobile,point,ext,sex,birth,points
		var d=new Date();
		var year=d.getYear();
		d.setTime(this.student.birth*86400000);
		this.student.age=year - d.getYear();
        this.student.birth = d.toLocaleDateString();
        d.setTime(this.student.createAt);
        this.student.createAt = d.toLocaleDateString();
        this.ext = !resp.data.ext?{}:resp.data.ext;
    });
},
query_orders(offset) {
    var url="/api/order/list?student="+this.id+"&offset="+offset+"&num="+this.service.NUM_PER_SMPG;
    request({method:"GET", url:url}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            Console.info("Url:" + url + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.orders=resp.data.orders;
        this.pages.max=Math.ceil(resp.data.total/this.service.NUM_PER_SMPG);
    });
},
change_page(page) {
    this.query_orders((parseInt(page)-1)*this.service.NUM_PER_SMPG);
},
save_base(v, v0){
	var birth=new Date(v.birth);
	var reqDta={id:this.id,name:v.name,mobile:v.mobile,sex:v.sex,birth:Math.round(birth.getTime()/86400000)};
    var opts={method:"POST", url:"/api/student/setBase",data:reqDta};
    request(opts, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.student.name=v.name;
        this.student.mobile=v.mobile;
		this.student.sex=v.sex;
		this.student.birth=v.birth;
		this.student.age=new Date().getYear() - birth.getYear();
    });
},
create_order() {
    var url="/api/order/create";
    request({method:"POST",url:url,data:this.newOrder}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.newOrderDlg=false;
        this.query_orders(0);
    })
},
open_crt_order(){
    this.service.getPackages().then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, [resp.info,this.tags.noPackages]);
            return;
        }
        this.packages=resp.pkgs;
        this.packageOpts=resp.opts;
        this.newOrderDlg=true;
        var pkg=this.packages[0];
        this.newOrder.pkgId=pkg.id;
		this.newOrder.price=pkg.price;
    }).catch(err=>{
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
    var url="/api/student/setExt";
    var req={id:this.id,ext:this.ext};
    request({method:"POST",url:url,data:req}, this.service.name).then(resp=>{
        if(resp.code != 0) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.extChanged=false;
    })
},
exchange(v, v0) {
    var url="/api/consume/exchange";
    var req={student:this.id, usePoint:v};
    request({method:"PUT", url:url, data:req}, this.service.name).then(resp=>{
        if(resp.code != RetCode.OK) {
            this.$refs.errMsg.showErr(resp.code, resp.info);
            return;
        }
        this.student.points-=v;
		this.usePoint=null;
    })
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header class="bg-grey-1 text-primary" elevated>
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{student.name}}</q-toolbar-title>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-px-md q-pb-lg">
<q-banner dense inline-actions class="text-dark bg-blue-grey-1">
{{student.name}}<q-icon :name="tags.sexInfo[student.sex].i" color="primary" size="1.5em"></q-icon>({{student.age}}{{tags.age}})
  <template v-slot:action>
    <q-icon name="edit" color="primary"></q-icon>
    <q-popup-edit v-model="student" cover="false" buttons auto-save v-slot="scope"
      @save="save_base" :label-set="tags.save" :label-cancel="tags.cancel">
      <q-input color="accent" v-model="scope.value.name" dense autofocus>
       <template v-slot:prepend><q-icon name="person"></q-icon></template>
      </q-input>
      <q-input color="accent" v-model="scope.value.mobile" dense 
      :rules="[v=>/^1[0-9]{10}$/.test(v)||tags.mobilePls]">
       <template v-slot:prepend><q-icon name="contact_phone"></q-icon></template>
      </q-input>
 	  <component-date-input :close="tags.ok" :label="tags.birth" v-model="scope.value.birth"></component-date-input>
	  <div class="q-gutter-sm">
       <q-radio v-model="scope.value.sex" val="F" :label="tags.sexInfo.F.n"></q-radio>
       <q-radio v-model="scope.value.sex" val="M" :label="tags.sexInfo.M.n"></q-radio>
      </div>
    </q-popup-edit>
  </template>
</q-banner>
<q-list>
 <q-item>
  <q-item-section side><q-icon name="date_range" color="primary"></q-icon></q-item-section>
  <q-item-section side>{{tags.createAt}}</q-item-section>
  <q-item-section>{{student.createAt}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section side><q-icon name="person_add" color="primary"></q-icon></q-item-section>
  <q-item-section side>{{tags.creator}}</q-item-section>
  <q-item-section>{{student.creator}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section side><q-icon name="contact_phone" color="primary"></q-icon></q-item-section>
  <q-item-section side>{{tags.mobile}}</q-item-section>
  <q-item-section>{{student.mobile}}</q-item-section>
 </q-item>
 <q-item>
  <q-item-section side><q-icon name="military_tech" color="orange"></q-icon></q-item-section>
  <q-item-section side>{{tags.points}}</q-item-section>
  <q-item-section>{{student.points}}</q-item-section>
  <q-popup-edit v-model="usePoint" buttons v-slot="scope" cover="false" @save="exchange" :label-set="tags.exchange" :label-cancel="tags.cancel">
   <q-input color="accent" v-model="scope.value" dense autofocus @keyup.enter="scope.set" type="number"></q-input>
  </q-popup-edit>
 </q-item>
</q-list>

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
 </q-item>
</q-list>
<div class="q-pa-lg flex flex-center" v-if="pages.max>1">
 <q-pagination v-model="pages.cur" color="black" :max="pages.max" max-pages="10"
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
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="tags.ok" color="primary" @click="create_order"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}