const __err_infos={
'1':"deprecated",
'100':"system internal errror",
'101':"network error",
'102':"no token",
'103':"null request",
'104':"database error",
'105':"invalid token or not login",
'106':"service not found",
'107':"system busy",
'108':"request timeout",
'109':"api not supported",
'110':"feature not exists",
'111':"no right",
'112':"no valid node",
'113':"request a irrelevant node",
'114':"third party error",
'150':"unknown error",
'2000':"not exists",
'2001':"already exists",
'3000':"api error",
'3001':"invalid requst body",
'3002':"version not match",
'3003':"in an wrong state",
'4000':"parameter error",
'5000':"service exception",
'5001':"service not in a valid state",
'100000':"client fail to handle",
'unknown':"unknown"
};

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

