// 解析lrc文件的类
DBRUtil.LrcParser = function(data){
    this.reset()
	if (data) this.setData(data)
}

// 重置解析歌词数据
DBRUtil.LrcParser.prototype.reset = function(){
    this.bt = new Date().getTime();
	this.stamp = 0
    this.tl = []
}

// 获取解析歌词
DBRUtil.LrcParser.prototype.getData = function(){
   return  this.tl
}

// 解析歌词: 把一行里的时间戳全部匹配出来，分别加上歌词的部分加入数组后排序
DBRUtil.LrcParser.prototype.setData = function(content){
    var flg
    var tmpArray = [];

    for(var cnt in content){
        var stamps = content[cnt] && content[cnt].match(/\[\d{2}\:\d{2}\.\d{2}\]/g)
        if(stamps && stamps.length >0){
          var lyric = content[cnt].replace(/\[\d{2}\:\d{2}\.\d{2}\]/g,"").replace(/\&nbsp\;/g," ")
          for(var cnt2 in stamps){
              var t1 = stamps[cnt2];
              var t2 = convert2i(t1)
              // if(lyric.trim()=='') continue
              // 数据格式 ： [[长度],[歌词],[分秒]
              tmpArray.push([t2,lyric,t1])
          }  
        }
    }
	
	tmpArray.sort(function(a,b){
	    return a[0]-b[0]
	})

	this.tl = tmpArray
	
	// 时间格式转换成时间长度
    function convert2i(val){
    	var s = val.toString().match(/\d{1,}/g)
    	var i = parseInt(s[0])*1000*60 + parseInt(s[1])*1000 + parseInt(s[2]) *10
    	return i ;
    }
}

// 直接设置已解析的歌词
DBRUtil.LrcParser.prototype.setData2 = function(content){
    	this.tl = content
    	this.stamp = 0
}

// 获取当前的歌词
DBRUtil.LrcParser.prototype.getString = function(offset,sp) {
	var  time = this.getCurrentTime();
	for(var cnt=this.stamp;cnt < this.tl.length;cnt++){
	    // 找到下一条歌词
	    if( time < parseInt(this.tl[cnt][0])){
		    cnt = cnt > 0 ? cnt -1 : 0 
		    this.stamp = cnt
		    break;
		}
	}
	
	// 循环区间[cnt-offset ,cnt + offset]
	var lyric ='',offset = offset ? offset : 0 
	sp =  offset == 0 ? "" : (sp ? sp : " / ") 
	for(var cnt2 = cnt - offset;cnt2 <= cnt + offset;cnt2 ++){
        if(this.tl[cnt2] && this.tl[cnt2][1]) lyric += this.tl[cnt2][1] + sp   
	}
	return lyric
}

// 返回歌曲已播放时间
DBRUtil.LrcParser.prototype.getCurrentTime = function() {
    var t = new Date().getTime();
	return  t -this.bt;
}

// 延迟控制
DBRUtil.LrcParser.prototype.delay = function(num) {
	DBRUtil.log2("delay after: " + this.bt)
    this.bt = this.bt + parseInt(num);
	DBRUtil.log2("delay after: " + this.bt)
}

//  处理UI同步的类
DBRUtil.RadioSyncLyric = function (lp){
		var aTimer = null;
		var that = this;
		var lyricParser =  lp;
		var self = this;
		function genSearchContent(songInfo){
		    var title =songInfo.getTitle().replace(/\(.*\)/,'')
		    var artist = songInfo.getArtist().replace(/\(.*\)/,'').split('/')[0].trim()
		    var album = songInfo.getAlbum().replace(/\(.*\)/,'')
		    var content = title + " " + artist
		    DBRUtil.log2("lyric searching string "+ content)
		    return content
		}
		
		 function genLyricFileName(songInfo){
		 	var title =songInfo.getTitle().replace(/\(.*\)/,'')
		    var artist = songInfo.getArtist().replace(/\(.*\)/,'').split('/')[0].trim()
		    return DBRUtil.fileNameProcessor(artist + "-" + title+".lrc")
		}
		
		this.setLyric = function(songInfo){
			var lyricData = getLyricFormLocal(songInfo)
			if(lyricData == null || lyricData.length==0){
				var content = genSearchContent(songInfo)
				DBRUtil.crtLyricEngine.searchLyric(content,false,function(data){				    
				    lyricParser.setData(data)
					self.saveLyricFile(songInfo,data)
				})	
			}else{
				lyricParser.setData(lyricData)
			}			
		}
	
		this.saveLyricFile = function(songInfo,data){
			var flg =  DBRUtil.getPref('locallyric');
			if(!flg)return;
			var file = getLocalLyricFile(songInfo)
			DBRUtil.writeFileByEncoding(file,data.join('\n'))
		}
		
		function getLyricFormLocal(songInfo){
			var flg =  DBRUtil.getPref('locallyric');
			if (flg) {
				var aFile = getLocalLyricFile(songInfo)
				if (DBRUtil.fileExists(aFile)) {
					DBRUtil.log2('lyric file exists')
					return DBRUtil.convertF2A(aFile)
				}
			}
			return []
		}
		
		 function getLocalLyricFile (songInfo){
			var fileName = genLyricFileName(songInfo) 
			return DBRUtil.getLyricFile(fileName);
		}
		
		this.start = function(fn,arg){
		    aTimer = new DBRUtil.Timer(fn)
		    aTimer.start();		
		}
		
		this.finish = function() {
			aTimer.stop()
			lyricParser.reset()
			bss.removeObserver(that,"douban_radio_mp3_fire");
		};
				
}

