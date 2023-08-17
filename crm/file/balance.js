export default {
inject:['service', 'tags'],
data() {return {
    tab:'mon',
    skuCharts:null,
    monthCharts:null,
    beginTime:0, //毫秒单位
    days:365,//天
    skuId:0,
    date:'',
    dateStr:'',
    skuList:[],
    monNum:0,
    xAxis:[],
    orders:[],
    monthOrders:[]
}},
created(){
    var dt=new Date();
    var begin=new Date(dt.getFullYear()-1,dt.getMonth(),1,0,0,0,0);
    var end=new Date(dt.getFullYear(),dt.getMonth(),1,0,0,0,0);
    this.beginTime=begin.getTime();
    this.days=Math.ceil((end.getTime()-this.beginTime)/86400000);
    this.init_month(begin, this.days);
},
mounted(){ //mounted在created之后
    this.skuCharts=Vue.markRaw(echarts.init(document.getElementById('skuCharts')));
    this.monthCharts=Vue.markRaw(echarts.init(document.getElementById('monthCharts')));
    this.service.skuList().then(skus=>{
        var skuList=[];
        skus.forEach(function(s){
            var sku={label:s.name+"("+s.price+")",value:s.id};
            skuList.push(sku);
        });
        this.skuList=skuList;
        if(this.skuId==0&&skuList.length>0) { //默认选中第一个商品
            this.skuId=skuList[0].value;
        }
        this.query_sku();
    });
    this.query_month();
},
methods:{
query_sku() {
    var begin=Math.ceil(this.beginTime/86400000);
    var url="/api/report/sku?beginTime="+begin+"&days="+this.days+"&skuId="+this.skuId;
    request({method:"GET",url:url},this.service.name).then(function(resp){
        //reportAt,ord,service,contract,revenue,cost
        var contracts=[], revenues=[], costs=[];
        var monNum=this.monNum;
        for(var i=0;i<monNum;i++){
            contracts.push(0);
            revenues.push(0);
            costs.push(0);
        }

        if(resp.code==RetCode.OK) {
            var bt=new Date(this.beginTime);
            var fullYear=bt.getFullYear();
            var mon=bt.getMonth();
            resp.data.data.forEach(function(l) {
                var t=new Date(l[0]*86400000);
                var i=12*(t.getFullYear()-fullYear)+t.getMonth()-mon;
                if(i>=0&&i<monNum){
                    contracts[i]+=l[1];
                    revenues[i]+=l[2];
                    costs[i]+=l[3];
                }
            });
        }
        this.skuCharts.setOption({
            title: {show:false},
            tooltip: {},
            grid: {left:'0%',containLabel:true},
            legend: {type:'scroll',bottom:10,width:this.service.CLIENTW-60},
            xAxis: {data:this.xAxis},
            yAxis: [{name:this.tags.unit.y}],
            series: [
                {name:this.tags.report.contract,type:'bar',data:contracts,yAxisIndex:0},
                {name:this.tags.report.revenue,type:'bar',data:revenues,yAxisIndex:0},
                {name:this.tags.report.cost,type:'bar',data:costs,yAxisIndex:0}
            ]
        });
    }.bind(this))
},
query_month() {
    var end=this.beginTime + this.days*86400000;
    var url="/api/report/month?beginTime="+this.beginTime+"&endTime="+end;
    request({method:"GET",url:url},this.service.name).then(function(resp){
        var contracts=[], revenues=[], costs=[];
        var orders=[];
        var monNum=this.monNum;
        
        for(var i=0; i<monNum; i++) {
            contracts.push(0);
            revenues.push(0);
            costs.push(0);
            orders.push([]);
        }
        
        if(resp.code==RetCode.OK && resp.data) {
            var bt=new Date(this.beginTime);
            var fullYear=bt.getFullYear();
            var mon=bt.getMonth();
            if(resp.data.orders) {
                resp.data.orders.forEach(function(o) {//signAt,id,skuName,price,customer
                    var t=new Date(o.signAt);
                    var i=12*(t.getFullYear()-fullYear)+t.getMonth()-mon;
                    if(i>=0&&i<monNum) {
                        contracts[i]+=o.price;
                        o.signAt=t.toLocaleDateString();
                        orders[i].push(o);
                    }
                });
            }
            
            if(resp.data.revenues) {
                resp.data.revenues.forEach(function(l) {//signAt,amount
                    var t=new Date(l[0]);
                    var i=12*(t.getFullYear()-fullYear)+t.getMonth()-mon;
                    if(i>=0&&i<monNum) {
                        revenues[i]+=l[1];
                    }
                });
            }
            
            if(resp.data.costs) {
                resp.data.costs.forEach(function(l) {//signAt,cost
                    var t=new Date(l[0]);
                    var i=12*(t.getFullYear()-fullYear)+t.getMonth()-mon;
                    if(i>=0&&i<monNum) {
                        costs[i]+=l[1];
                    }
                });
            }
        }
        this.orders=orders;
        this.monthOrders=[];
        
        this.monthCharts.setOption({
            title: {show:false},
            tooltip: {},
            grid: {left:'0%',containLabel:true},
            legend: {type:'scroll',bottom:10,width:this.service.CLIENTW-60},
            xAxis: {data:this.xAxis},
            yAxis: [{name:this.tags.unit.y}],
            series: [
                {name:this.tags.report.contract,type:'bar',data:contracts},
                {name:this.tags.report.revenue,type:'bar',data:revenues},
                {name:this.tags.report.cost,type:'bar',data:costs}
            ]
        });
    }.bind(this))
    
    //点击x轴的柱状图对应的段，而不仅是柱状图
    this.monthCharts.on('click', function(params){
        if(params.dataIndex<this.monNum){
            this.monthOrders=this.orders[params.dataIndex];
        }
    }.bind(this))
},
sku_changed() {
    this.query_sku();
},
date_range_end(range) {
    var ft=new Date(range.from.year, range.from.month-1, 1);
    var tt=new Date(range.to.year, range.to.month-1, 1);
    this.beginTime=ft.getTime();
    this.days=Math.ceil((tt.getTime()-this.beginTime)/86400000);
    var monNum=12*(range.to.year-range.from.year)+range.to.month-range.from.month
    if(monNum>0&&monNum<=12) {
        this.init_month(ft, this.days);
        this.query_sku();
        this.query_month();
    } else {
        this.$refs.errMsg.show(this.tags.invalidRange);
    }
},
init_month(begin,days) {
    var end=new Date(begin.getTime() + days*86400000);
    var ds=begin.getFullYear()+'/'+(begin.getMonth()+1)+' - ';
    if(end.getMonth()>0) {
        ds+=end.getFullYear()+'/'+end.getMonth();//少显示一个月
    }else {
        ds+=(end.getFullYear()-1)+'/12';
    }
    this.dateStr=ds
    this.monNum=(end.getFullYear()-begin.getFullYear())*12+end.getMonth()-begin.getMonth();//月数
    var axis=[];
    var dt=begin;
    for(var i=0;i<this.monNum;i++) {
        if(i==0||dt.getMonth()==0) {//第一个与一月显示年
            axis[i]=dt.getFullYear()+'/'+(dt.getMonth()+1);
        }else{
            axis[i]=dt.getMonth()+1;
        }
        if(dt.getMonth()<11){
            dt.setMonth(dt.getMonth()+1);
        } else {
            dt.setFullYear(dt.getFullYear()+1);
            dt.setMonth(0);
        }
    }
    this.xAxis=axis;
},
order_detail(id) {
    this.$router.push('/order?id='+id);
},
move_month(n) {
    var dt=new Date(this.beginTime);
    var mon=dt.getMonth()+n;
    if(mon<0) {
        dt.setFullYear(dt.getFullYear()-1);
        dt.setMonth(12+mon);
    } else if(mon>11) {
        dt.setFullYear(dt.getFullYear()+1);
        dt.setMonth(mon-12);
    } else {
        dt.setMonth(mon);
    }
    this.beginTime=dt.getTime();
    this.init_month(dt, this.days);
    this.query_sku();
    this.query_month();
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.home.balance}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-footer class="bg-white text-primary q-pa-md">
    <q-list><q-item>
    <q-item-section side @click="move_month(-1)">
     <q-icon name="navigate_before"></q-icon>
    </q-item-section>
    <q-item-section>
    <q-input v-model="dateStr">
      <template v-slot:prepend>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy transition-show="scale" transition-hide="scale">
            <q-date v-model="date" range @range-end="date_range_end" minimal>
              <div class="row items-center justify-end">
                <q-btn v-close-popup :label="tags.close" color="primary" flat></q-btn>
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
    </q-item-section>
    <q-item-section side @click="move_month(1)">
     <q-icon name="navigate_next"></q-icon>
    </q-item-section>
    </q-item></q-list>
  </q-footer>
  
  <q-page-container>
    <q-page class="q-pa-md">
<q-tabs v-model="tab" class="text-primary" dense>
  <q-tab name="mon" icon="business_center" :label="tags.report.month"></q-tab>
  <q-tab name="sku" icon="perm_contact_calendar" :label="tags.report.sku"></q-tab>
</q-tabs>
<q-separator></q-separator>
<div v-show="tab=='mon'">
   <div id="monthCharts" :style="{width:'100vw', height:'45vh'}"></div>
   <q-list>
      <q-item>
        <q-item-section>{{tags.order.title}}</q-item-section>
        <q-item-section>{{tags.order.signAt}}</q-item-section>
        <q-item-section>{{tags.order.price}}</q-item-section>
      </q-item>
      <q-item v-for="o in monthOrders" clickable @click="order_detail(o.id)">
        <q-item-section>{{o.customer}}-{{o.skuName}}</q-item-section>
        <q-item-section>{{o.signAt}}</q-item-section>
        <q-item-section>{{o.price}}</q-item-section>
      </q-item>
    </q-list>
</div>
<div v-show="tab=='sku'">
   <q-select v-model="skuId" emit-value map-options
     :options="skuList" @update:model-value="sku_changed"></q-select>
   <div id="skuCharts" :style="{width:'100vw', height:'50vh'}"></div>
</div>
    </q-page>
  </q-page-container>
</q-layout>
<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}