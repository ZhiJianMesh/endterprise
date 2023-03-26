const SERVICE_USER="user";
const SERVICE_UNIUSER="uniuser";
const SERVICE_CONFIG="config";
const SERVICE_ADDR="address";

const COMPANY_ID="cid";
const COMPANY_NAME="store_company_name";
const COMPANY_SERVERADDR="serverAddr";
const COMPANY_ACCESSCODE="accessCode";

const RetCode={
OK:0,
DEPRECATED:1,
INTERNAL_ERROR:100,
HTTP_ERROR:101,
INVALID_TOKEN:102,
EMPTY_BODY:103,
DB_ERROR:104,
INVALID_SESSION:105,
SERVICE_NOT_FOUND:106, //服务不存在
TOO_BUSY:107,
SYSTEM_TIMEOUT:108,
NOT_SUPPORTED_FUNCTION:109, //API存在，但是所需的功能不支持
API_NOT_FOUND:110, //API不存在
NO_RIGHT:111,
NO_NODE:112,
THIRD_PARTY_ERR:113,
UNKNOWN_ERROR:150,
EXISTS:2000,
NOT_EXISTS:2001,
API_ERROR:3000,
WRONG_JSON_FORMAT:3001,
INVALID_VERSION:3002,
DATA_WRONG:3003,
WRONG_PARAMETER:4000,
SERVICE_ERROR:5000,
INVALID_STATE:5001
};

const __callback_funs={};
var __call_id=0;
function __regsiterCallback(cb) {
    __call_id++;
    __callback_funs[__call_id]=cb;
    return __call_id;
}

function __unRegsiterCallback(cbId) {
    delete __callback_funs[cbId];
}
//通用的回调，在java程序中触发，传的resp就是HandleResult
function __default_jscb(id, resp) {
    var f=__callback_funs[id];
    if(typeof(f)=='function') {
        f(resp);
        __unRegsiterCallback(id)
    } else {
        Console.error("__default_jscb `" + id + "` not exists");
    }
}

function storage_set(k, v) {
    localStorage.setItem(k,v);
}
function storage_get(k, def) {
    var v=localStorage.getItem(k);
    if(!v) return def;
    return v;
}
function storage_rmv(k) {
    localStorage.removeItem(k);
}
function storage_clr() {
    localStorage.clear();
}

var __services={
    codebook:{type:'PERSONAL'},
    enstu:{type:'PERSONAL'}
};
var __request_cache={};
var __traceid=0;
function request(opts, service){
    if(!opts.headers) {
        opts.headers={};
    }
    if(opts.private!==undefined && !opts.private) { //公有，未传则默认私有
        return sendRequest(opts, service);
    }

    opts.headers['access_token']='';
    return getToken(service).then(resp => {
        if(resp.code != RetCode.OK) {
            return resp;
        }
		storage_set(service, resp.data.access_token);
        opts.headers.access_token=resp.data.access_token;
        return sendRequest(opts, service);
    });
}

function getToken(service) {
    var st=storage_get(service,'');
    if(st!='') {
        return new Promise((resolve, reject)=>{
            resolve({code:RetCode.OK, data:{access_token:st}});
        });
    }
    
    var userService;
    if(__services[service] && __services[service].type=='PERSONAL') {
        userService=SERVICE_UNIUSER;
    } else {
        userService=SERVICE_USER;
    }
    
    var at=storage_get(userService,'');
    if(!at){//以用户token换服务token
        return new Promise((resolve, reject)=>{
            resolve({code:RetCode.NO_RIGHT, info:"no right"});
        });
    }
    var opts={method:'GET',
        url:'/api/serviceToken?service='+service,
        headers:{access_token:at}
    };
    return sendRequest(opts, userService);
}

function sendRequest(opts, service) {
    var url=location.protocol+"//"+location.host+"/"+service;
    if(opts.url.startsWith("/api/")) {
        url += opts.url;
    } else {
        url += "/api" + opts.url;
    }
    __traceid++;
    var hh = opts.headers;
    if(!hh) {
        hh={trace_id:'browser'+__traceid, cid:Http.cid()};
    } else {
        hh.trace_id='browser'+__traceid;
        hh.cid=Http.cid();
    }

    return new Promise(function(resolve, reject){
        var req = {method:opts.method, url:url, headers:hh};
        if(opts.method.toUpperCase() == "POST") {
            req.data = opts.data;
            opts.cache=false;//post请求不容许缓存
        } else if(opts.cache) {
            var cache=__request_cache[req.url]; //需要加超时时间控制
            if(cache!==undefined) {
                resolve(__request_cache[req.url]);
                return;
            }
        }

        axios(req).then(
        res => {
            if(res.status == 200) {
                console.info(service + "=>" + opts.url + ":" + JSON.stringify(res.data));
                if(opts.cache) {
                    __request_cache[req.url]=res.data;
                }
                resolve(res.data);
            } else {
                resolve({code:RetCode.HTTP_ERROR, info:"http error,status:" + res.status});
            }
        },
        err => {
            resolve({code:RetCode.HTTP_ERROR, info:"http error"})
        });
    });
}

