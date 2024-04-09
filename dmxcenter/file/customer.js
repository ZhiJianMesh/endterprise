const CUST_SEGS=['id','name','address','createAt','cmt','contact','deviceNum'];
export default {
inject:['service', 'tags'],
data() {return {
    id:this.$route.query.id,
    products:{},
    devices:[],
    admins:[],
    search:'',
    page:{cur:1, max:0},
    adminInfo:{dlg:false,newAcc:[]},
    msg:{dlg:false, code:'', downmsg:'', upmsgs:[], downtime:'',setAt:''},
    custInfo:{dlg:false,id:0,name:'',address:'',createAt:'',cmt:'',contact:'',deviceNum:0}
}},
created(){
    this.getCust();
    this.getAdmins();
    this.service.getProducts(true).then(prts => {
        for(var p of prts) {
            this.products[p.id]=p;
        }
        this.query_devices(1);
    });
},
methods:{
showMsgSender() {
    this.$refs.msgSender.show();
},
getCust() {
    var url="/customer/get?id="+this.id;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.custInfo={};
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.custInfo=resp.data;
        var dt=new Date();
        dt.setTime(resp.data.createAt*60000);
        this.custInfo.createAt=this.tags.date2str(dt);
    })
},
showMsg(code) {
    var url="/device/getmessage?code="+code;
    request({method:"GET",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        var dt=new Date();
        if(resp.data.downmsg) {
            this.msg.downmsg=resp.data.downmsg;
            dt.setTime(resp.data.setAt);
            this.msg.setAt=dt.toLocaleString();
            if(resp.data.downtime>resp.data.setAt) {
                dt.setTime(resp.data.downtime);
                this.msg.downtime=dt.toLocaleString();
            } else {
                this.msg.downtime=this.tags.notTaken;
            }
        } else {
            this.msg.downmsg='';
            this.msg.downtime='';
            this.msg.setAt='';
        }
        var upmsgs=[];
        for(var m of resp.data.upmsgs) {
            dt.setTime(m.at);
            upmsgs.push({msg:m.msg,at:dt.toLocaleString()});
        }
        this.msg.upmsgs=upmsgs;
        this.msg.code=code;
        this.msg.dlg=true;
    })
},
query_devices(pg){
    this.search='';
    this.get_devices(pg);
},
get_devices(pg) {
    var offset=(parseInt(pg)-1)*+this.service.N_PAGE;
    var url;
    if(!this.search) {
        url='/device/listOfCust?offset='+offset
            +'&num='+this.service.N_PAGE+"&customer="+this.id;
    } else {
        url='/device/searchOfCust?offset='+offset
            +'&num='+this.service.N_PAGE+"&customer="+this.id
            +'&head=' + this.search;
    }
    request({method:"GET",url:url}, this.service.name).then(resp => {
        if(resp.code != 0) {
            console.debug("code:" + resp.code + ",info:" + resp.info);
            this.devices=[];
            return;
        }
        var list=[];
        var iCreate=resp.data.cols.indexOf('createAt');
        var iSell=resp.data.cols.indexOf('sellAt');
        var iCode=resp.data.cols.indexOf('code');
        var iPrt=resp.data.cols.indexOf('product');
        
        var dt=new Date();
        var createAt,sellAt,prt,prtDef;
        for(var d of resp.data.devices) {
            dt.setTime(d[iCreate]*60000);
            createAt=dt.toLocaleDateString();
            if(d[iSell]>0) {
                dt.setTime(d[iSell]*60000);
                sellAt=dt.toLocaleDateString();
            } else {
                sellAt=this.tags.notSell;
            }
            prtDef=this.products[d[iPrt]];
            prt=prtDef?prtDef.name:this.tags.device.ukPrt;
            list.push({code:d[iCode],createAt:createAt,sellAt:sellAt,product:prt})
        }
        this.devices=list;
        this.page.max=Math.ceil(resp.data.total/this.service.N_PAGE);
    })
},
getAdmins() {
    var opts={method:"GET",url:"/admin/gets?customer="+this.id};
    request(opts, this.service.name).then(resp => {
        if(resp.code != 0) {
            console.debug("code:" + resp.code + ",info:" + resp.info);
            return;
        }
        this.admins=resp.data.admins;
    })
},
addAdmin() {
    var dta={customer:this.id,user:this.adminInfo.newAcc[0]};
    request({method:"POST",url:"/admin/add", data:dta}, this.service.name).then(resp => {
        if(resp.code != 0) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.adminInfo.dlg=false;
        this.getAdmins();
    })
},
rmvAdmin(admin) {
    var url="/admin/remove?user="+admin+"&customer="+this.id;
    request({method:"DELETE",url:url}, this.service.name).then(resp => {
        if(resp.code != 0) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.getAdmins();
    })
},
setCustomer() {
    var dta=copyObj(this.custInfo,['name','address','contact','cmt']);
    dta.id=this.id;
    request({method:"PUT",url:"/api/customer/update",data:dta}, this.service.name).then(resp => {
        if(resp.code != RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.custInfo.dlg=false;
    })
},
rmvCustomer() {
    var url;
    if(this.custInfo.deviceNum>0) {
        url="/customer/remove?id=";
    } else {
        url="/customer/forceRemove?id=";
    }
    url += this.id;
    request({method:"DELETE",url:url}, this.service.name).then(resp =>{
        if(resp.code!=RetCode.OK) {
            this.$refs.errDlg.showErr(resp.code, resp.info);
            return;
        }
        this.service.go_back();
    }) 
}
},
template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back" v-if="service.role!='customer'"></q-btn>
      <q-toolbar-title><span v-if="id!=0&&service.role!='customer'">{{tags.cust.name}}-</span>{{custInfo.name}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-px-md q-pb-lg">
<q-banner dense inline-actions class="q-mb-md text-dark bg-blue-grey-1">
{{tags.cust.base}}
  <template v-slot:action>
    <q-icon name="edit" @click.stop="custInfo.dlg=true" color="primary" size='1.8em'></q-icon>
    <q-icon name="cancel" @click="rmvCustomer"
     v-if="id>0&&service.role=='admin'&&devices.length==0"
     color="red" size='1.8em' class="q-pl-lg"></q-icon>
  </template>
</q-banner>
<q-list dense>
 <q-item v-for="i in ['name','address','contact','cmt','createAt','deviceNum']">
  <q-item-section>{{tags.cust[i]}}</q-item-section>
  <q-item-section>{{custInfo[i]}}</q-item-section>
 </q-item>
</q-list>

<!-- admins -->
<q-banner dense inline-actions class="q-mb-md text-dark bg-blue-grey-1">
{{tags.cust.admin}}
  <template v-slot:action>
    <q-icon name="add_circle" @click.stop="adminInfo.dlg=true"
     color="primary" size='1.8em' v-if="service.role!='customer'"></q-icon>
  </template>
</q-banner>
<q-list dense>
 <q-item v-for="admin in admins">
  <q-item-section>{{admin}}</q-item-section>
  <q-item-section>
   <q-icon name="cancel" @click="rmvAdmin(admin)" color="primary"
    v-if="admins.length>1&&!(id==0&&admin=='admin')" size="1.8em"></q-icon>
  </q-item-section>
 </q-item>
 <q-item v-show="adminInfo.dlg">
  <q-item-section>
   <component-user-selector :label="tags.cust.admin" :accounts="adminInfo.newAcc"
   :multi="false"></component-user-selector>
  </q-item-section>
  <q-item-section>
   <q-icon name="check_circle" @click="addAdmin" color="primary" size="1.8em"></q-icon>
  </q-item-section>
 </q-item>
</q-list>

<!-- devices -->
<q-banner dense inline-actions class="q-mb-md text-dark bg-blue-grey-1">
{{tags.cust.devices}}
 <template v-slot:action>
   <q-input v-model="search" dense @keyup.enter="search_custs">
     <template v-slot:append>
      <q-icon v-show="search" name="close" @click="query_devices(1)" class="cursor-pointer"></q-icon>
      <q-icon name="search" @click="get_devices(1)"></q-icon>
     </template>
     <template v-slot:after>
      <q-icon name="message" @click.stop="showMsgSender"
      class="q-ml-md" color="primary"></q-icon>
     </template>
    </q-input>
  </template>
</q-banner>
<div class="q-pa-sm flex flex-center" v-if="page.max>1">
 <q-pagination v-model="page.cur" color="primary" :max="page.max" max-pages="10"
  boundary-numbers="false" @update:model-value="get_devices"></q-pagination>
</div>
<q-markup-table flat dense>
<thead><tr>
 <th>{{tags.device.code}}</th>
 <th>{{tags.device.product}}</th>
 <th>{{tags.device.createAt}}</th>
 <th>{{tags.device.sellAt}}</th>
</tr></thead>
<tbody>
<tr v-for="d in devices" @click="showMsg(d.code)">
 <td>{{d.code}}</td>
 <td>{{d.product}}</td>
 <td>{{d.createAt}}</td>
 <td>{{d.sellAt}}</td>
</tr>
</tbody>
</q-markup-table>

    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" ref="errDlg"
  :errMsgs="tags.errMsgs" :close="tags.close">
</component-alert-dialog>
<component-msg-sender :title="tags.sendMsg" ref="msgSender"
 :custId="id" :tags="tags.sender" :custName="custInfo.name" :service="service.name">
</component-msg-sender>

<!-- 修改客户 -->
<q-dialog v-model="custInfo.dlg">
  <q-card style="min-width:75vw">
    <q-card-section>
      <div class="text-h6">{{custInfo.title}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-list>
      <q-item><q-item-section>
       <q-input v-model="custInfo.name" :label="tags.cust.name" dense maxlength=100></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="custInfo.address" :label="tags.cust.address" dense maxlength=85></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="custInfo.contact" :label="tags.cust.contact" dense maxlength=85></q-input>
      </q-item-section></q-item>
      <q-item><q-item-section>
       <q-input v-model="custInfo.cmt" :label="tags.cust.cmt" dense maxlength=300 type="textarea"></q-input>
      </q-item-section></q-item>
     </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn :label="tags.ok" color="primary" @click="setCustomer"></q-btn>
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>

<!-- 显示消息 -->
<q-dialog v-model="msg.dlg">
  <q-card style="min-width:75vw">
    <q-card-section>
      <div class="text-h6">{{msg.code}}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
     <q-list>
      <q-item>
        <q-item-section>
          <q-item-label>{{tags.cust.downmsg}}</q-item-label>
          <q-item-label caption>{{msg.downmsg}}</q-item-label>
          <q-item-label caption>{{msg.setAt}} / {{msg.downtime}}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>{{tags.cust.upmsg}}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-for="m in msg.upmsgs">
        <q-item-section>
          <q-item-label caption>{{m.msg}}</q-item-label>
          <q-item-label caption>{{m.at}}</q-item-label>
        </q-item-section>
      </q-item>
     </q-list>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat :label="tags.close" color="primary" v-close-popup></q-btn>
    </q-card-actions>
  </q-card>
</q-dialog>
`
}