DBRUtil.Timer = function(fn,itv){
	
	this.stop = function() {
		clearInterval(this.tid)
	}
	
	this.start = function() {
		this.tid  = setInterval(fn,500)		
	}
}   

DBRUtil.RadioLyricImpl = function(label){
	var l = label
	var osd = DBRUtil.initOSD()
	var lp = new DBRUtil.LrcParser()
    var rsl = new DBRUtil.RadioSyncLyric(lp);
	var bss = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
    
	this.startup = function(){
		var tmplyric = "";
        rsl.start(function(){
            var t = lp.getString();
            if (tmplyric != t) {
                tmplyric = t;
                showLyric(tmplyric)
				bss.notifyObservers(null, DBRUtil.NOTIFY_LYRIC, tmplyric)	
//				DBRUtil.log2("douban_radio_mp3_lyric:"+tmplyric)
            }
        }, null);
		
	}
	
	this.delay = function(sec){
		 lp.delay(sec)
		 var lyric = lp.getString();
		 bss.notifyObservers(null, DBRUtil.NOTIFY_LYRIC, lyric)
		 DBRUtil.log2("delay string :" + lyric)
	}
	
	// 结束显示歌词
	this.finish = function(){
		setLyricLabelStatus(true)
		rsl.finish()
	}
	
	this.setLabel = function(label){
		l = label;	
	}
	
	
	// 切换歌词输出方式
	this.switchOutWay= function(flg){
		flg ? this.startup() : this.finish()
	}
	
	this.setLyric = function(data){
		DBRUtil.log2("setLyric " + data.getTitle())
		lp.reset();
		rsl.setLyric(data)	
	}
	
	this.setData = function(val){
		lp.setData2(val)
	}
	
	this.saveLyricFile = function(songInfo,data){
		rsl.saveLyricFile(songInfo,data)
	}
	
	this.getCurrentTime = function(){
	    return lp.getCurrentTime();
	}
	
	this.getLyric = function(offset){
	    return lp.getString(offset)
	}
	
   function setLyricLabelStatus(flg){        
       if(l) l.setAttribute('collapsed', flg)
    }
	
	// 显示歌词
    function showLyric(tmplyric){	
        if(DBRUtil.getPref('synclyric')){
			DBRUtil.getPref('thirdpartytool')? ubuntuDrawString(tmplyric) :drawString(tmplyric) 			
		} 
    }
    
	// 地址栏显示歌词
	function drawString(tmplyric){
		var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        var win = wm.getMostRecentWindow("DBR:LYRIC");
        
		//if(DBRUtil.getPref('addressbar')){
		if(!win){
			setLyricLabelStatus(false)
			if (l) {
				l.setAttribute('value', tmplyric.slice(0, 50))
				l.setAttribute('tooltiptext', "双击分享歌词")
			}
		}else{
			setLyricLabelStatus(true)			
		}
	}

	// OSD显示歌词
    function ubuntuDrawString(value){
        setLyricLabelStatus(true)		
		if (osd != null) {
			value = DBRUtil.setPatternString(DBRUtil.getPref('osdpattern'),{
				color:DBRUtil.getPref('color'),lyric:DBRUtil.rstr2(value)
			})
			osd.run(false, ['-f',value], 2)
        }
     }
}
