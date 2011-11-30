Components.utils.import("resource://gre/modules/NetUtil.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
if(DBRUtil == null){
	var DBRUtil = {
		scriptLoader : Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader),
        decoder : Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService(Components.interfaces.nsIScriptableUnicodeConverter),
        ios: Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
        css : Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),        
        bss:Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService),
    }
	DBRUtil.loadScript = function(url){
		DBRUtil.scriptLoader.loadSubScript(url,DBRUtil,'utf-8')
	}

	// 导入参数
	DBRUtil.loadScript("chrome://doubanradio/content/kit/param.js")
    // 导入简体转换
	DBRUtil.loadScript("chrome://doubanradio/content/kit/simplized.js")
	// 导入ID3
	DBRUtil.loadScript("chrome://doubanradio/content/kit/id3tag.js")
	// 导入歌词脚本
	DBRUtil.loadLyricScript = function(){
		DBRUtil.loadScript("chrome://doubanradio/content/module_lyric/engine.js",DBRUtil,'utf-8')
		DBRUtil.loadScript("chrome://doubanradio/content/module_lyric/youdao.js",DBRUtil,'utf-8')
		DBRUtil.loadScript("chrome://doubanradio/content/module_lyric/yahoo.js",DBRUtil,'utf-8')
	}
	
	
	DBRUtil.$ = function $(id){
        return document.getElementById(id);
    }
    
    DBRUtil.getPref = function getPref(key,v){
        return Application.prefs.getValue('extensions.doubanradio.' + key, v == null ? "" : v)
    }
    
    DBRUtil.setPref = function setPref(key, value){
        Application.prefs.setValue('extensions.doubanradio.' + key, value)
    }
    
    DBRUtil.extendsClass = function(subCls,superCls) {  
        var sbp = subCls.prototype;  
        subCls.prototype = new superCls();  
        subCls.prototype.constructor = subCls;  
        for(var atr in sbp) {  
            subCls.prototype[atr] = sbp[atr];  
        }  
        subCls.supr = superCls;  
    }

    
	DBRUtil.getPref2 = function (k){
		return JSON.parse(DBRUtil.getPref(k,'{}'))
	}
	    
	DBRUtil.setPref2 = function (k,v){
		DBRUtil.setPref(k,JSON.stringify(v))
	}
	
     DBRUtil.log2 = function log2(val){
        if (DBRUtil.getPref('debug', null)) 
            DBRUtil.css.logStringMessage("drb debug : " + val)
    }   
    
    // 获取本地化、格式化的文字
    DBRUtil.GS = function(key,args){
    	try{
	        if(!DBRUtil.sb) DBRUtil.sb = (document.getElementById('dbr_stringbundle'))         
	        return DBRUtil.sb[args ? 'getFormattedString' : 'getString'](key, args);
    	}catch(e){
    		return "";
    	}
    }
    
    DBRUtil.GST = function(key,args){
        return DBRUtil.GS("tooltiptext_"+key,args)
    }
    
    DBRUtil.GSH = function(key,args){
        return DBRUtil.GS("html_"+key,args)
    }
    
    DBRUtil.GSM = function(key,args){
        return DBRUtil.GS("menu_"+key,args)
    }
    
    DBRUtil.GSK = function(key,args){
        return DBRUtil.GS("accesskey_"+key,args)
    }
    
    DBRUtil.GSA = function(key,args){
        return DBRUtil.GS("alert_"+key,args)
    }
    
    DBRUtil.GSC = function(key,args){
        return DBRUtil.GS("content_"+key,args)
    }
    
    DBRUtil.GSS = function(key,args){
        return DBRUtil.GS("shortcut_"+key,args)
    }
    
    //TODO 超时处理  连接太快处理
    DBRUtil.sendXHR = function sendXHR(val, header, handler, arg,method,body){
        var req = new XMLHttpRequest();
        req.open(method? method:'GET', val, true);
        if(header){
            for(var t in header){
                req.setRequestHeader(t,header[t])                
            }
        }
        req.onreadystatechange = function(aEvt){
            if (req.readyState == 4) {
                if (req.status == 200 || req.status == 201) {
                    if (handler != null) 
                        handler(req.responseText, arg);
                }else if(req.status == 400|| req.status == 401){
                    DBRUtil.alert(DBRUtil.GSA('error',[ req.status+" " +req.responseText]))
                }else{
                    DBRUtil.alert(DBRUtil.GSA('error',[req.status] ))
                }
            }
        }
        req.send(body?body:null);
    }
    
    DBRUtil.initOSD =  function initOSD(){
        if (!DBRUtil.isLinux()) return null
        try {
            var localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
            localFile.initWithPath(DBRUtil.getPref('thirdpartytoolpath'))
            var osd = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
            osd.init(localFile)
            return osd
        }catch (e) {
            return null
        }
        return osd;
    }
    
    DBRUtil.getImageURL = function(image){
		return DBRUtil.ICO_PREFIX + image
    }
    
    DBRUtil.getIcoPrefix = function(){
        return
    }
    
    DBRUtil.isLinux =  function isLinux(){
        return window.navigator.userAgent.indexOf('Linux') > -1
    }
	
	DBRUtil.isWindow =  function (){
        return window.navigator.userAgent.indexOf('Window') > -1
    }
    
     DBRUtil.ce = function ce(name, node, data, handles, insertflg, extflg){
        var object = document.createElement(name);
        for (var p in data) {
            object.setAttribute(p, data[p])
            // 地址栏图片
			if(name == 'image' && p == 'src'){
				object.setAttribute('src',  DBRUtil.getImageURL(data[p]))
            }
			// 处理菜单
			if(p == 'id' && (name =='menu'||name=='menuitem') && !extflg){
                var tid = data[p].split('_')[2]
                object.setAttribute('label',  DBRUtil.GSM(tid))
                object.setAttribute('tooltiptext',  DBRUtil.GST(tid))
                object.setAttribute('accesskey',  DBRUtil.GSK(tid))
                object.setAttribute('key',  DBRUtil.GSS(tid))
            }
        }
        
        for (var p in handles) {
            object.addEventListener(p, handles[p], false)
        }
		
        if (typeof node === 'string') {
            node = document.getElementById(node)
        }
        if (insertflg != true) {
            if (node) 
                node.appendChild(object)
        }
        else {
            if (node) 
                node.insertBefore(object, node.firstChild)
        }
        return object
    }
    
     DBRUtil.rstr = function rstr(val, flg){
	 	DBRUtil.log2('DBRUtil.rstr~~~')
        var tmp = "";
        // 待改进
        for (var i = 0; i < val.length; i++) 
            ///(\d|[a-z]|[A-Z])/g.test(val[i]) ? tmp += val[i] : tmp += '%' + parseInt(val[i].charCodeAt(0)).toString(16)
            /[\x00-\x7f]/.test(val[i]) ? tmp += val[i] : tmp += '%' + parseInt(val[i].charCodeAt(0)).toString(16)
        return flg ? tmp : decodeURIComponent(tmp)
    }
    
    DBRUtil.rstr2 = function rstr2(val){
        var tmp = "";
        //TODO 待改进
        for (var i = 0; i < val.length; i++) {
            if (val[i].charCodeAt(0) < 128) {
                tmp += val[i]
            }
            else {
                var t = encodeURIComponent(val[i])
                t = t.split('%')
                var d = String.fromCharCode(parseInt(t[1], 16))
                d += String.fromCharCode(parseInt(t[2], 16))
                d += String.fromCharCode(parseInt(t[3], 16))
                tmp += d
            }
        }
        return tmp
    }
    
    DBRUtil.rstr3 = function(val){
           var t = ''
           for each(var c in val){
               var t2 = escape(c)
               if(t2.length<3) {
                   t2 = "\\u00" + t2.charCodeAt(0).toString(16);
               }
               t+= t2
           }
           return t.replace(/\%/g,'\\u00') ;        
    }
        
    DBRUtil.CCIN = function CCIN(cName, ifaceName){
        return Components.classes[cName].createInstance(Components.interfaces[ifaceName]);
    }
    
    DBRUtil.getTimeStamp = function(){
        return parseInt(new Date().getTime() / 1000)
    }
    
    DBRUtil.getRandomString = function(len){
        var dict = 'abcdefghijklmnopqrstuvwxyz'
        var str = ''
        for (len == null ? 6 : len; len > 0; len--) {
            str += dict[parseInt(Math.random() * 26)]
        }
        return str;
    }
    
    DBRUtil.getRandomNum = function(max){
        return parseInt(Math.random() * max);
    }
    
    DBRUtil.copy2clipboard = function(content){
        var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
        gClipboardHelper.copyString(content);
    }
	
	DBRUtil.fileNameProcessor = function(str){
		return str.replace(/(\\|\/|\?|\*|\>|\<|\:|\")/g,'')
	}
    
	// popup方式显示消息
    DBRUtil.alert = function(content,sec,rpos){
        var radio = rpos==null?DBRUtil.$('dbr_img_radio'):rpos
		// 不是主窗口的话还是用默认的方式
        if(!radio){
            alert(content)
            return;
        }
        var speaker = DBRUtil.$('dbr_panel_alert');
        clearTimeout(DBRUtil.timeoutID)
        if(speaker.state =='closed' || speaker.state =='hiding'){
            DBRUtil.clearNode(DBRUtil.$('dbr_vbox_alert'))
			// 失败啊，不用设置position就ok啦
            speaker.openPopup(radio, "", 0, 0, false, false)
        }
        DBRUtil.ce('description','dbr_vbox_alert',{value:content})
        DBRUtil.timeoutID = setTimeout(function(){
            speaker.hidePopup()   
      },sec?sec:5000)
    }
    
    DBRUtil.genSignatur2 = function(content){
        return DBRUtil.sha.b64_hmac_sha1(DBRUtil['oauth_consumer_secret_douban'],content);
    }
    
    // oauth意图是什么呢？就是对访问的url以及带的参数做签名
    DBRUtil.genSignature  = function(step,url,site,pin,status){
    	var secret,token,strA = step == 4 ? 'POST': 'GET';
    	if(step==1){
    	    secret = '';
    	    token = '';
    	}
    	if(step ==3){ 
    	   // sina取访问令牌这一步需要[POST]
    	   if(site=='sina') strA = 'POST'
    	   token =  DBRUtil['oauth_request_key_'+site]
    	   secret = DBRUtil['oauth_request_secret_'+site]
    	}
    	if(step ==4){
    	   token =  DBRUtil.getPref('oauth_access_key_'+site)
    	   secret = DBRUtil.getPref('oauth_access_secret_'+site)
    	}
    	do{
        	var strB = url				
        	var strC = [];
            strC.push('oauth_consumer_key=' + DBRUtil['oauth_consumer_key_'+site]);
            strC.push('oauth_nonce=' + DBRUtil.getRandomString(12));
            strC.push('oauth_signature_method=HMAC-SHA1');
            strC.push('oauth_timestamp=' +  DBRUtil.getTimeStamp());
            if(step >= 3){
        		strC.push("oauth_token=" + token)
        	}				
        	if(pin) strC.push('oauth_verifier='+pin)
        	if(status) {
        	    strC.push('status='+status)
        	}
            var base_string = [strA, DBRUtil.encodeURIComponent(strB), DBRUtil.encodeURIComponent(strC.join('&'))].join('&')      
            var oauth_signature = DBRUtil.sha.b64_hmac_sha1(DBRUtil['oauth_consumer_secret_'+site] + '&' + secret, base_string) + '='
    	}while(oauth_signature.indexOf('+')>-1||oauth_signature.indexOf('\\')>-1||oauth_signature.indexOf('/')>-1)
        if(pin) strC.pop()
		if(status) strC.pop()
		strC.push("oauth_signature=" + oauth_signature)			
	    if(status) strC.push('status='+status)            
	    if(pin) strC.push('oauth_verifier='+pin)            
	    return  strC.join(step == 4 ? ',' : '&')		
    }
	
	// oauth 第一步，获取请求令牌	
	DBRUtil.authorize = function (site){
        var url = DBRUtil['request_token_uri_'+site];
        var data = DBRUtil.genSignature(1, url,site);
        DBRUtil.sendXHR(url + '?' + data, null, function(txt){
            var request_token = txt.split('&')[site=='sina'?0:1].split('=')[1]
            var request_token_secret = txt.split('&')[site=='sina'?1:0].split('=')[1]
            DBRUtil['oauth_request_key_'+site] = request_token
            DBRUtil['oauth_request_secret_'+site] = request_token_secret
            // 豆瓣这一步不需要多余的值，新浪则不行，只能放弃callback。
            var param = site=='sina'?'oob': DBRUtil.PAGE_CALLBACK;
            DBRUtil.openPage(DBRUtil['authorization_uri_'+site]  + request_token + "&oauth_callback="+param)                     
        })
	}
	
   DBRUtil.authorize4Douban = function (){
        DBRUtil.authorize('douban')
	}
	
	DBRUtil.authorize4Sina = function (){
	         DBRUtil.authorize('sina')	    
	}
	
	// oauth 第三步用请求令牌换访问令牌
	DBRUtil.getAccessToken = function (site){
        var url = DBRUtil['access_token_uri_'+site];
        var data = DBRUtil.genSignature(3, url ,site);
	    DBRUtil.sendXHR(url + '?' + data, null, function(txt){
	        var access_token = txt.split('&')[1].split('=')[1]
            var access_token_secret =  txt.split('&')[0].split('=')[1]
            var uid = txt.split('&')[2].split('=')[1]
            DBRUtil.setPref('oauth_access_key_'+site,access_token)
            DBRUtil.setPref('oauth_access_secret_'+site, access_token_secret)
            delete DBRUtil['oauth_request_key_'+site]
            delete DBRUtil['oauth_request_secret_'+site]
            DBRUtil.alert(DBRUtil.GSA('gettoken'))
        })
	}

	DBRUtil.getAccessToken4Douban = function(){
	    DBRUtil.getAccessToken('douban')
	}
	
	DBRUtil.getAccessToken4Sina = function (){
	   var site = 'sina'
       var url = DBRUtil['access_token_uri_'+site];
       var pin = prompt("输入授权码")
       pin = pin && pin.trim();
       var data = DBRUtil.genSignature(3, url,site,pin);
       var header = {"Content-type": "application/x-www-form-urlencoded",
                      "Content-length": data.replace(/\,/g,'&').length,
	                  "Connection":"close"}
       DBRUtil.sendXHR(url , header, function(txt){
	        var access_token = txt.split('&')[0].split('=')[1]
            var access_token_secret = txt.split('&')[1].split('=')[1]
            var uid = txt.split('&')[2].split('=')[1]
            DBRUtil.setPref('oauth_access_key_'+site, access_token)
            DBRUtil.setPref('oauth_access_secret_'+site, access_token_secret)
            delete DBRUtil['oauth_request_key_'+site]
            delete DBRUtil['oauth_request_secret_'+site]
            alert(DBRUtil.GSA('gettoken'))
        },null,'POST',data.replace(/\,/g,'&')) 
	}
				
	DBRUtil.say2douban = function (txt,fn){
	    txt =txt.substring(0,128).replace(/&/g,'&amp;');
	    var url = DBRUtil['api_say_douban']
	    var data = DBRUtil.genSignature(4, url,'douban');
        var header = {
            'content-type': 'application/atom+xml',
            'Authorization' : 'OAuth realm=\"\",'+data
        }
 		var content = "<?xml version='1.0' encoding='UTF-8'?><entry xmlns:ns0=\"http://www.w3.org/2005/Atom\" xmlns:db=\"http://www.douban.com/xmlns/\"><content>"+txt+"</content></entry>"		
	   	DBRUtil.sendXHR(url,header,fn, null,'POST',content)
	}
	
	
	DBRUtil.say2sina = function (txt,fn,picFile){
	     txt = 	DBRUtil.encodeURIComponent(txt)
	     var url = "http://api.t.sina.com.cn/statuses/upload.json"
         var boundary = '7dESFQWDAQWEQEEAVSE'
         var data = DBRUtil.genSignature(4, url, 'sina',null,DBRUtil.encodeURIComponent(txt));
         var header = {
             "Content-type": "multipart/form-data, boundary="+boundary,
            }
         var d = data.split(',')
         var postData = {}
            for each (var kv in d){
            	postData[kv.split('=')[0]]=kv.split('=')[1] 
            }
		postData.pic = picFile
		postData['oauth_signature'] = postData['oauth_signature']+('=')
		postData['status'] = (txt)
		postData = DBRUtil.createStream(postData,boundary)
 		DBRUtil.sendXHR(url,header,function(t){
               if(fn)fn()
		}, null,'POST',postData)
      
	}
	
	DBRUtil.createStream = function createStream(postData, boundaryString){
    	var nsIMultiplexInputStream = Components.classes["@mozilla.org/io/multiplex-input-stream;1"].createInstance(Components.interfaces.nsIMultiplexInputStream)
    	for (var postItem in postData){
    		var nsIStringInputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream)
    		if(typeof(postData[postItem])=="string"){
    			nsIStringInputStream.setData("\r\n--" + boundaryString + "\r\nContent-Disposition: form-data; name=\"" + postItem + "\"\r\n\r\n" + postData[postItem], -1)
      			nsIMultiplexInputStream.appendStream(nsIStringInputStream)
    		}else{
    		    nsIStringInputStream.setData("\r\n--" + boundaryString + "\r\nContent-Disposition: form-data; name=\"" + postItem + "\"; filename=\"" + postData[postItem].leafName + "\"\r\n\r\n", -1)
    			nsIMultiplexInputStream.appendStream(nsIStringInputStream)
    			var nsIFileInputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream)
    			nsIFileInputStream.init(postData[postItem], 1, 1, Components.interfaces.nsIFileInputStream.CLOSE_ON_EOF)
    			var nsIBufferedInputStream = Components.classes["@mozilla.org/network/buffered-input-stream;1"].createInstance(Components.interfaces.nsIBufferedInputStream)
    			nsIBufferedInputStream.init(nsIFileInputStream, 4096)
    			nsIMultiplexInputStream.appendStream(nsIBufferedInputStream)
    		}
    	}
    	var nsIStringInputStream_end = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream)
    	nsIStringInputStream_end.setData("\r\n" + "--" + boundaryString + "--\r\n",-1)
    	nsIMultiplexInputStream.appendStream(nsIStringInputStream_end)
    	return nsIMultiplexInputStream 
  }
	
	DBRUtil.say2= function(site,txtArray,topic,file,fn){
	     if(txtArray.length == 1){
    	     DBRUtil['say2'+site](txtArray[0],fn,file)
	     }else{
    	     send();
	     }
	     function send(){
		    var len = txtArray.length
			var cnt = len;
		    say()
			function say(){
				if(txtArray.length == 0){
					return;
				}
				var t = "["+(cnt--)+"/"+len+"]" + topic + txtArray.pop()
				DBRUtil['say2'+site](t,function(){
					// 确保次序。（新浪有点奇怪，会乱掉）
					setTimeout(say,100)
				},file)
		   }
	    }
	}
	
    DBRUtil.openPage =  function openPage(val){
        gBrowser.selectedTab = gBrowser.addTab(val);
    }
     
     DBRUtil.forgetToken = function(site){
         DBRUtil.setPref('oauth_access_key_'+site,'')
         DBRUtil.setPref('oauth_access_secret_'+site,'' ) 
         DBRUtil.alert(DBRUtil.GSA('cleartoken'))
     }
     
     DBRUtil.encodeURIComponent = function(txt){
           var r = encodeURIComponent(txt);
           r = r.replace(/\!/g,'%'+'!'.charCodeAt(0).toString(16))
           r = r.replace(/\(/g,'%'+'('.charCodeAt(0).toString(16))
           r = r.replace(/\)/g,'%'+')'.charCodeAt(0).toString(16))
           r = r.replace(/\*/g,'%2A')
           r = r.replace(/\'/g,'%27')
           return r
     }
     
     DBRUtil.forgetToken4Douban = function(){
         DBRUtil.forgetToken('douban')
     }
     DBRUtil.forgetToken4Sina = function(){
         DBRUtil.forgetToken('sina')
     }
     DBRUtil.hasToken = function(site){
          return DBRUtil.getPref('oauth_access_key_'+site).length > 0 
     }

     DBRUtil.hasRequestToken = function(site){
          return DBRUtil['oauth_request_key_'+site] != undefined
     }
     DBRUtil.fileExists = function(aFile){
	 		if(aFile && aFile.exists()){
				return true
			}
			return false
	 }
	 
     DBRUtil.convertF2A = function convertF2A(file){
		var data = "";
		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
		              createInstance(Components.interfaces.nsIFileInputStream);
		var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
		              createInstance(Components.interfaces.nsIConverterInputStream);
		fstream.init(file, -1, 0, 0);
		cstream.init(fstream, "gbk", 0, 0);
		var read = 0,str={};
		do { 
			read = cstream.readString(0xffffffff, str);
			data += str.value;
		} while (read != 0);
		cstream.close(); 
		var rslt = data.split('\n')
		if(rslt.length < 3){
			rslt = data.replace(/\[/g,+"\n[")
		}
		return rslt;
	}
	
	DBRUtil.getFile = function(filepath){
	    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        return aFile.initWithPath(filepath);
	}
	
	DBRUtil.getFile2 = function(fileName){
        var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
        file.append("doubanradio")
        file.append(fileName)
        return file
     }

	
	DBRUtil.getLyricFile = function(fileName){
	    var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
    	file.append("doubanradio")
    	file.append("lrc")
		DBRUtil.createFolder(file)
    	file.append(fileName)
		return file
	}
	
	DBRUtil.createFolder = function(file){
		if( !file.exists()) { 
	   		file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
		}		
	}

	DBRUtil.downloadFile = function(u,f,fn,flg){
	      if(f.exists() && !flg){
	          fn(f,false)
	          return;
	      }
	      
	      var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	      var url = ios.newURI(u, null, null);
	      var channel = ios.newChannelFromURI(url);
          var observer = {
            onStreamComplete : function(aLoader, aContext, aStatus, aLength, aResult) {
        	  		var stream = Components.classes["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
                    stream.init(f, -1, -1, 0);
                    var bstream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
                    //TODO id3v1
                    bstream.setOutputStream(stream);    
                    bstream.writeByteArray(aResult, aLength);
                    if (stream instanceof Components.interfaces.nsISafeOutputStream) {
                       stream.finish();
                       fn(f)
                    }else {
                        stream.close();
                    }
                }
        }
        var sl = Components.classes["@mozilla.org/network/stream-loader;1"].createInstance(Components.interfaces.nsIStreamLoader);
         sl.init(observer);
         channel.asyncOpen(sl, channel);
	}
	
	DBRUtil.convertGB2312 = function (str){
		var _encode = DBRUtil.getPref('id3v1.encoding');
		DBRUtil.decoder.charset=_encode || "gb2312";
		return DBRUtil.decoder.ConvertFromUnicode(str)
	}

	DBRUtil.convertUTF8 = function (str){
		DBRUtil.decoder.charset=("UTF-8")
		return DBRUtil.decoder.ConvertFromUnicode(str)
	}
	
	DBRUtil.SongInfoWarpper = function (object){
		if(!object)return null
		if(object.sid) return DBRUtil.extend(DBRUtil.DoubanBean,DBRUtil.SongBean,object)
		if(object.id) return DBRUtil.extend(DBRUtil.RenrenBean,DBRUtil.SongBean,object)
		if(object.songId) return DBRUtil.extend(DBRUtil.SinaBean,DBRUtil.SongBean,object)
		return object
	}
		
	DBRUtil.HTMLParser = function (aHTMLString){
		  var html = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null),
		    body = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
		  html.documentElement.appendChild(body);
		  body.appendChild( Components.classes["@mozilla.org/feed-unescapehtml;1"].getService(Components.interfaces.nsIScriptableUnescapeHTML).parseFragment(aHTMLString, false, null, body));
		  return body;
	}
	
	DBRUtil.extend = function(c,sc,arg){
		c.prototype = sc.prototype
		var o = new c(arg)
		return o
	}
	
	// 单字节编码和双字节编码混合的字符串截取长度
	DBRUtil.substring = function(str,len){
		var indx =0,cnt=0;
		for(var size=0; indx <= str.length - 1; indx++){
			size = (str.charCodeAt(indx) > 256 )? 2 : 1;
			if(cnt+size <= len){
				cnt+=size;
			}else{
				indx--
				break;
			}
		}
		return str.substring(0,indx) || "";
	}
	
	// 
	DBRUtil.fillChars = function(str,len,c){
		str = DBRUtil.substring(str,len)
		str = DBRUtil.convertGB2312(str)
		len = (len - str.length)
		for(;len--;)void(str+=c);
		return str;
	}
	
	DBRUtil.writeFile = function(file,bytes){
		var ostream = Components.classes["@mozilla.org/network/file-output-stream;1"].
		              createInstance(Components.interfaces.nsIFileOutputStream);
		ostream.init(file, -1, -1, false);		
		var bstream = Components.classes["@mozilla.org/binaryoutputstream;1"].
		              createInstance(Components.interfaces.nsIBinaryOutputStream);
		bstream.setOutputStream(ostream);
		bstream.writeBytes(bytes,bytes.length);	
		bstream.close()
	}
	
	DBRUtil.writeFileByEncoding = function(file,content,encoding){
		var ostream = FileUtils.openSafeFileOutputStream(file)
		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = encoding||"GBK";
		var istream = converter.convertToInputStream(content);
		NetUtil.asyncCopy(istream, ostream);
	}

	DBRUtil.getFileByPath = function(path){
		try{
			var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
			aFile.initWithPath(path)
			return aFile
		}catch(e){
			DBRUtil.log2(e)
		}
	}
	DBRUtil.getFileBytes = function(file){
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].
		              createInstance(Components.interfaces.nsIFileInputStream);
		istream.init(file, -1, -1, false);		
		var bstream = Components.classes["@mozilla.org/binaryinputstream;1"].
		              createInstance(Components.interfaces.nsIBinaryInputStream);
		bstream.setInputStream(istream);
		
		var bytes = bstream.readBytes(bstream.available());
		return bytes
	}
	
	DBRUtil.setPatternString = function(p,obj){
	    for(var attr in obj){
             p = p.replace('{'+ attr + '}',obj[attr])	        
	    }
	    return p;
	}
	
	DBRUtil.alertsService = function (title,content,image,url){
        var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
		alertsService.showAlertNotification(image, title, content, true, "",  {
			observe: function(subject, topic, data){
				if (topic == 'alertclickcallback') 
					DBRUtil.openPage(url)
		}}, "");
	}
		
	DBRUtil.injectHTML = function(node,html){
	    while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        var injectHTML = Components.classes["@mozilla.org/feed-unescapehtml;1"].getService(Components.interfaces.nsIScriptableUnescapeHTML).parseFragment(html, false, null, node);
        node.appendChild(injectHTML);
	}
	
	DBRUtil.clearNode = function(node){
	    while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
	}
		   
	DBRUtil.getFilePicker = function (path){
	        var fp = Cc["@mozilla.org/filepicker;1"].getService(Components.interfaces.nsIFilePicker)
	        fp.init(window, 'Save Douban Music', fp.modeSave)
	        fp.defaultExtension = 'mp3';
	        fp.defaultString = path;
	        fp.appendFilter('MP3', '*.mp3');
	        var rv = fp.show()
	        if (rv == fp.returnOK || rv == fp.returnReplace) {
				return fp
			}			   	
	   }
	   
	DBRUtil.extendObserver = function(clazz){
	    clazz.prototype = {
    	      observe: function(aSubject, aTopic, aData){
			  	var httpChannel =  aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
                aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
    			var url = aSubject.URI.spec
                    var doc = this.getDoc(aSubject);
                    if (doc === this.getContent()) {
                        // 发出前
                        if (aTopic == "http-on-modify-request") {
//								var t = 'http://mr3.douban.com/201105280858/8ffacd90f7e5f6b491cc3470df8d2752/view/song/small/p1451969.mp3'
//								if(/mp3$/.test(httpChannel.originalURI.spec)){
//									alert(url)
//									DBRUtil.log2('替换MP3')
//									httpChannel.originalURI.spec = t;
//								}
                                DBRUtil.log2("browser modify : " + url);
                                this.errorProcessor(url) 
                        }            
                        // 返回后 	
                        if (aTopic == "http-on-examine-response") {
                                DBRUtil.log2("browser examine : " + url);
                                // 获取歌单
                               this.listProcessor(url,aSubject)
                                // 获取mp3	
                               this.musicProcessor(url)
                        }
                    }
               },
            getDoc: function(aChannel){
                try {
                    var notificationCallbacks = aChannel.notificationCallbacks ? aChannel.notificationCallbacks : aChannel.loadGroup.notificationCallbacks;
                    if (!notificationCallbacks) 
                        return null;
                    var domWin = notificationCallbacks.getInterface(Components.interfaces.nsIDOMWindow);
                    return domWin.top.document;
                } 
                catch (e) {
                    return null;
                }
            }
        }
        return clazz
	}   

}
DBRUtil.TracingListener = function(obj){
	this.invoker = obj;
}