function download(opts, service) {
    if(!opts.headers) {
        opts.headers={};
    }
    if(opts.private!==undefined && !opts.private) { //默认私有
        return innerDownload(opts, service);
    }

    opts.headers['access_token']='';
    return getToken(service).then(resp => {
        if(resp.code != RetCode.OK) {
            return resp;
        }
		storage_set(service, resp.data.access_token);
        opts.headers.access_token=resp.data.access_token;
        return innerDownload(opts, service);
    });
}

function innerDownload(opts, service) {
    var url=location.protocol+"//"+location.host+"/"+service + opts.url;
    __traceid++;

    opts.headers.trace_id='browser'+__traceid;
    opts.headers.cid=Http.cid();

    return new Promise((resolve, reject)=>{
        axios({method:"GET",url:url,responseType:"blob", headers:opts.headers}).then(
        res => {
            if(res.status != 200) {
                Console.debug("fail to download " + url);
                resolve({code:RetCode.HTTP_ERROR, info:"status code " + res.status});
                return;
            }
            var contentType=res.headers['content-type'];
            if(!contentType) {
                contentType='application/octet-stream';
            }
            var fileName;
            var disposition=res.headers['content-disposition'];
            if(disposition) {
                var k='filename=';
                var pos=disposition.indexOf(k);
                if(pos>0) {
                    fileName=disposition.substring(pos+k.length,disposition.length)
                            .trim().replace('/', '_');
                    fileName=decodeURIComponent(fileName);
                }
            }
            if(!fileName){
                fineName=opts.url.replace('/', '_');
            }

            var size=res.data.size;
            var blob = new Blob([res.data], {type: contentType})
            var link = document.createElement('a')
            link.href = window.URL.createObjectURL(blob)
            link.download = fileName
            link.click()
            window.URL.revokeObjectURL(link.href)//释放内存
            resolve({code:RetCode.OK, info:"Success", data:{size:size, saveAs:fileName}});
        },
        err => {
            Console.debug(err);
            resolve(500)
        });
    });
}

function copyObj(src,segs){
    var dst={};
    var seg;
    for(var i in segs) {
        seg=segs[i]
        dst[seg]=src[seg]?src[seg]:'';
    }
    return dst;
}

function cloneObj(obj) {
    if(obj == null) {return obj;}
    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i]=cloneObj(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for(var k in obj) {
            copy[k] = cloneObj(obj[k]);
        }
        return copy;
    }

    throw new Error("Unable to clone obj! Its type isn't supported.");
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function readText(txt) {
    return new Promise(function(resolve, reject){
        console.info("read text " + txt);
        setTimeout(function() {resolve('done');}, 500);
    });
}

const JStr={
    creditCodeOrigin:'0123456789ABCDEFGHJKLMNPQRTUWXY', //可用字符，不含I、O、S、V、Z
    creditWeightFactors:[1,3,9,27,19,26,16,17,20,29,25,13,8,24,10,30,28], //对应顺序的加权因子 
    chkCreditCode(code) {
        if(!code || code.length !== 18) {//空值返回false
            return false;
        }
        
        let ci; // 统一社会信用代码相应顺序的值
        let wi; // 统一社会信用代码相应顺序的加权因子
        let total = 0; // 计算结果
    
        // 数值与加权因子相乘之和
        for(let i = 0; i < code.length - 1; i++) {
            ci = this.creditCodeOrigin.indexOf(code[i]);
            wi = this.creditWeightFactors[i];
            total += ci*wi; 
        }
    
        // 最后一位校验
        let logicCheckCode = 31 - total % 31;
        if (logicCheckCode === 31) logicCheckCode = 0;
        logicCheckCode = this.creditCodeOrigin[logicCheckCode];
        return logicCheckCode===code.slice(17);
    },
    base64CharCode(c) {
        if (c >= 'A' && c <= 'Z') {
            return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
        } else if (c >= 'a' && c <= 'z') {
            return c.charCodeAt(0) - 'a'.charCodeAt(0) + 36;
        } else if (c >= '0' && c <= '9') {
            return c.charCodeAt(0) - '0'.charCodeAt(0);
        } else if (c == '-') {
            return 62;
        } else {
            return 63;
        }
    },
    base64Char(v) {
        if (v >= 0 && v <= 9) {
            return String.fromCharCode('0'.charCodeAt(0) + v);
        } else if (v >= 10 && v <= 35) {
            return String.fromCharCode('a'.charCodeAt(0) + v);
        } else if (v >= 36 && v <= 52) {
            return String.fromCharCode('A'.charCodeAt(0) + v);
        } else  if (c == 62) {
            return '-';
        } else {
            return '_';
        }
    }
}

