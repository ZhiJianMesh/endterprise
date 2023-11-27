const SERVICE_USER="user";
const SERVICE_UNIUSER="uniuser";
const SERVICE_CONFIG="config";
const SERVICE_ADDR="address";

const RetCode={
OK:0,
DEPRECATED:1,
INTERNAL_ERROR:100,
HTTP_ERROR:101,
INVALID_TOKEN:102, //token无效
EMPTY_BODY:103,
DB_ERROR:104,
INVALID_SESSION:105, //会话错误
SERVICE_NOT_FOUND:106, //服务不存在
TOO_BUSY:107,
SYSTEM_TIMEOUT:108,
NOT_SUPPORTED_FUNCTION:109, //API存在，但是所需的功能不支持
API_NOT_FOUND:110, //API不存在
NO_RIGHT:111, //无权限
NO_NODE:112, //没有合适的节点
INVALID_NODE:113, //不合适的节点
THIRD_PARTY_ERR:114, //第三方服务错误
PAST_DUE:115, //欠费
UNKNOWN_ERROR:150,
EXISTS:2000,
NOT_EXISTS:2001,
API_ERROR:3000,
WRONG_JSON_FORMAT:3001,
INVALID_VERSION:3002,
DATA_WRONG:3003,
WRONG_PARAMETER:4000,
SERVICE_ERROR:5000,
INVALID_STATE:5001,
CLIENT_ERROR:100000,
CLIENT_DBERROR:100001
};

const MAX_TASK_NUM=256;//最多MAX_TASK_NUM个并发任务
const __callback_funs=new Array(MAX_TASK_NUM);
var __call_id=0;
function request(opts,service) {
	var jsonOpts = JSON.stringify(opts);
    return new Promise(resolve=>{
		var jsCbId = __regsiterCallback(resp => {
			resolve(resp);
		});
        Http.request(jsonOpts, service, jsCbId);
    });
}

function getExternal(opts) {
	var jsonOpts = JSON.stringify(opts);
    return new Promise(resolve=>{
		var jsCbId = __regsiterCallback(resp => {
			resolve(resp);
		});
        Http.getExternal(jsonOpts, jsCbId);
    });
}

function download(opts, service) {
	var jsonOpts = JSON.stringify(opts);
    return new Promise(resolve=>{
        var jsCbId = __regsiterCallback(resp => {
            resolve(resp); //{code:xx,info:'',data:{size:yy,path:'path of local saved file'}}
        });
        Http.download(jsonOpts, service, jsCbId);
    });
}

function readText(txt){
    return new Promise(resolve=>{
        var jsCbId = __regsiterCallback(resp => {
            resolve(resp);
        });
        TTS.read(txt, jsCbId);
    });
}

//在TextToVoice的回调中触发此函数
function __tts_jscb(id, resp) {
    var f=__callback_funs[id];
    if(typeof(f)=='function') {
        status = resp.data.status;
        f(status);
        if(status=='done' || status=='error') {
            __unRegsiterCallback(id)
        }
    } else {
        Console.error("__tts_jscb " + id + " not exists");
    }
}

//通用的回调，在java程序中触发，传的resp就是HandleResult
function __default_jscb(jsCbId, resp) {
    var f=__callback_funs[jsCbId];
    if(f) {
        f(resp);
        __unRegsiterCallback(jsCbId)
    } else {
        Console.error("__default_jscb `" + jsCbId + "` not exists");
    }
}

function __regsiterCallback(cb) {
    __call_id++;
    __callback_funs[__call_id % MAX_TASK_NUM]=cb;
    return __call_id;
}

function __unRegsiterCallback(cbId) {
    __callback_funs[cbId % MAX_TASK_NUM] = undefined;
}

function copyObj(src,segs){
    var dst={};
    for(var i of segs) {
        dst[i]=src[i]?src[i]:'';
    }
    return dst;
}

function copyObjTo(src,dst,segs){
    for(var i of segs) {
        dst[i]=src[i]?src[i]:'';
    }
}

function cloneObj(obj) {
    if(obj == null || obj == undefined) {return obj;}
    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var o of obj) {
            copy.push(cloneObj(o));
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

    return obj;
}

function storageSet(k, v) {
    var key=App.currentApp()+'_'+k;
    localStorage.setItem(key,v);
}

function storageGet(k, def) {
    var key=App.currentApp()+'_'+k;
    var v=localStorage.getItem(key);
    if(!v) return def;
    return v;
}

function storageRmv(k) {
    var key=App.currentApp()+'_'+k;
    localStorage.removeItem(key);
}

function findInArray(arr, s) {
    var no=0;
    for(var a in arr) {
        if(a==s) {
            return no;
        }
        no++;
    }
    return -1;
}

const Database = { //防止以后使用原生实现
    open(name, ver, descr) {
        return openDatabase('words', '1.0', 'words', 10 * 1024 * 1024);
    },
    execute(db, sql, params) {
        return new Promise(resolve=>{
            db.transaction(tx=>{
                tx.executeSql(sql, params,
                    (tx, res) => {
                        resolve({code:RetCode.OK, data:res});
                    },
                    (tx, err) => {
                        resolve({code:RetCode.CLIENT_DBERROR, info:err.message});
                    });
                }
            )
        })
    },
    /*private*/txExecSql(tx, sqls, i) {
        console.info("execute:" + sqls[i]);
        return new Promise(resolve=>{
            tx.executeSql(sqls[i], [],
                (tx, res) => {
                    if(i<sqls.length-1) {
                        this.txExecSql(tx, sqls, i+1).then(r => {
                            resolve(r);
                        });
                    } else {//执行完成了
                        resolve({code:RetCode.OK, data:res});
                    }
                },
                (tx, err) => {
                    resolve({code:6000, info:err.message});
                }
            );
        })
    },
    executes(db, sqls) { //只能执行增删改
        return new Promise(resolve=>{
            db.transaction(tx=>{
                this.txExecSql(tx, sqls, 0).then(res => {
                    return resolve(res);
                });
            })
        });
    }
}

function formatErr(code,info,errInfos){
    var err=__err_infos[''+code];
    if(!err) {
        err = errInfos[''+code];
    }
    if(!err){
        if(code>=4000&&code<5000) {
            err=__err_infos['4000'];
        } else if(code>=5000){
            err=__err_infos['5000']
        } else {
            err=__err_infos['unknown'];
        }
    }
    var msg = "";
    if(info instanceof Array) {
        for(var i of info) {
            msg += i + '<br>';
        }
    } else {
        msg = info;
    }
    return err + "["+code+"]:" + msg;
}

function addErrInfo(code,info) {
    __err_infos[''+code]=info;
}
document.write("<script src='/assets/v3/tags/"+Platform.language()+".js'></script>");