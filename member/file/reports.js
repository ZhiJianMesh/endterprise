export default {
inject:['service', 'tags'],
data() {return {
    beginTime:0,
    days:7,
    pkgId:0,
    mainCharts:null,
    pkgCharts:null,
    date:'',
    dateStr:'',
    packageOpts:[]
}},
created(){
    var end=new Date();
    this.beginTime=end.getTime()-7*86400000;
    var start=new Date(this.beginTime);
    this.dateStr=start.getFullYear()+'-'+(start.getMonth()+1)+'-'+start.getDate()
     +"  "+end.getFullYear()+'-'+(end.getMonth()+1)+'-'+end.getDate();
},
mounted(){
    this.mainCharts=echarts.init(document.getElementById('mainCharts'));
    this.pkgCharts=echarts.init(document.getElementById('pkgCharts'));
    this.query_main();
    this.service.getPackages().then(function(data){
        this.packageOpts=data.opts;
        this.pkgId=data.pkgs[0].id;
        this.query_pkg();
    }.bind(this)).catch(function(err) {
        Console.info(err);
    });
},
methods:{
query_main() {
    var beginTime=Math.ceil(this.beginTime/7200000);
    var url="/api/report/main?beginTime="+beginTime+"&days="+this.days;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            Console.info("Url:" + url + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        
        //reportAt,vipNum,revenue,orderNum,logNum
        var vipNum=[];
        var revenue=[];
        var orderNum=[];
        var logNum=[];
        var reportAt=[];
        var dt, l;
        var foreDay='', dayNo;
        
        for(var i in resp.data.data) {
            l=resp.data.data[i];
            dt=new Date(l[0]*7200000);
            dayNo=(dt.getMonth()+1)+'.'+dt.getDate();
            if(foreDay==dayNo) {
                reportAt.push(dt.getHours()+':00');
            } else {
                reportAt.push(dayNo+'/'+dt.getHours()+':00');
                foreDay=dayNo;
            }
            vipNum.push(l[1]);
            revenue.push(l[2]);
            orderNum.push(l[3]);
            logNum.push(l[4]);
        }
        var series=[
            {name:this.tags.vipNum,type:'line',data:vipNum,yAxisIndex:0},
            {name:this.tags.revenue,type:'line',data:revenue,yAxisIndex:1},
            {name:this.tags.orderNum,type:'line',data:orderNum,yAxisIndex:0},
            {name:this.tags.logNum,type:'line',data:logNum,yAxisIndex:0}
        ];
        
        this.mainCharts.setOption({
            title: {text: this.tags.mainReports},
            tooltip: {},
            legend:{},
            xAxis: {data:reportAt},
            yAxis: [{name:this.tags.unitT},{name:this.tags.unitY}],
            series: series
        });
    }.bind(this))
},
query_pkg() {
    var beginTime=Math.ceil(this.beginTime/86400000);
    var url="/api/report/package?beginTime="+beginTime+"&days="+this.days+"&pkgId="+this.pkgId;
    request({method:"GET",url:url}, this.service.name).then(function(resp){
        if(resp.code != 0) {
            Console.info("Url:" + url + ",code:" + resp.code + ",info:" + resp.info);
            return;
        }
        //reportAt,revenue,orderNum,orderBal,logNum,logVal
        var revenue=[];
        var orderBal=[];
        var orderNum=[];
        var logNum=[];
        var logVal=[];
        var reportAt=[];
        var dt, l;
        
        for(var i in resp.data.data) {
            l=resp.data.data[i];
            dt=new Date(l[0]*86400000);
            reportAt.push((dt.getMonth()+1)+'.'+dt.getDate());
            revenue.push(l[1]);
            orderNum.push(l[2]);
            orderBal.push(l[3]);
            logNum.push(l[4]);
            logVal.push(l[5]);
        }
        var series=[
            {name:this.tags.revenue,type:'line',data:revenue,yAxisIndex:1},
            {name:this.tags.orderBal,type:'line',data:orderBal,yAxisIndex:1},
            {name:this.tags.orderNum,type:'line',data:orderNum,yAxisIndex:0},
            {name:this.tags.logVal,type:'line',data:logVal,yAxisIndex:0},
            {name:this.tags.logNum,type:'line',data:logNum,yAxisIndex:0}
        ];
        
        this.pkgCharts.setOption({
            title: {text: this.tags.pkgReports},
            tooltip: {},
            legend:{},
            xAxis: {data:reportAt},
            yAxis: [{name:this.tags.unitT},{name:this.tags.unitY}],
            series: series
        });
    }.bind(this))
},
pkg_changed() {
    this.query_pkg();
},
date_range_end(range) {
    var f=range.from;
    var t=range.to;
    this.dateStr=f.year+'/'+f.month+'/'+f.day + "  " + t.year+'/'+t.month+'/'+t.day;
    
    var ft=new Date(f.year,f.month-1,f.day);
    var tt=new Date(t.year,t.month-1,t.day);
    this.beginTime=ft.getTime();
    this.days = Math.ceil((tt.getTime()-this.beginTime)/86400000);
    if(this.days <= 31) {
        this.query_pkg();
        this.query_main();
    } else {
        this.$refs.errMsg.show(this.tags.exceedsDayNum);
    }
}
},

template:`
<q-layout view="lHh lpr lFf" container style="height:100vh">
  <q-header elevated>
   <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.reports}}</q-toolbar-title>
   </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">
    
<q-input filled v-model="dateStr">
  <template v-slot:prepend>
    <q-icon name="event" class="cursor-pointer">
      <q-popup-proxy transition-show="scale" transition-hide="scale">
        <q-date v-model="date" range @range-end="date_range_end">
          <div class="row items-center justify-end">
            <q-btn v-close-popup :label="tags.close" color="primary" flat />
          </div>
        </q-date>
      </q-popup-proxy>
    </q-icon>
  </template>
</q-input>
<div id="mainCharts" :style="{width:'100vw', height:'40vh'}"></div>
<q-space></q-space>
<q-select v-model="pkgId" emit-value map-options
 :options="packageOpts" @update:model-value="pkg_changed"></q-select>
<div id="pkgCharts" :style="{width:'100vw', height:'40vh'}"></div>
    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errMsg"></component-alert-dialog>
`
}