if(!douban_radio){
	var douban_radio = {}
}
(function(){
	var $ = DBRUtil.$,
		getPref = DBRUtil.getPref,
		setPref = DBRUtil.setPref,
		bss = DBRUtil.bss,
		ce = DBRUtil.ce,
		ICO_LOVE = 'like.png',
    	ICO_UNLOVE = 'like2.png',
    	ICO_TRASH = 'trash.png',
		ICO_ALBUM = 'album.png',
		ICO_ARTIST = 'artist.png',
		ICO_CHAT='chat.png',
		ICO_HOME='home.png',
		tfc = 0,
		tf = 0,
		channelRepository={},
		xmChannels,
		downloadList = {}
	
	DBRUtil.loadLyricScript()
	//TODO 修改
	var drb_i, drb_l, drb_l2, drb_ar,drb_al,drb_t,drb_c,drb_h;
 
 	var recentChannel = JSON.parse(getPref('recentchannel'))
		
	var radio,radioModuleList,rl,ck = ""			

    window.addEventListener("load", init, false);

    function init(){
		initRadio();
		initGlobalVar();
		initUI();
		setTimeout(getCK,3000);
		setTimeout(initMyChannel,4000)
	}
	
	function initMyChannel(){
		channelRepository['red'] = []
		var tmpData = JSON.parse(getPref('mylist',"{}"));
		for each(var song in tmpData){
			channelRepository['red'].push(song)
		}
		
		DBRUtil.getAPostContent(DBRUtil.PAGE_MXLIST,function(channels){
			if(!channels)return;
			xmChannels = channels
			initXMChannel()
		})
	}
	
	function initXMChannel(){
		var eid = 'drb_menupopup_channel2'
			// 清除节点
			DBRUtil.clearNode($(eid)) 
			// 添加频道清单
			for (var name in xmChannels){
				// 频道
				ce('menuitem', 'drb_menupopup_channel2', {label: name,mcid:xmChannels[name]},{command: setFavChannel},null,true)
				if(channelRepository[xmChannels[name]] && channelRepository[xmChannels[name]].length > 0) return;
				(function(id){
					DBRUtil.getAPostContent(DBRUtil.PAGE_REPOSITORY + id,function(songs){
						channelRepository[id] = songs
					})
				})(xmChannels[name])
			};			
	}
	
	function initRadio(){
		// 
		var browser = ce('browser', $('main-window'), {id:'dbr_browser',type: 'content'})
		ce('browser', $('main-window'), {id:'dbr_chatroom',type: 'content'})   
		radioModuleList = [new DBRUtil.DoubanMoudle(), new DBRUtil.RenRenMoudle(), new DBRUtil.SinaMoudle()] 
		rl = new DBRUtil.RadioLyricImpl()
		radio = new DBRUtil.Radio(radioModuleList,browser);
		
		// 电台启动
		radio.addListener(radio.EVT_RADIO_STARTUP,function(evt){
			rl.startup();	
		})		
		
		// 电台关闭
		radio.addListener(radio.EVT_RADIO_FINISH,function(evt){
			rl.finish()	
		})		
		
		// 播放状态改变时，界面的处理
		radio.addListener(radio.EVT_STATUS_CHANGE,function(evt){
			setStatusIcon(evt.status)	
		})
		
		// 发现新音乐时，界面的处理
		radio.addListener(radio.EVT_MUSIC_FOUND,function(evt){
			rl.setLyric(evt.songInfo)
			popup(evt.songInfo,evt.albumUrl)
		})		
		
		// 改变频道之后，界面的处理
		radio.addListener(radio.EVT_CHANNEL_CHANGE,function(evt){
			//pushRecentChannel(evt)
		})

		// 改变频道之后，界面的处理
		radio.addListener(radio.EVT_CHANNEL_CHANGE_BEFORE,function(evt){
			var oldCID = evt.cid
			if($("cid" + oldCID)) $("cid" + oldCID).setAttribute('checked', false);
			joinChatRoom()
		})		
		
		// 改变频道之后，界面的处理
		radio.addListener(radio.EVT_CHANNEL_UPDATED,function(evt){
			try{
				initChannelMenu('drb_menupopup_channel')
			}catch(e){alert(e)}
		})
		
		// 歌词引擎
		setLyricEngine()
		
		// 更新频道
		setTimeout(radio.updateChannel,3000)
	}
	
	function setLyricEngine(){
		if(getPref('lyricengine')=='yahoo'){
			DBRUtil.crtLyricEngine = new DBRUtil.LyricEngineByYahoo();			
		}else{
			DBRUtil.crtLyricEngine = new DBRUtil.LyricEngineByYoudao();			
		}
	}
	
	function notify(msg){
		var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        var win = wm.getMostRecentWindow("DBR:LYRIC");
        if (!win) {
			DBRUtil.alert(msg)
		}
		bss.notifyObservers(null, DBRUtil.NOTIFY_MSG, msg)
	}
	
	// 统计在线人数
	function joinChatRoom(){
		$('dbr_chatroom').loadURI(DBRUtil.PAGE_CHATROOM)
	}
	
	function outChatRoom(){
		$('dbr_chatroom').loadURI("about:blank")
	}
	
	function openRadio(){
		if(radio.getStatus() == radio.STATUS_STOP){
			joinChatRoom()
		}
		radio.open()
	}
	
	function closeRadio(){
		outChatRoom()
		radio.stop()
	}

	function initGlobalVar(){
		douban_radio.shareMusic = isCanExecute(openShareUIByHk)
		douban_radio.popupMenu = popupMenu
		douban_radio.showInfo = isCanExecute(popup)		
		douban_radio.open = openRadio
		douban_radio.findLyric = isCanExecute(findSyncLyric)
		douban_radio.close = closeRadio;
		douban_radio.download = isCanExecute(saveFile);	
		douban_radio.radio = radio;	
		douban_radio.openSongListEditor2 = openSongListEditor2
		douban_radio.getArtistList = getArtistModeId
		douban_radio.getAlbumList =getAlbumModeId
		douban_radio.love = isCanExecute(loveIt)
		douban_radio.love2 = isCanExecute(loveIt2)
		douban_radio.hate = isCanExecute(hateIt)
		douban_radio.delay = rl.delay
		douban_radio.replay = isCanExecute(radio.playAgain)
		douban_radio.viewSongInfo = viewSongInfo
		douban_radio.playSong=radio.customizeRedList
		douban_radio.suspend = radio.suspend
		douban_radio.favChannel = radio.favChannel

		douban_radio.donwloadAlbum = saveAlbum
		//
		douban_radio.changeChannel=changeChannel
	}
	
	function getCK(){
		DBRUtil.sendXHR(DBRUtil.PAGE_CHATROOM,null,function(txt){
			var content = txt.match(/ck\=.{4}/)
			if(content){
				ck = content[0].slice(3)
			}
		})
	}
	
	function initToolKit(){
		var flg = getPref('showinurlbar'),
		nodeID=flg? DBRUtil.UID_URLBAR:DBRUtil.UID_STATUSBAR,
		nodeID2=flg? DBRUtil.UID_URLBAR:DBRUtil.UID_STATUSBAR2,
		statusIco = radio.getStatus()!= radio.STATUS_PLAY?radio.getStatus():radio.getRadioICO()
	// 清除界面
		if($('dbr_container')){
			$('dbr_container').parentNode.removeChild($('dbr_container'));
		}
		if($('dbr_lbl_lyric')){
			$('dbr_lbl_lyric').parentNode.removeChild($('dbr_lbl_lyric'));
		}

		$(DBRUtil.UID_STATUSBAR).hidden = flg
		
		//  添加操作界面						
		var box = ce('hbox', $(nodeID), {id:'dbr_container'}, {mouseover: showRadioKit, mouseout:hideRadioKit},true)
		drb_h = ce('image', box, {src: ICO_HOME,collapsed: true,tooltiptext: "个人音乐主页",class:'kit_style'}, {click: openMusicPage})
		drb_c = ce('image', box, {src: ICO_CHAT,collapsed: true,tooltiptext: "广场",class:'kit_style'}, {click: openChatRoom})
		drb_ar = ce('image', box, {src: ICO_ARTIST,collapsed: true,tooltiptext: "歌手信息",class:'kit_style'}, {click: openArtistPage})
		drb_al = ce('image', box, {src: ICO_ALBUM,collapsed: true,tooltiptext: "专辑信息" ,class:'kit_style'}, {click: openAlbumPage})
        drb_t = ce('image', box, {src: ICO_TRASH,collapsed: true,tooltiptext: "讨厌" ,class:'kit_style'}, {click: hateIt})
		drb_l = ce('image', box, {src: ICO_LOVE,collapsed: true,tooltiptext: "不喜欢" ,class:'kit_style'}, {click: loveIt})
        drb_l2 = ce('image', box, {src:ICO_UNLOVE,collapsed: true,tooltiptext: "喜欢" ,class:'kit_style'}, {click: loveIt})
        drb_i = ce('image', box, {id:'dbr_img_radio',src: statusIco,tooltip: "dbr_ttp_song",contextmenu: "radio_popup",class:'radio_style'}, {click: function(e){e.button == 0 ? douban_radio.open() : ""},mouseover: viewSongInfo})
		
		ce('label', nodeID2, {id: 'dbr_lbl_lyric',collapsed: 'true',contextmenu: "lyricolor",'style': 'color:' + getPref('color')}, {dblclick:openShareUIByLyric}, true)
		
		$('drb_cp_lyric').addEventListener('click', function(e){
            $('dbr_lbl_lyric').setAttribute('style', 'color:' + e.target.color);
            setPref('color', e.target.color)
        }, false) 	
		
		rl.setLabel($('dbr_lbl_lyric'));
	}
	
	function initChannelMenu(eid){
		// 清除节点
		DBRUtil.clearNode($(eid)) 
		// 添加频道清单
		for (var cnt in radioModuleList){
			//  电台
			ce('menu',eid ,{id:'drb_menu_channel_'+cnt,label:radioModuleList[cnt].getRadioName()},null,null,true)	
			ce('menupopup', 'drb_menu_channel_'+cnt, {id:'drb_menupopup_channel_'+cnt}, {
			    popupshowing: function(e){
			        $("cid" + radio.getCID()).setAttribute('checked', true);
			    }},null,true)
			var channelInfo = radioModuleList[cnt].getChannelInfo(true) 	
	        for (var v in channelInfo) {
	            // 频道
				ce('menuitem', 'drb_menupopup_channel_'+cnt, {
	                label: channelInfo[v],
	                id: "cid" + v.slice(1),
	                cid: v.slice(1),
					rid:cnt,
	                type: 'radio'
	            },null,null,true)
	        }
		}
		
	}
	
	function setFavChannel(e){
		var name = e.target.getAttribute('label')
		var data = channelRepository[e.target.getAttribute('mcid')]
		radio.favChannel(name,data)
	}
	
	function initMenu(){
		// 菜单根
        var ps = ce('popupset', 'main-window');
        var p = ce('menupopup', ps, {id: 'radio_popup'}, {popupshowing: menuProcessor,command:menuClickProcessor})
		ce('menuitem', p, {id: 'dbr_mi_open', key:'dbr_key_open'}, {command: douban_radio.open})
        ce('menuitem', p, {id: 'dbr_mi_replay'}, {command: douban_radio.replay})
        // 频道
		ce('menu', p, {id:'dbr_m_channel'}, {command: douban_radio.changeChannel})
		ce('menupopup', 'dbr_m_channel', {id:'drb_menupopup_channel'})
		initChannelMenu('drb_menupopup_channel')
		ce('menu', p, {id:'dbr_m_channel2'}, {command: douban_radio.changeChannel})
		ce('menupopup', 'dbr_m_channel2', {id:'drb_menupopup_channel2'})

		
        ce('menuitem', p, {id: 'dbr_mi_favc',mcid:'red'}, {command: setFavChannel})
		ce('menu', p, {id:'dbr_m_share'});
		var mp_share = ce('menupopup', 'dbr_m_share');
        ce('menuitem', mp_share, {id:'dbr_mi_sinaweibo',site:'sina'},{command:openShareUIByMenu})       
        ce('menuitem', mp_share, {id:'dbr_mi_doubansay',site:'douban'},{command:openShareUIByMenu})  
        ce('menuitem', p, {id: 'dbr_mi_close'},{command:douban_radio.close})       
        
		ce('menuseparator', p)
		ce('menuitem', p, {id:'dbr_mi_lyric'},{command:findSyncLyric})   
		ce('menuitem', p, {id:'dbr_mi_download'},{command:saveFile})
		ce('menuitem', p, {id:'dbr_mi_splist'}, {command: openArtistList})
		ce('menuitem', p, {id:'dbr_mi_artistmode'},{command: getArtistModeId})                        
        ce('menuitem', p, {id:'dbr_mi_albummode'},{command: getAlbumModeId})                        
		ce('menuitem', p, {id:'dbr_mi_red'},{command: openMyListEditor})                
        ce('menuitem', p, {id:'dbr_mi_list'}, {command: openSongListEditor})
        ce('menuitem', p, {id:'dbr_mi_myalbum',url:DBRUtil.PAGE_GROUP,process:DBRUtil.PROC_LINK})
        ce('menuitem', p, {id:'dbr_mi_downloadstatus'},{command: function(){
        	openDownloadInfo()        	
        }})
        
	    
		ce('menuseparator', p,{id:'dbr_msp_sp'})
		if (DBRUtil.isWindow()) {
			ce('menuitem',p, {id:'dbr_mi_windowlyric'},{command:openWindowLyric})
        }
		
		ce('menu', p, {id: 'dbr_mi_app'})        
	    var mp_oauth = ce('menupopup', 'dbr_mi_app', {}, {popupshowing: menuProcessor2});
		var m_oauth_sina = ce('menu', mp_oauth, {id:'dbr_m_sina'})
        var mp_oauth_sina  = ce('menupopup', m_oauth_sina);		
        ce('menuitem', mp_oauth_sina, {id:'dbr_mi_defaultshare4s','type':'checkbox',site:'sina'}, {command: setShareService})
		ce('menuitem', mp_oauth_sina, {id:'dbr_mi_authorize4s'}, {command: DBRUtil.authorize4Sina})
		ce('menuitem', mp_oauth_sina, {id:'dbr_mi_gettoken4s'}, {command: DBRUtil.getAccessToken4Sina})
		ce('menuitem', mp_oauth_sina, {id:'dbr_mi_cleartoken4s'}, {command: DBRUtil.forgetToken4Sina})
		ce('menuitem', mp_oauth_sina, {id:'dbr_mi_sinatopic'}, {command: setTopicFormat})
		var m_oauth_douban = ce('menu', mp_oauth, {id:'dbr_m_douban'})
		var mp_oauth_douban  = ce('menupopup', m_oauth_douban);		
		ce('menuitem', mp_oauth_douban, {id:'dbr_mi_defaultshare4d','type':'checkbox',site:'douban'}, {command: setShareService})
        ce('menuitem', mp_oauth_douban, {id:'dbr_mi_authorize4d'}, {command: DBRUtil.authorize4Douban})
		ce('menuitem', mp_oauth_douban, {id:'dbr_mi_gettoken4d'}, {command: DBRUtil.getAccessToken4Douban})
		ce('menuitem', mp_oauth_douban, {id:'dbr_mi_cleartoken4d'}, {command: DBRUtil.forgetToken4Douban})		
		ce('menuitem', mp_oauth, {id:'dbr_mi_apphelp',url:DBRUtil.PAGE_CALLBACK,process:DBRUtil.PROC_LINK})
		ce('menuitem', mp_oauth, {id:'dbr_mi_format'}, {command: setShareFormat})				
	
		ce('menu', p, {id: 'dbr_m_help'})        
        var mi_other = ce('menupopup', 'dbr_m_help');
        ce('menuitem', mi_other, {id:'dbr_mi_usage',url:DBRUtil.PAGE_HELP,process:DBRUtil.PROC_LINK})
	    ce('menuitem', mi_other, {id:'dbr_mi_shortcut',url:DBRUtil.PAGE_SHORTCUT,process:DBRUtil.PROC_LINK})
        ce('menuitem', mi_other, {id:'dbr_mi_qa',url:DBRUtil.PAGE_ERROR,process:DBRUtil.PROC_LINK})
		ce('menuitem', mi_other, {id:'dbr_mi_count'},{command:openCountPage})
        ce('menuseparator', mi_other)                    
        ce('menuitem', mi_other, {id:'dbr_mi_mp3path',process:DBRUtil.PROC_CLR,param:"mp3path"})
		ce('menuitem', mi_other, {id:'dbr_mi_artistfilter'},{command:setArtistFilter})
		ce('menuitem', mi_other, {id:'dbr_mi_changenotify',type: 'checkbox',process:DBRUtil.PROC_NEG,param:"autoshowinfo"})		
        ce('menuitem', mi_other, {id: "dbr_mi_showlyric",type: 'checkbox'}, {
            command: toggleSyncLyric
        })
		ce('menuitem', mi_other, {id:'dbr_mi_addressbar'},{command:toggleUI})
        ce('menuitem', mi_other, {id:'dbr_mi_id3v1',type: 'checkbox',process:DBRUtil.PROC_NEG,param:"id3v1"})
        ce('menuitem', mi_other, {id:'dbr_mi_id3v2',type: 'checkbox',process:DBRUtil.PROC_NEG,param:"id3v2"})
        if (DBRUtil.isLinux()) {
            ce('menuitem', mi_other, {id: "dbr_mi_osd",type: 'checkbox',process:DBRUtil.PROC_NEG,param:"thirdpartytool"})
        }
        ce('menuitem', mi_other, {id: "dbr_mi_youdao",type: 'checkbox'}, {command: function(){
        	setPref('lyricengine','youdao');
        	setLyricEngine();
        }})
        ce('menuitem', mi_other, {id: "dbr_mi_yahoo",type: 'checkbox'}, {command: function(){
        	setPref('lyricengine','yahoo');
        	setLyricEngine();
        }})
        ce('menuseparator', mi_other)                    
		ce('menuitem', mi_other, {id:'dbr_mi_follow',url:DBRUtil.PAGE_FOLLOW,process:DBRUtil.PROC_LINK})
	    ce('menuitem', mi_other, {id:'dbr_mi_donate',url:DBRUtil.PAGE_DONATE,process:DBRUtil.PROC_LINK})
	    initXMChannel()
	}
	
	function toggleUI(){
		setPref('showinurlbar', !getPref('showinurlbar'))	
		initToolKit()
	}
	
	function initUI(){
		initToolKit()
		initMenu();
	}
	
	function openWindowLyric(){
		var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            var win = wm.getMostRecentWindow("DBR:LYRIC");
            if (win){
				win.focus();
			}else{
				window.openDialog(DBRUtil.UI_WINDOWLYRIC, "drb_windowlyric", "chrome,resizable=no,dialog=no,alwaysLowered=no,alwaysRaised=no,titlebar=no,height=30,width=300", {doubanradio:douban_radio})
			} 
	}
	
    function changeChannel(e){
		if (e.originalTarget.getAttribute('cid') !== '') {
			var rid = e.originalTarget.getAttribute('rid');
			var cid = e.originalTarget.getAttribute('cid');
			DBRUtil.log2("change channel : rid " + rid +" cid "+ cid )
			radio.setRadioChannel(cid,rid)
         }
    }
	
	function openMusicPage(){
		DBRUtil.openPage(DBRUtil.PAGE_MUSICHOME)
	}
	
	function hideRadioKit(){
        drb_l.setAttribute('collapsed', true)
        drb_l2.setAttribute('collapsed', true)
        drb_t.setAttribute('collapsed', true)
		drb_ar.setAttribute('collapsed', true)
		drb_al.setAttribute('collapsed', true)
		drb_c.setAttribute('collapsed', true)
		drb_h.setAttribute('collapsed', true)
    }
    
	// 那些状态可以显示
	// 那些频道可以显示
	// 那些电台可以显示
	// 
    function showRadioKit(){
		if (radio.getStatus() == radio.STATUS_PLAY) {
            drb_l.setAttribute('collapsed', !radio.isLoved())
            drb_l2.setAttribute('collapsed', radio.isLoved())
            drb_t.setAttribute('collapsed', false)
			if(radio.getRID() == 0){
				drb_ar.setAttribute('collapsed', false)
				drb_al.setAttribute('collapsed', false)
				drb_c.setAttribute('collapsed', false)
				drb_h.setAttribute('collapsed', false)
			}
        }
    }
	
	function openChatRoom() {
		DBRUtil.openPage(DBRUtil.PAGE_CHATROOM)
	}
	
	// 显示歌曲信息
    function viewSongInfo(){
        var html = DBRUtil.GSH('radiousage')
        var status = radio.getStatus() ;
		if (status == radio.STATUS_BUSY) {
			var radioName = radio.getRadioName()
			var channelName = radio.getChannelName()
			html = DBRUtil.GSH('readingradio',[radioName,channelName])
        }else if (status == radio.STATUS_PLAY) {
			html = radio.getTooltipHtml()
        }
		DBRUtil.injectHTML($("dbr_div_songtip"),html)
	}
	
	   function menuProcessor(e){
		if (e.target.id != 'radio_popup') return;
		var status = radio.getStatus();
		// 运行中,显示关闭. 运行,全部显示
        for (var i = 0; i < e.target.childNodes.length; i++) {
			// 不是播放状态时全部菜单隐藏
            e.target.childNodes[i].hidden =  status!= radio.STATUS_PLAY
        }
        
		if (status == radio.STATUS_PLAY) {
				$('dbr_mi_replay').setAttribute('disabled', radio.getSongName() == "");
				$('dbr_mi_replay').setAttribute('label', radio.getSongName() == "" ? "重播歌曲" : "重播 : " + radio.getSongName());
				$('dbr_mi_mp3path').setAttribute('tooltiptext', getPref('mp3path'));
				$('dbr_mi_mp3path').setAttribute('disabled', getPref('mp3path') == "");
				$('dbr_mi_favc').setAttribute('disabled', !(channelRepository['red'] && channelRepository['red'].length>=30));
				$('dbr_mi_changenotify').setAttribute('checked', getPref('autoshowinfo'));
				$('dbr_mi_showlyric').setAttribute('checked', getPref('synclyric'))
				$('dbr_mi_addressbar').setAttribute('label', getPref('showinurlbar')?"显示在状态栏":"显示在地址栏")
				$('dbr_mi_id3v1').setAttribute('checked', getPref('id3v1'))
				$('dbr_mi_id3v2').setAttribute('checked', getPref('id3v2'))
				$('dbr_mi_youdao').setAttribute('checked', getPref('lyricengine')=='youdao')
				$('dbr_mi_yahoo').setAttribute('checked', getPref('lyricengine')=='yahoo')
				if ($('dbr_mi_osd')) 
					$('dbr_mi_osd').setAttribute('checked', getPref('thirdpartytool'))
				$('dbr_mi_open').hidden = true
				if (radio.getRID() != 0) {
					$('dbr_mi_red').hidden = true
					$('dbr_mi_albummode').hidden = true
					$('dbr_mi_artistmode').hidden = true
					$('dbr_mi_myalbum').hidden = true
					$('dbr_mi_favc').hidden = true
					$('dbr_m_channel2').hidden = true
				}
				if(radio.getRID()==0){
					$('dbr_mi_albummode').setAttribute('label', "收听: " + radio.getCrtAlbum())
					$('dbr_mi_artistmode').setAttribute('label', "收听: " + radio.getCrtArtist())
					$('dbr_mi_list').hidden = true
				}
				$('dbr_mi_doubansay').setAttribute('disabled', DBRUtil.hasToken('douban') == false)
				$('dbr_mi_sinaweibo').setAttribute('disabled', DBRUtil.hasToken('sina') == false)
				$('dbr_m_channel').setAttribute('label', radio.getChannelName());
        }
		
		// 读取状态时显示的菜单
		if(status != radio.STATUS_STOP){
			$('dbr_mi_close').hidden = false
			$('dbr_m_channel').hidden = false	
			$('dbr_m_help').hidden = false	
			$('dbr_msp_sp').hidden = false
		}
		
		if(status == radio.STATUS_STOP){
			$('dbr_mi_open').hidden = false
		}
		$('dbr_mi_downloadstatus').hidden = false
    }
	
	function menuClickProcessor(e){
		var processName = e.target.getAttribute('process')
		if(!processName)return
		if(processName == DBRUtil.PROC_LINK){
			DBRUtil.openPage(e.target.getAttribute('url'));	
		}
		if(processName == DBRUtil.PROC_CLR){
			setPref(e.target.getAttribute('param'),'');	
		}
		if(processName == DBRUtil.PROC_NEG){
			var param = e.target.getAttribute('param')
			setPref(param, !getPref(param))	
		}
	}
	
	function openCountPage(){
		DBRUtil.openPage(radio.getCountURL())
	}
			
	// 通过地址栏歌词打开分享界面
	function openShareUIByLyric(e){
		isCanExecuteByToken(openShareUI,[getPref('shareservice'),rl.getLyric(1)])
	}
	
	// 根据应用授权判断是否能执行
	function isCanExecuteByToken(fn,arg){
		if (DBRUtil.hasToken(getPref('shareservice'))) {
			if(fn) fn.apply(null,arg)
		}else{
			notify(DBRUtil.GSA('notoken'))
		}
	}
		
	// 发送分享内容
    function openShareUI(site,lyric){
		radio.getAlbumPic(function(picFile){
			var data = radio.getLyricParam();
			lyric = lyric ? lyric:""
			data.content = lyric + radio.getPatternString()
			data.rl = rl
			data.site = site
			window.openDialog(DBRUtil.UI_FINDLYRIC, "drb_finder", DBRUtil.UI_FINDLYRIC_PARAM2, data)
			if(data.out){
				say(site,data.out,picFile)
			}		
		})
    }
	
	// 		
	function setShareFormat(){
		var str = prompt(DBRUtil.GSC('format'),getPref('lovestring'))
		if(str) setPref('lovestring',str)		
	}

	function setArtistFilter(){
		var str = prompt(DBRUtil.GSC('artistfilter'),getPref('artistfilterlist'))
		setPref('artistfilterlist',str)		
	}
	
	function setShareService(e){
		setPref('shareservice',e.target.getAttribute('site'))
	}

	function menuProcessor2(e){
		$('dbr_mi_authorize4d').setAttribute('disabled', DBRUtil.hasToken('douban') == true)
		$('dbr_mi_cleartoken4d').setAttribute('disabled', DBRUtil.hasToken('douban') == false)
		$('dbr_mi_gettoken4d').setAttribute('disabled', DBRUtil.hasRequestToken('douban') == false)
		$('dbr_mi_authorize4s').setAttribute('disabled', DBRUtil.hasToken('sina') == true)
		$('dbr_mi_cleartoken4s').setAttribute('disabled', DBRUtil.hasToken('sina') == false)
		$('dbr_mi_gettoken4s').setAttribute('disabled', DBRUtil.hasRequestToken('sina') == false)
		$('dbr_mi_defaultshare4s').setAttribute('checked', getPref('shareservice')=='sina')
		$('dbr_mi_defaultshare4d').setAttribute('checked', getPref('shareservice')=='douban')
	}
	
	// 定制歌单
    function openSongListEditor(sp,type){
        var data = {
            out: null,
            url: sp.url?sp.url:radio.getPlayListUrl(null,true),
            cname:sp.cname?sp.cname: radio.getChannelName(),
			type:sp.type?sp.type:"",
			flg:sp.flg?sp.flg:false
        }
		window.openDialog(DBRUtil.UI_SONGLIST, "drb_editor", DBRUtil.UI_SONGLIST_PARAM, data);
		if (data.out && data.out!='[]') {
			if(type){
				radio.customizeRedList(JSON.parse(data.out))
			}else{
	           radio.customizeChannel(data.out)
			}
        }
    }
	
		
	function initRecentMenu(e){
		DBRUtil.clearNode(e.target);
		var limit = 10
		var cnt = recentChannel.length - limit < 0 ? recentChannel.length :limit
		for(;cnt>0;cnt--){
			var pos = recentChannel.length - cnt
				ce('menuitem', 'dbr_menupopup_recent', {
	                label: recentChannel[pos].cn,
	                cid: recentChannel[pos].cid,
					rid:recentChannel[pos].rid
	        },null,true)
		}
	}
	
	// 通过菜单打开分享界面
	function openShareUIByMenu(e){
		openShareUI(e.target.getAttribute('site'))
	}	
	
		// 打开专辑页面
	function openAlbumPage(){
        DBRUtil.openPage(radio.getAlbumUrl())
    }
	
	// 打开音乐人
	function openArtistPage(){
		var songInfo = radio.getSongInfo();
		var artist = encodeURIComponent(songInfo.artist.split('/')[0].trim())
		url = "http://music.douban.com/search/"+artist+"?sid="+songInfo.sid
		DBRUtil.sendXHR(url,null,function(txt){
			if(txt.indexOf("音乐搜索") == -1 ){
				DBRUtil.openPage(url);
			}else{
				DBRUtil.openPage(txt.match(/http\:\/\/music\.douban\.com\/musician\/\d*\//g)[0])	
			}
		})
		hideRadioKit()
    }
	function loveIt2(){
		if(!radio.isLoved()){
			loveIt()
		}
		notify("喜欢"+radio.getSongName())
	}
	
   // 喜欢
    function loveIt(e,flg){
		// 按ctrl，发送分享		
		if(e && e.ctrlKey){
			sendShareInfo()
		}
		// 按alt，下载歌曲
		if(e && e.altKey){
			// 不让界面卡住
			setTimeout(saveFile,100)
		}		
		if(radio.isLoved() && e && (e.altKey || e.ctrlKey)){
			return 
		}
		// 设置喜欢数据
		radio.love(!radio.isLoved())
		// 调整界面
		if (!flg && e) showRadioKit()
		// 发送标记请求
		var url = radio.isLoved() ? radio.getLoveURL() : radio.getUnLoveURL();
		DBRUtil.log2("loveIt : "+url)
		// 按住shift键，执行非调教的喜欢/不喜欢标记
		var rid = radio.getRID()
		DBRUtil.sendXHR(url,null,(rid==0 && (e &&( e.shiftKey == false)))?radio.adjustableLove:null)
    	sendLoveInfo()
	}
		
    // 讨厌
    function hateIt(){
		hideRadioKit()
		setStatusIcon(radio.STATUS_BUSY)		
		DBRUtil.sendXHR(radio.getTrashURL(), null, radio.getRID()==0?radio.adjustableHate:douban_radio.open)  	
		sendHateInfo()
	}
	
	
	function sendLoveInfo(){
		if(getPref('publicinfo') && radio.getRID()== 0 && radio.isLoved()){
			var songInfo = radio.getSongInfo()
			var artist = songInfo.getArtist()
			var title = songInfo.getTitle()
			var link = radio.getShareLink()
			sendPublicInfo(DBRUtil.PAGE_LOVEWALL,"喜欢"+artist+"的《"+title+"》。"+link)
		}
	}
	
	function sendHateInfo(){
		if(getPref('publicinfo') && radio.getRID()==0){
			var songInfo = radio.getSongInfo()
			var artist = songInfo.getArtist()
			var title = songInfo.getTitle()
			var link = radio.getShareLink()
			sendPublicInfo(DBRUtil.PAGE_HATEWALL,"讨厌"+artist+"的《"+title+"》。"+link)
		}
	}
	
	function sendPublicInfo(url,info){
		if (ck) {
			var v = DBRUtil.genSignatur2(info)
			var content = "ck=" + ck + "&text=" + encodeURIComponent(info)+ " SHA=" + v
			var header = {
				"Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
				'Content-length': content.length
			}
			DBRUtil.sendXHR(url, header, function(txt){
				DBRUtil.log2(txt)
			}, null, 'POST', content)
		}else{
			getCK()			
		}
	}
	
		// 切换同步歌词状态    
    function toggleSyncLyric(){
        var flg = !getPref('synclyric')
		setPref('synclyric', flg)
        if(radio.getStatus() != radio.STATUS_PLAY) return;
		rl.switchOutWay(flg)
    }
    
    // 获取专辑模式ID
    function getAlbumModeId (fn){
		radio.checkLogin(function(){
				var url = radio.getAlbumUrl();
				var artist = radio.getCrtArtist()
				DBRUtil.sendXHR(url, null, function(txt){
					var rslt = txt.match(/subject_id\:\d{1,}/g)
					if (rslt && rslt.length > 0) {
						var albumid = rslt[0].split(':')[1]
						var album = radio.getCrtAlbum();
						openSongListEditor2(album,albumid,DBRUtil.MODE_ALBUM)					
					}else {
						notify(DBRUtil.GSC('noalbummode'))
					}					
				})
		})
    }
	
	// 获取歌手模式ID
	function getArtistModeId(){
		radio.checkLogin(function(){
			var artist = radio.getCrtArtist()
			var artist2 = encodeURIComponent(artist)
			url = "http://music.douban.com/search/"+artist2+"?sid="+radio.getSongInfo().sid
			// 检索歌手
			DBRUtil.sendXHR(url,null,function(txt){
				if(txt.indexOf("音乐搜索") >= 0 ){
					url = txt.match(/http\:\/\/music\.douban\.com\/musician\/\d*\//g)[0]
				}
				DBRUtil.sendXHR(url,null,function(txt){
					var rslt = txt.match(/musician_id\:\d{1,}/g)
					if(rslt && rslt.length > 0){
						var artistid = rslt[0].split(':')[1]
						radio.setAAChannel({type:DBRUtil.MODE_MUSICIAN,id:artistid,name:artist})
						rememberAritst(artistid,artist)
					}else{
						notify(DBRUtil.GSC('noartistmode'))
					}
				})
			})
		})
	}
	
	function rememberAritst(id,name){
		var p = 'artistlist'
		var tmpList = DBRUtil.getPref2(p)
		tmpList[id] = name;
		DBRUtil.setPref2(p,tmpList);	
	}
	
	// 定制歌手、专辑歌单
	function openSongListEditor2(name,id ,type,flg){
		var p = type == DBRUtil.MODE_MUSICIAN ? 'artistlist':'albumlist'
		// 从网页来的处理不做记录
		if (!flg) {
			var tmpList = JSON.parse(getPref(p, '{}'));
			tmpList[id] = name;
			setPref(p, JSON.stringify(tmpList));
		}
		var url = radio.getPlayListUrl(0,true) +'&'+ type + id			
		openSongListEditor({url:url,cname:name,type:type,flg:flg},true)
	}
	
	// 更新最近使用频道
	function pushRecentChannel(evt){
		var cid = evt.crtCID , rid = evt.crtRID;
		recentChannel = recentChannel.filter(function(obj){
			return obj.cid + obj.rid != cid + rid
		})		
		recentChannel.push({cid:cid,rid:rid,cn:radio.getChannelName()})
		setPref('recentchannel',JSON.stringify(recentChannel));
	}
	
	function setTopicFormat(){
		var str = prompt(DBRUtil.GSC('topic'),getPref('topicstring'))
		if(str) setPref('topicstring',str)		
	}
	
	 // 查找同步歌词
    function findSyncLyric(){
        var data = radio.getLyricParam()
		data.rl = rl
        window.openDialog(DBRUtil.UI_FINDLYRIC, "drb_finder",  DBRUtil.UI_FINDLYRIC_PARAM, data);
        if (data.out && data.out.length > 0) {
			// 重新设置歌词
            rl.setData(data.out[0])
			// 本地保存歌词
			rl.saveLyricFile(radio.getSongInfo(),data.out[0])
        }
    }
	
	function say(site,contents,picFile){
		DBRUtil.say2(site,contents,getPref('topicstring'),picFile,function(){
					notify(DBRUtil.GSA('shared',[site.toUpperCase()]))
		})
	}
	
	// 通过快捷键打开分享界面
	function openShareUIByHk(){
		isCanExecuteByToken(openShareUI,[getPref('shareservice'),rl.getLyric(1)])
	}
	
	// 发布默认分享
	function sendShareInfo(){
		isCanExecuteByToken(function(){
			var str = radio.getPatternString()
			radio.getAlbumPic(function(picFile){
				var topic = getPref('shareservice') == 'sina'?getPref('topicstring') : "";
				say(getPref('shareservice'),[topic+str],picFile)
			})
		})		
	}
	
	function saveFile(){
		var songInfo = radio.getSongInfo();
		downloadFile([songInfo],0)
	}
	
	function getMp3File(songInfo){
		var mp3Name = songInfo.getMusicFileName();
        if (getPref('mp3path') != "") {
        	return  DBRUtil.getFileByPath(getPref('mp3path') + DBRUtil.fileNameProcessor(mp3Name)+'.mp3');
        }else{
			var fp = DBRUtil.getFilePicker(mp3Name)
			if(!fp) return;
			setPref('mp3path',fp.file.path.replace(fp.file.leafName, ''));
			return fp.file;			
		}
	}
	
	
    // 下载歌曲		
    function downloadFile(songInfos,indx){
       if(indx > (songInfos.length -1)) return;
       
       var songInfo = songInfos[indx],
       		aFile = getMp3File(songInfo),
       		mp3Name = songInfo.getMusicFileName();
        downloadList[songInfo.getMusicFileName()] = 1		
       notify(DBRUtil.GSA('readytodownload',[mp3Name])) 
	   DBRUtil.log2('mp3 url : ' + songInfo.getMp3Url())
	   DBRUtil.downloadFile(songInfo.getMp3Url(), aFile, function(file, flg){
			var msg = flg == false ? DBRUtil.GSA('exist', [mp3Name]) : DBRUtil.GSA('downloaded', [mp3Name])
	   		 downloadList[songInfo.getMusicFileName()] = 2
			notify(msg);
			(function(afile,songInfo){
				setTimeout(function(){
					if(getPref('id3v1')){
								new DBRUtil.ID3V1(aFile,songInfo, "").writeTag();											
					}
					var imageFile = DBRUtil.getFileByPath(getPref('mp3path') + DBRUtil.fileNameProcessor(songInfo.getAlbum())+'.jpg');
					var imageUrl = modifyImageUrl(songInfo.getPic());
					DBRUtil.log2('image url : ' + imageUrl)
					DBRUtil.downloadFile(imageUrl, imageFile, function(picFile){
						if (getPref('id3v2')) {
							new DBRUtil.ID3V23(aFile,songInfo,picFile).writeTag();
						}
					})
				},100)
			})(aFile,songInfo)
			downloadFile(songInfos,++indx)					
		})
    }
    
    function modifyImageUrl(url){
    	if (radio.getRadioName()=='豆瓣电台'){
    		return url.replace('mpic','lpic')
    	}
    	return url
    }
    
    function saveAlbum(albumData,indx){
    	var songs = [],
    		cnt = 0,
    		len = getPref('queuedeep'),
    		interval = 2000;
    	for each(var data in albumData){
    		var song = DBRUtil.SongInfoWarpper(data)
    		if(downloadList[song.getMusicFileName()] == null){
    			downloadList[song.getMusicFileName()] = 0;
    			songs.push(song)
    			cnt+=1;
    			if((cnt % len) == len-1){
	    			(function(songs,cnt){
	    				setTimeout(function(cnt){
	    			    	downloadFile(songs,0)	
	    				},interval*cnt)
	    			})(songs,cnt / len)
	    			songs=[];
	    		}
    		}
    	}
		(function(songs){
			setTimeout(function(cnt){
		    	downloadFile(songs,0)	
			},1000)
		})(songs)
    }
    
    function openDownloadInfo(){
    	var content = "",
    		status = ['等待下载','下载中','已下载'],
    		color= ['orange','red','green']

    	for(var song in downloadList){
    		var indx = downloadList[song]
    		content += DBRUtil.GSC('downloadlist',[color[indx],song,status[indx]])
    	}
    	if(content == ""){
    		content = "<h1>还没有下载信息</h>"
    	}
    	var data = "data:text/html;charset=utf-8," + content;
    	DBRUtil.openPage(data);
    }
    
    
    
	// 打开红心歌单选择界面
	function openMyListEditor(){
		var data = [];
		window.openDialog(DBRUtil.UI_MYLIST, "drb_mylist", DBRUtil.UI_MYLIST_PARAM,data);
        if(data.length>0){
			radio.customizeRedList(data)
		}
	}
	
	function openArtistList(){
		var data = [];
		window.openDialog(DBRUtil.UI_AALIST, "drb_aalist", DBRUtil.UI_MYLIST_PARAM,data);
        if (data.length > 0) {
//			openSongListEditor2(data[0].name,data[0].aid,DBRUtil.MODE_MUSICIAN);
			radio.setAAChannel({type:DBRUtil.MODE_MUSICIAN,id:data[0].aid,name:data[0].name})
		}
	}
	
    // 设置电台的状态图标  
    function setStatusIcon(status){
		bss.notifyObservers(null, "douban_radio_status", status)
		turnoffImage(status == radio.STATUS_BUSY)
		if(status == radio.STATUS_PLAY){
			drb_i.setAttribute('src', DBRUtil.getImageURL(radio.getRadioICO()))
		}else{
			drb_i.setAttribute('src', DBRUtil.getImageURL(status))
		}
    }
	
		
	// 换歌提示
	function popup(songInfo,albumUrl){
		if (songInfo!=null && getPref('autoshowinfo') == false)  return;
		if(!songInfo){
			songInfo = radio.getSongInfo()
			albumUrl = radio.getAlbumUrl()
		}
		var title = songInfo.getTitle();
		var album = songInfo.getAlbum();
		var artist = songInfo.getArtist();
		var imgUrl = songInfo.getPic();		
		DBRUtil.alertsService(title,artist+"::"+album,imgUrl,albumUrl)
	}
    
	function turnoffImage(flg){
		if(!flg){
			drb_i.setAttribute('style',"")
			drb_i.setAttribute('class',"radio_style")
			clearInterval(tfc);
			tf = 0,tfc =0;
			return	
		} 
		if(tfc == 0){
			tfc = setInterval(function(){
				drb_i.setAttribute('style',"-moz-transform:rotate("+30*(tf++)+"deg)")
			},200)
		}
	}
	
	function popupMenu(){
		$('radio_popup').openPopup(drb_i, "after_end", 0, 0, false, false)
	}
    
	function isCanExecute(fn){
        return function(){
            if (radio.getStatus() == radio.STATUS_PLAY) fn()
        }
    }

})()