DBRUtil.getAPostContent = function(url,fn){
	DBRUtil.sendXHR(url,null,function(txt){
		var body = DBRUtil.HTMLParser(txt)
	    var content = body.getElementsByTagName('pre')[0].innerHTML
	    content = JSON.parse(content)
//	    alert(content)
		if(fn)fn(content)
	})
}

DBRUtil.TracingListener.prototype = {
    originalListener: null,
    
    onDataAvailable: function(request, context, inputStream, offset, count){
        var binaryInputStream = DBRUtil.CCIN("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream");
        var storageStream = DBRUtil.CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
        var binaryOutputStream = DBRUtil.CCIN("@mozilla.org/binaryoutputstream;1", "nsIBinaryOutputStream");
        binaryInputStream.setInputStream(inputStream);
        var data = binaryInputStream.readBytes(count);
        data = this.invoker.crtRadioModule.dataProcessor(data, this.invoker.shamData,this.invoker.songs);
        var newcount = data.length;
        storageStream.init(8192, newcount, null);
        binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
        binaryOutputStream.writeBytes(data, newcount);
        
        this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), 0, newcount);
    },
    
    onStartRequest: function(request, context){
        this.originalListener.onStartRequest(request, context);
    },
    
    onStopRequest: function(request, context, statusCode){
        this.invoker.shamRequest(true);
        DBRUtil.log2("onStopRequest: done~~~~~~~~~~~~~~~~~~~~~~")
        this.originalListener.onStopRequest(request, context, statusCode);
    },
    
    QueryInterface: function(aIID){
        if (aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    }
}
	
DBRUtil.ID3Writer = function(file,info,ID3,convertFn){
	var bytes = DBRUtil.getFileBytes(file)
	var newBytes = new ID3(bytes,info,converFn).getBytes();
	DDBRUtil.writeFile(file,bytes)
}
