const HOUR_MS=3600000;
export default {
inject:['service', 'tags'],
data(){return {
    services:[],
    cols:[],
	stats:{dlg:false,chart:null,width:0,date:{from:'',to:''},proxyDate:{from:'',to:''},service:''}
}},
created() {
    this.cols=this.service.services.cols;
    this.services=this.service.services.list;
	var dt=new Date();
	var to=dt.getFullYear()+'/'+(dt.getMonth()+1)+'/'+dt.getDate();
	dt.setTime(dt.getTime()-3*24*HOUR_MS);
	var from=dt.getFullYear()+'/'+(dt.getMonth()+1)+'/'+dt.getDate();
	this.stats.date={from:from,to:to};
	this.stats.width=document.documentElement.clientWidth*0.7;
},
methods:{
refresh(){
    this.service.refreshState();
    this.cols=this.service.services.cols;
    this.services=this.service.services.list;
},
showStats(){
	this.stats.dlg=true;
	this.stats.chart=Vue.markRaw(echarts.init(document.getElementById('stats_chart')));
	var from=parseInt(new Date(this.stats.date.from).getTime()/HOUR_MS)
	var to=parseInt(new Date(this.stats.date.to).getTime()/HOUR_MS)
	var dta = {cmd:"visitstats", from:from, to:to, service:this.stats.service};
    this.service.command(dta).then(resp=>{
		if(resp.code != RetCode.OK) {
			this.$refs.errDlg.showErr(resp.code, resp.info);
			return;
		}
		if(resp.data.stats.length==0) {
			return;
		}
		//at,api,exc,fail,file
		var cols=resp.data.cols;
		var cn=cols.length;
		var data=[];
		
		for(var l of resp.data.stats) {
			var d={};
			for(var i=0; i<cn; i++) {
				d[cols[i]]=l[i];
			}
			data.push(d);
		}

		var dt=new Date();
		var xAxis=[];
		var apis=[];
		var fails=[];
		var excs=[];
		var files=[];
		
		var n,t,h,oldAt=data[0].at;
		for(var l of data) {
			n=l.at-oldAt;
			if(n>1) {
				n--;
				for(var i=0;i<n;i++,t+=HOUR_MS) {
					dt.setTime(t);
					apis.push(0);
					fails.push(0);
					excs.push(0);
					files.push(0);
					h=dt.getHours();
					if(h==0) {
						xAxis.push(dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate());
					}else{
						xAxis.push(h+':00');
					}
				}
			}			
			apis.push(l.api);
			fails.push(l.fail);
			excs.push(l.exc);
			files.push(l.file);
			
			t=l.at*HOUR_MS;
			dt.setTime(t);
			h=dt.getHours();
			if(h==0) {
				xAxis.push(dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate());
			}else{
				xAxis.push(h+':00');
			}
			oldAt=l.at;
		}
		var series=[
			{name:this.tags.om.requests, type:'bar', data:apis, yAxisIndex:0},
			{name:this.tags.om.fails, type:'line', data:fails, yAxisIndex:0, itemStyle:{color:'orange'}},
			{name:this.tags.om.excs, type:'line', data:excs, yAxisIndex:0, itemStyle:{color:'red'}},
			{name:this.tags.om.files, type:'line', data:files, yAxisIndex:0, itemStyle:{color:'green'}}
		];
		
		this.stats.chart.setOption({
			title: {show:false},
			tooltip: {},
			legend: {type:'scroll', bottom:10, width:this.stats.width},
			grid: {left:'0%', containLabel:true},
			xAxis: {data:xAxis, type:'category',axisLabel:{interval:(i,l)=>{return l.length>5}}},
			yAxis: [{name:this.tags.om.unit, minInterval:1}],
			series: series
		});
	});
},
statsDateChanged() {
	this.stats.date=this.stats.proxyDate;
	this.showStats();
}
},

template: `
<q-layout view="lHh lpr lFf" container style="height:100vh;">
  <q-header class="bg-grey-1 text-primary">
    <q-toolbar>
      <q-btn flat round icon="arrow_back" dense @click="service.go_back"></q-btn>
      <q-toolbar-title>{{tags.om.serviceState}}</q-toolbar-title>
      <q-btn flat round icon="refresh" dense @click="refresh"></q-btn>
    </q-toolbar>
  </q-header>
  <q-page-container>
    <q-page class="q-pa-md">  
<q-markup-table flat>
  <thead>
   <tr><td v-for="c in cols">{{c}}</td></tr>
  </thead>
  <tbody><tr v-for="row in services" @click="stats.dlg=true;stats.service=row[0]">
   <td v-for="c in row">{{c}}</td>
  </tr></tbody>
</q-markup-table>
    </q-page>
  </q-page-container>
</q-layout>

<component-alert-dialog :title="tags.failToCall" :errMsgs="tags.errMsgs" :close="tags.close" ref="errDlg"></component-alert-dialog>

<!-- ÇëÇóÍ³¼Æµ¯´° -->
<q-dialog v-model="stats.dlg" no-backdrop-dismiss @show="showStats">
  <q-card style="min-width:80vw;">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">{{stats.service}}-{{tags.om.requests}}</div>
	  <q-space></q-space>
	  <q-btn icon="event" flat>
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="stats.proxyDate" range>
            <div class="row items-center justify-end">
              <q-btn :label="tags.ok" color="primary" @click="statsDateChanged" v-close-popup></q-btn>
              <q-btn :label="tags.close" color="primary" flat v-close-popup></q-btn>
            </div>
          </q-date>
        </q-popup-proxy>
		{{stats.date.from}} => {{stats.date.to}}
	  </q-btn>
	  <q-space></q-space>
      <q-btn icon="close" flat round dense v-close-popup></q-btn>
    </q-card-section>
    <q-card-section class="q-pt-none">
	 <div id="stats_chart" style="width:78vw;height:70vh;"></div>
    </q-card-section>
  </q-card>
</q-dialog>
`
}