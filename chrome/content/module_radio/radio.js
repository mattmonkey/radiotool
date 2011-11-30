DBRUtil.RadioBase = function(){
    this.STATUS_PLAY = "play", 
    this.STATUS_STOP = "stop.png",
    this.STATUS_BUSY = "busy.png"
	this.STATUS_PAUSE = 'pause.png'
	this.mp3id = ""
	
	this.EVT_MUSIC_FOUND = 'music_found' 
	this.EVT_STATUS_CHANGE = 'status_change'
	this.EVT_CHANNEL_CHANGE ='channel_change';
	this.EVT_CHANNEL_CHANGE_BEFORE = 'chanel_change_before'
	this.EVT_CHANNEL_UPDATED='channel_updated'
	this.EVT_RADIO_STARTUP='radio_startup'
	this.EVT_RADIO_FINISH='radio_finish'
}

/*
 * 待办事项：
 * 比较：修改发出的MP3请求和修改歌单响应的优劣
 * 分层：电台核心操作和扩展操作
 * 
 * 下一首     预读+刷新+控制响应  || 预读+刷新+控制请求
 * 垃圾桶    预读+刷新+控制响应 || 预读+刷新+控制请求
 * 喜欢/不喜欢   预读+延缓刷新+控制响应 || 控制请求
 * 暂停
 * 播放歌手
 * 播放专辑
 * 播放红心 
 */
