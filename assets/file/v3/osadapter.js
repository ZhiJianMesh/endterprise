const SERVICE_USER="user";
const SERVICE_UNIUSER="uniuser";
const SERVICE_CONFIG="config";
const SERVICE_ADDR="address";

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
function request(opts, service){
    return new Promise(function(resolve,reject){
        var s = JSON.stringify(opts);
        var cbId = __regsiterCallback(resp => {
            resolve(resp);
        });
        Http.request(s, service, cbId);
    });  
}

function download(opts, service) {
    return new Promise(function(resolve,reject){
		var s = JSON.stringify(opts);
        var cbId = __regsiterCallback(resp => {
            resolve(resp); //{code:xx,info:'',data:{size:yy,path:'path of local saved file'}}
        });
        Http.download(s, service, cbId);
    });
}

function readText(txt){
    return new Promise(function(resolve,reject){
        var cbId = __regsiterCallback(function(resp){
            resolve(resp);
        });
        TTS.read(txt, cbId);
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
function __default_jscb(id, resp) {
    var f=__callback_funs[id];
    if(typeof(f)=='function') {
        f(resp);
        __unRegsiterCallback(id)
    } else {
        Console.error("__default_jscb `" + id + "` not exists");
    }
}

function __regsiterCallback(cb) {
    __call_id++;
    __callback_funs[__call_id]=cb;
    return __call_id;
}

function __unRegsiterCallback(cbId) {
    delete __callback_funs[cbId];
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