const Console = {
    debug(s) {console.debug(s)},
    info(s) {console.info(s)},
    warn(s) {console.warn(s)},
    error(s) {console.error(s)}
}
const View = {
    width() {return document.documentElement.clientWidth},
    height() {return document.documentElement.clientHeight},
    portrait() {},
    landscape() {},
    undefineOrientation() {}
}
const Server = {
    state:0,
    getState(jsCbId) {
        __default_jscb(jsCbId,{code:0,data:{state:this.state}});
    },
    fileCalls() {return 29999},
    apiCalls() {return 1000},
    alter(jsCbId) {
        this.state=2;
        if(this.state!=3) {
            sleep(3000).then(()=> {
                this.state=3;
                __default_jscb(jsCbId,{code:0,data:{state:3}});
            })
        } else {
            sleep(1000).then(()=> {
                this.state=4;
                __default_jscb(jsCbId,{code:0,data:{state:4}});
            })
        }
    },
    address() {return "192.168.1.1"},
    runTime() {return 100000},
    startupAt() {return 1657157855534},
    getServiceVer(s){return 1000},
    serviceIcon(s) {return "/" + s + "/favicon.png"},
	installService(s,jsCbId){
		for(var i=0;i<100;i++) {
			sleep(30 * i).then(()=>{
				installProgress(1,"test"+i);
			})
		}
		sleep(3000).then(()=>{
			__default_jscb(jsCbId,{code:0});
		})
	},
	unInstallService(s){},
    refreshConsoleToken(){return '1234567890123456'},
    getDnsAccessCode(){return "123456"},
    resetDnsAccessCode(){return "723456"},
    getServices(jsCbId){ //只是用于测试
        var data={code:RetCode.OK, data:{services:[
            {name:"crm",displayName:"客户关系管理",author:"Lgy", level:4, favicon:"/crm/favicon.png", version:"0.1.0",updatable:false},
            {name:"member",displayName:"会员",author:"Lgy",level:4, favicon:"/member/favicon.png", version:"0.1.0",updatable:true, srvVer:"0.2.0"},
            {name:"user",displayName:"用户服务",author:"Lgy",level:3, favicon:"/user/favicon.png", version:"0.1.0",updatable:true, srvVer:"0.2.0"},
            {name:"enstu",displayName:"英语教学",author:"Lgy",level:100, favicon:"/enstu/favicon.png", version:"0.1.0",updatable:true, srvVer:"0.2.0"},
            {name:"bios",displayName:"注册发现服务",author:"Lgy",level:0, favicon:"/bios/favicon.png", version:"0.1.0",updatable:false},
            {name:"oauth2",displayName:"鉴权服务",author:"Lgy",level:1, favicon:"/assets/favicon.png", version:"0.1.0",updatable:false}
        ]}};
        __default_jscb(jsCbId,data);
    },
    backupInfo(jsCbId) {
        __default_jscb(jsCbId,{
            code:RetCode.OK,info:'Success',
            data:{at:-1,recent:0,key:'123456'}
        });
    },
    wanGwInfo(jsCbId) {
        __default_jscb(jsCbId,{
            code:RetCode.OK,info:'Success',
            data:{addr:'192.168.0.102:8523',state:0}
        });
    },
    saveAdvanceCfg(jsCbId, req) {
        __default_jscb(jsCbId,{code:RetCode.OK,info:'Success'});
    },
    companyName(){return storage_get(COMPANY_NAME,"至简网格")},
    companyId(){return 40}, //storage_get(COMPANY_ID,'0')
	companyInfo() {},
	setCompanyInfo(name, country, province, city, info) {},
	storeCompanyInfo() {},
    creditCode(){return "914403001922038216"},
    location(){return "江苏省 南京市"},
    setLogLevel(level) {},
    logLevel() {return 'DEBUG'},
	serviceStarted() {return true},
    register(creditCode,pwd,name,country,province,city,county,info,jsCbId){
        __default_jscb(jsCbId, {code:RetCode.OK,info:"success"})
    },
	unRegister(creditCode,pwd,jsCbId){
		__default_jscb(jsCbId, {code:RetCode.OK,info:"success"})
	},
	logPath(){return "d:\\work\\code\\release\\xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
}

const Http={
    cid(){return storage_get(COMPANY_ID,0)},
    saveCid(cid, isPublic, addr, accessCode, jsCbId) {
        storage_set(COMPANY_ID,cid);
		storage_set(COMPANY_SERVERADDR,addr);
		storage_set(COMPANY_ACCESSCODE,accessCode)
    },
    serverAddr(){return location.host},
    companyName(){return storage_get(COMPANY_NAME,'至简网格')},
	accessCode(){return storage_get(COMPANY_ACCESSCODE,'')},
    authorized(userType) {
        if(userType=='personal') {
            return storage_get(SERVICE_UNIUSER,'')!='';
        }
        return storage_get(SERVICE_USER,'')!=''
    },
    login(acc,pwd,userType,jsCbId) {//模拟环境不区分userType
        var dta={account:acc,password:pwd,grant_type:'password',cid:this.cid()};
        var service=userType=='personal' ? SERVICE_UNIUSER : SERVICE_USER;
        sendRequest({method:'POST',url:'/api/login',private:false,data:dta}, service).then(function(resp) {
            if(resp.code==RetCode.OK) {
                storage_set(service, resp.data.access_token);
            }
            __default_jscb(jsCbId,resp)
        })
    },
    logout(userType,jsCbId) {
        var service=userType=='personal' ? SERVICE_UNIUSER : SERVICE_USER;
        var at=storage_get(service);
        var opts={method:'GET',url:'/api/logout',headers:{access_token:at},private:false};
        sendRequest(opts, service).then(function(resp) {
            storage_rmv(service);
            __default_jscb(jsCbId,resp)
        })
    },
    getExternal(opts,jsCbId) {
        __default_jscb(jsCbId,`{
       "introduce": {
        "descrs": [
           "满足小微企业客户关系管理所需，实现客户、联系人、订单、服务、回款管理，支持按工作流方式推动销售、服务、回款等工作。",
           "可自定义工作流步骤，每个步骤可以单个负责人签字，也可以多个参与人共同决策，方便企业实现工作流程规范化。",
           "实时数据统计，并呈现在主界面中，普通成员可以查看一月内的报表，企业主与财务可以查看年度与月度报表。",
           "精准的数据授权，只将数据授权给参与工作流的成员，其他成员通过数据分享查看数据，数据分享可设置期限。"
           ],
           "images": [
               {
                   "src": "_imgs/1.png",
                   "info": "具备客户、联系人、订单管理功能"
               },
               {
                   "src": "_imgs/2.png",
                   "info": "同时支持回款、服务工作流操作"
               },
               {
                   "src": "_imgs/3.png",
                   "info": "实时报表呈现，及时掌握团队状态"
               }
           ]
       }}`)
    }
}

const App={
    openApp(app) {location.href='/' + app + '/index.html'},
    install(app, jsCbId) {
         Console.info("install app " + app);
        __default_jscb(jsCbId,{code:RetCode.OK,info:"success"});
    },
    unInstall(service, jsCbId) {
         console.info("uninstall app " + app);
        __default_jscb(jsCbId,{code:RetCode.OK,info:"success"});
    },
    serviceIcon(s) {return "/" + s + "/favicon.png"},
    list() { return JSON.stringify([
        {name:"crm",displayName:"客户关系管理",version:"1000"},
        {name:"member",displayName:"会员",version:"1000"},
        {name:"user",displayName:"用户服务",version:"1000"},
        {name:"enstu",displayName:"英语教学",version:"1000"},
        {name:"bios",displayName:"注册发现服务",version:"1000"},
        {name:"oauth2",displayName:"鉴权服务",version:"1000"}
    ])},
    logPath(){return "d:\\work\\code\\release"},
    isInstalled(){return true},
    isBuiltin(app) {return app=="market"||app=="settings"||app=="about"||app=="assets"},
    build(){return {ver:"0.1.0",os:"android",brand:"njhx",language:"zh_CN",agent:"mc_android_0.1.0"}}
}

const OS={
    scanCode(jsCbId) {
        var info={act:"checkin",id:40,code:"ABCDFFGG",addr:"localhost:8523"};
        var data={type:'QrCode',value:JSON.stringify(info)};
        __default_jscb(jsCbId,{code:RetCode.OK,info:"success", data:data})
    }
}

const Logs = {
    listLogs(jsCbId) {__default_jscb(jsCbId,{code:RetCode.OK,info:"success", data:{list:["a","b"]}}) },
    download(f,jsCbId) {__default_jscb(jsCbId,{code:RetCode.OK,info:"success", data:{saveAs:"test",size:100}})}
}
document.write("<script src='/assets/axios_0.21.1.js'><\/script>");