DBRUtil.Radio = function(moduleList,browser){
	// 常用工具方法缩写
	var getPref = DBRUtil.getPref;
    var setPref = DBRUtil.setPref;
    var bss = DBRUtil.bss;
	
	// 继承基类
	DBRUtil.RadioBase.apply(this,null)

    // 内部变量
    var crtSTATUS = this.STATUS_STOP, // 电台状态
		adjustableFlg = false, // 调整歌单刷新标志
		drb_b, // 电台容器
		shamData = "", // 预申请歌单数据
		handler = {}, // 事件容器
		radioModuleList, // 电台模块
		crtRadioModule, // 当前电台模块
		crtCID,crtRID, //频道和电台ID
		mp3url = '', // 播放链接
		songs = {},// 曲目信息缓存
		mySongList = [],// 歌单缓存 
		radioObserver, // 观察播放器
		self = this; // 自身引用

	initRadio();
	
	// 初始电台参数
	function initRadio(){
		drb_b = browser
		radioModuleList = moduleList  		
		crtRID = getPref('currentrid',"0")
		crtCID = getPref('currentcid',"1") 
		// 修复以前版本可能引起的错误
		crtCID  = /\d{1,}/.test(crtCID)?crtCID:"1" 
		crtRID  = /\d{1,}/.test(crtRID)?crtRID:"0" 
		crtRadioModule = radioModuleList[crtRID] 
	}
	
	// 事件参数
	function genEventObject(){
		var rslt = {};
		rslt.songInfo = DBRUtil.SongInfoWarpper(crtRadioModule.getSongInfo());
		rslt.status = crtSTATUS;
		rslt.rid = crtRID;
		rslt.cid = crtCID;
		rslt.albumUrl = crtRadioModule.getAlbumUrl();
		return rslt
	}

	// 电台事件分发
	function eventDispatch(name){
		if(handler[name]){
			handler[name](genEventObject());
		}
	}

	// 设置并且记录电台和频道
	function setCrtCID(cid,rid,flg){
		// 一样的频道不做处理
		if(cid==crtCID && rid == crtRID){
			//return;
		} 
		// check 私人你电台
		if (cid == '0' && rid == '0'  && !flg) {
             checkLogin(function(){setCrtCID(cid,rid,true)},null,null,rid)
             return;
        }
		// 触发事件
		eventDispatch(self.EVT_CHANNEL_CHANGE_BEFORE)
		DBRUtil.log2("cid " + cid +" | rid " +rid)
		crtCID = cid, crtRID = rid
        setPref('currentcid', cid),setPref('currentrid',rid)
		// 更换电台模块
		crtRadioModule = radioModuleList[rid]
		// 清除播放历史
		isCanExecute2(crtRadioModule.clearPlaylistHistory)
		// 清除红心歌单
		isCanExecute2(crtRadioModule.overMyList,null,[true])		
		// 触发事件
		eventDispatch(self.EVT_CHANNEL_CHANGE);
		openOrNext()
    }
	
	function setStatus(status){
		crtSTATUS = status
		eventDispatch(self.EVT_STATUS_CHANGE);
	}

	// 刷新播放器
    function reloadMPlayer(){
		// 复位一些数据
		adjustableFlg = false
		setStatus(self.STATUS_BUSY)
		drb_b.loadURI(crtRadioModule.getRadioUrl(crtCID));
    }
	
	// 重播当前歌曲
    function playAgain(){
		if(crtRadioModule.getRadioName()=='新浪电台'){
			DBRUtil.alert(DBRUtil.GSA('nosupport'))
		}else{
			isCanExecute2(crtRadioModule.overMyList,null,[true])
			shamRequest(null, true)
		}
    }
	
	// 电台模块有这个方法就执行
	function isCanExecute2(fn,ref,arg){
		if (fn) {
			return fn.apply(ref?ref:null,arg)
		}else{
			return arg
		}
	}
	
	// 打开电台/下一首歌		
    function openOrNext(){
        addObserver();
        setStatus(self.STATUS_BUSY)
		shamRequest()
    }
	
	function openOrNext2(){
		// 豆瓣电台skip一首歌曲，预先请求数据
		if (crtRID == 0 &&  crtSTATUS == self.STATUS_PLAY) {
			setStatus(self.STATUS_BUSY)
			isCanExecute2(crtRadioModule.nextMyList, null, [true])
			var url = crtRadioModule.getSkipURL(crtCID)
			DBRUtil.log2("openOrNext2 " + url)
			DBRUtil.sendXHR(url, null, function(txt){
				shamDataProcessor(txt, true)
				reloadMPlayer();
			})
		}
		else {
			openOrNext()
		}
	}
	
    // 关闭电台
    function stop(){
        drb_b.loadURI("about:blank");
        setStatus(self.STATUS_STOP)
        removeObserver();
    }
	
    // 如果豆瓣登录则执行相关操作
    function checkLogin(fn, flag,arg,rid){
        if (crtRadioModule.logged) {
            fn(arg);
        }else {
            var fnc = fn;
			// 确保check时不会串台
			tmpRadioModule = rid==null?crtRadioModule:radioModuleList[rid]
			DBRUtil.sendXHR(tmpRadioModule.getCheckURL(), null, function(txt){
				if(tmpRadioModule.checkLogin(txt,flag, function(){ return setCrtCID}())){
                    fnc(arg);
                    tmpRadioModule.logged = true;
				}
            })
        }
    }
    
	// 预请求
    function shamRequest(flg, againflg){
		if (crtCID == undefined) {
			setCrtCID(getPref('currentcid', 1),getPref('currentrid', 0))
		}else {
			var playlist = crtRadioModule.getPlayListUrl(crtCID)
			DBRUtil.log2("shamRequest playlist "+ playlist)
			DBRUtil.sendXHR(playlist, null, function(t){
				shamDataProcessor(t, flg, againflg)
			})
		}
    }
	
	// 处理假数据
	function shamDataProcessor(t,flg,againflg){
		    try {
				// 填充定制歌单
				t = songListFiller(t)
				//过滤广告
			    t = adFilter(t)
				// 过滤歌手
				t = artistFilter(t)
				// 缓存替换用的数据到songs
				crtRadioModule.shamDataProcessor(t, songs);
				// 重放歌曲
				if (againflg) {
					t = crtRadioModule.shamReplayDataProcessor(t);
				}
				// 数据转换到播放器认识的格式
				t = crtRadioModule.rstr2(t);
				crtRadioModule.clearTmpData()
			}catch(e){
				openOrNext()
				throw "error"
			}
            shamData = t;
            if (flg) return;
            reloadMPlayer();
            // 重播时的歌曲信息提示
            if (againflg) {
                setStatus(self.STATUS_PLAY)
                eventDispatch(self.EVT_MUSIC_FOUND);
            }
	}
    
    // 过滤广告
    function adFilter(t){
		if (!getPref('filter')) return t;
		if (crtRadioModule.getRadioName()!= "豆瓣电台") return t
		try {
            var tmp = JSON.parse(t)
			tmp.song = tmp.song.filter(crtRadioModule.isAD)
            return JSON.stringify(tmp)
        } 
        catch (e) {
            DBRUtil.log2("adFilter error " + e);
            openOrNext();
            throw e
        }
    }

	// 过滤歌手
    function artistFilter(t){
	    if (!getPref('artistfliter')) return t;
		if (crtRadioModule.getRadioName()!=='豆瓣电台') return t
        try {
            var tmp = JSON.parse(t)
			var list = getPref('artistfilterlist',"").split(',')
			// 过滤指定歌手处理
			tmp.song = tmp.song.filter(function(element){
				if(!element) return false
				var elm = DBRUtil.SongInfoWarpper(element)
				// 返回false，过滤元素
         		return list.indexOf(elm.getArtist()) == -1;
			})
			// 歌手频道处理
			if(crtRadioModule.artistFilter){
				tmp.song = tmp.song.filter(crtRadioModule.artistFilter)					
			}
			return JSON.stringify(tmp)
        } 
        catch (e) {
            DBRUtil.log2("artist Filter error " + e);
            openOrNext();
            throw e
        }
    }
    
    // 填充自定义歌曲
    function songListFiller(t){
        if (mySongList.length == 0){
            return t;
		}else{
			var rslt = crtRadioModule.genSongList(mySongList)
            mySongList = "";
            return rslt
		}
    }
			
    function addObserver(){
		if(crtSTATUS == self.STATUS_STOP){
			var fn = DBRUtil.extendObserver(RadioObserver)
			radioObserver = new fn();
			bss.addObserver(radioObserver, "http-on-examine-response", false);
            bss.addObserver(radioObserver, "http-on-modify-request", false);
            eventDispatch(self.EVT_RADIO_STARTUP)			        
        }
    }
    
    function removeObserver(){
		isCanExecute2(crtRadioModule.overMyList,null,[true])
		isCanExecute2(crtRadioModule.clearModeData)
		isCanExecute2(crtRadioModule.clear,null)
	    bss.removeObserver(radioObserver, "http-on-modify-request");
        bss.removeObserver(radioObserver, "http-on-examine-response");
        this.mp3id = "";
		eventDispatch(self.EVT_RADIO_FINISH)
    }

	function RadioObserver(){
		this.getContent =function(){
			return drb_b.contentDocument;
		}  
		
		this.listProcessor = function(url,aSubject){
			if (crtRadioModule.isList(url)) {
				// 播放器接收到歌单响应处时，处理相应的替换处理
				var invoker = function(){
					return new function(){
						this.shamData = shamData;
						this.openOrNext = openOrNext;
						this.shamRequest = shamRequest;
						this.songs = songs;
						this.crtRadioModule =crtRadioModule 
					}
				}
				var newListener = new DBRUtil.TracingListener(invoker());
				aSubject.QueryInterface(Components.interfaces.nsITraceableChannel);
				newListener.originalListener = aSubject.setNewListener(newListener);
			}
		}
		
		this.errorProcessor = function(url){
			// 一些特殊处理判断mp3播放完毕等
			var status = -1
			status = isCanExecute2(crtRadioModule.isNeedReload,null, [crtRID, adjustableFlg, url]);
			if (status == 1) {
				DBRUtil.log2("errorProcessor status : 1")
				// 不请求假数据
				reloadMPlayer();
				throw ""
			}else if(status ==2){
				DBRUtil.log2("errorProcessor status : 2")
				openOrNext()
				throw ""
			}	
			// 异常情况，主动刷新播放器
			if(crtRadioModule.isError(url)) openOrNext();                    
		}
		
		this.musicProcessor = function(url){
			// 发现mp3的处理
			if (crtRadioModule.isMusic(url)) {
				mp3url = url;
				try {
					this.mp3id = crtRadioModule.getMusicId(url, songs)
				}catch(e){
					DBRUtil.log2(e)
					openOrNext()
					throw e
				}
				setStatus(self.STATUS_PLAY)
				eventDispatch(self.EVT_MUSIC_FOUND);
			}
		}	
	}

  	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	//   公共方法
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	
	this.open = openOrNext2;
    
	this.playAgain = playAgain
	
	this.getRID = function(){
		return crtRID
	}
	
	this.getCID = function(){
		return crtCID
	}
	
	this.stop = stop
	
	this.isOpen = function (){
		return crtSTATUS != undefined  && crtSTATUS != self.STATUS_STOP 
	}
		
	// 电台状态
	this.getStatus = function(){
		return crtSTATUS;
	}
	
	// 电台名称
	this.getRadioName = function(){
		return crtRadioModule.getRadioName();
	}
	
	// 频道名称
	this.getChannelName = function(){
		return crtRadioModule.getChannelName(crtCID)
	}
	
	this.getTooltipHtml = function(){
		return crtRadioModule.getTooltipHtml(crtCID)
	}
	
	this.setBrowser = function(browser){
		drb_b = browser
	}
	
	this.getRadioICO = function(){
		return crtRadioModule.ico
	}
	
	this.getSongInfo = function(){
		return DBRUtil.SongInfoWarpper(crtRadioModule.getSongInfo())
	}
	
	// 设置频道
	this.setRadioChannel = function(cid,rid){
		isCanExecute2(crtRadioModule.clearModeData)
		setCrtCID(cid,rid)
	}
	
    // 专辑频道
	this.setAAChannel = function(args){
		isCanExecute2(crtRadioModule.setModeData,null,[args])
		setCrtCID("0","0")
	}
	
	this.isLoved = function(){
		return crtRadioModule.isLoved()
	}
	
	this.getAlbumUrl = function(){
		return crtRadioModule.getAlbumUrl();
	}
	
	this.getLoveURL = function(){
		return crtRadioModule.getLoveURL(crtCID)
	}
	
	this.getUnLoveURL = function(){
		return crtRadioModule.getUnLoveURL(crtCID)
	}
	
	this.getTrashURL = function (){
		return crtRadioModule.getTrashURL(crtCID);
	}
	
	this.love = function(flg){
		crtRadioModule.love(flg)
	}
	
	this.getPlayListUrl = function(cid,flg){
		return crtRadioModule.getPlayListUrl(cid!=null?cid:crtCID,flg)
	}	
	
	this.adjustableLove = function(txt){
			//isCanExecute2(crtRadioModule.nextMyList)
			adjustableFlg = true
			shamDataProcessor(txt,true)
	}
	
    // 获取反馈歌单 
	this.adjustableHate = function(txt){
		isCanExecute2(crtRadioModule.nextMyList,null,[true])
		shamDataProcessor(txt,true)
		reloadMPlayer();
	}
	
	this.getCountURL = function(){
		return crtRadioModule.getCountURL();
	}
		
	//TODO 暂时只支持douban
	this.getCrtArtist = function(){
		var songInfo = crtRadioModule.getSongInfo();
		return songInfo.artist.split('/')[0].trim()
	}
	
	//TODO 暂时只支持douban
	this.getCrtAlbum = function(){
		var songInfo = crtRadioModule.getSongInfo();
		return songInfo.albumtitle
	}
	
	this.customizeChannel = function(data){
		isCanExecute2(crtRadioModule.clearModeData)
		isCanExecute2(crtRadioModule.overMyList,null,[true])
		mySongList = data
		openOrNext();
	}
	
	// 定制红心歌单
	this.customizeRedList = function(data){
		isCanExecute2(crtRadioModule.clearModeData)
		crtRadioModule.setMyList(data)
		reloadMPlayer()
	}
	
	this.checkLogin = function(fn){
		checkLogin(fn)
	}
	
	this.getMusicFileName = function(){
		return crtRadioModule.getMusicFileName()
	}
	
	this.getLyricParam = function(){
		return crtRadioModule.getLyricParam2()
	}
	
	this.getMp3Url = function (){
		return mp3url;
	}
	
	this.getAlbumPic = function(fn){
		crtRadioModule.getAlbumPic(fn)
	}
	
	this.getPatternString = function(){
		return crtRadioModule.setPatternString(getPref('lovestring'),crtCID)
	}
	
	this.updateChannel = function(){
		if(getPref('autoupdatechannel')){
			for each(var radio in radioModuleList)
				isCanExecute2(radio.checkChannelUpdate,self,[function(){
					eventDispatch(self.EVT_CHANNEL_UPDATED)
				}])
		}		
	}
	
	this.getSongName = function(){
		return crtRadioModule.getSongName();
	}
	
	this.getShareLink = function (){
		return crtRadioModule.getShareLink(crtCID)
	}
	
	this.addListener = function(name,fn){
		handler[name] = fn
	}
	
	this.favChannel = function(name,data){
		crtRadioModule.setFavChannel(name,data);
		reloadMPlayer()
	}
}
