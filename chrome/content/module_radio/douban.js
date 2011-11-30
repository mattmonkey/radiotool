DBRUtil.DoubanMoudle = function (){
    var url_count = 'http://douban.fm/mine?type=liked'
    var channelInfo = JSON.parse(DBRUtil.getPref('channel_douban'))   
    var songInfo ;
    var lovedPlayList  = JSON.parse(DBRUtil.getPref('mylist',"{}"));
    var lovedPlayList2 = [];
    var mylist = []
    var tmpIds = {}
    var overMyListFlg = false
	var aamode;
    this.logged = false
    var favFlg = false;
    var favName ="红心频道"
    this.ico = 'douban.png'
    var favList ;
    
    for each(var v in lovedPlayList) lovedPlayList2.push(v);
    
    this.checkChannelUpdate = function(fn){
		DBRUtil.sendXHR('http://douban.fm/radio',null,function(txt){
			// 匹配页面里的变量，有变更就结束
			var rslt = txt.match(/channels: \'.*\'/);
			if(!rslt) return 
			
			rslt = decodeURIComponent(rslt[0].slice(11,-1))
			rslt = JSON.parse(rslt)
			var channel2 = {},channel3 = {}
			// 转换格式
			for each(var channel in rslt){
				channel2['C'+channel.channel_id]=channel.name
				channel3['C'+channel.channel_id]=channel.name	
			}
			
			// 与现有数据做比对 ：1、新增的 （n-o） 2、取消的 （o-n）3名字变更的
			for (var sid in channelInfo){
				// 剩下没有的数据，即新频道
				if(channel2[sid]){
					// 频道改名	
					if(channel2[sid]!=channelInfo[sid]){
						DBRUtil.log2("频道改变： "+ channel2[sid] + " | " + channelInfo[sid])
						DBRUtil.alert(DBRUtil.GSC('changedchannel',[channelInfo[sid],channel2[sid]]),10000)
					}
					// 从新的频道数据里删除已有频道
					delete channel2[sid] 
				}else{
					//没有找到新数据里找到，说明该频道被取消。提示
					DBRUtil.alert(DBRUtil.GSC('caneledchannel',[channelInfo[sid]]),10000)			 
				}
			} 
			
			// 提示更新，没有当然也就不提示了
			for(var cid in channel2){
				DBRUtil.alert(DBRUtil.GSC('newchannel',[channel2[cid]]),10000)
				channelInfo[cid] = channel2[cid]
			}
			
			// 用新的频道数据直接替换旧的
			DBRUtil.setPref('channel_douban',JSON.stringify(channel3))
			//TODO 更新UI
			fn()
			
		})
    }

    this.clearTmpData = function(){}
    
    this.setMyList = function(list){
    	favFlg = false
        mylist = list
    }
    
    // 两种结束方式： flg = null 下首生效 flg = true 立即生效
    this.overMyList = function(flg){
        if(flg){
            mylist = [];
            overMyListFlg = false
        }
        if(mylist.length>0){
            overMyListFlg = true;
        }
    }
	
	this.nextMyList = function(flg){
		if(mylist.length>0){
            pop();
        }
    }
    
    this.clearPlaylistHistory = function(){
        tmpIds = {}
        favFlg = false
    }
    
    // 返回MP3文件名    
    this.getMusicFileName = function(){
        return songInfo.artist + '-' + songInfo.title+'.mp3';
    }
    
    // 返回歌词查询参数
    this.getLyricParam2 = function(){
    	return {title:songInfo.title,artist:songInfo.artist,album:songInfo.albumtitle};
    }
    
    // 返回歌词查询参数
    this.getLyricParam = function(){
        return [songInfo.title,songInfo.artist,songInfo.albumtitle];
    }
    
    // 标记喜欢   
    this.getLoveURL = function(cid){       
        return genAdjustableLink('r',cid,tmpIds,aamode)
    }
    // 标记不喜欢
    this.getUnLoveURL = function(cid){
        return genAdjustableLink('u',cid,tmpIds,aamode)
    }
    
    function genAdjustableLink(t,cid,h,args){
        var content = []
        content.push('type='+t)
        content.push('sid='+songInfo.sid)
        var history =''
        for (var id in h){
            history+='|'+id+':'+h[id]
        }
        content.push('h='+history)
        content.push('channel='+cid)
		if(args){
			content.push(args.type+args.id)
		}
        content.push('r='+DBRUtil.getRandomString(10))
        return 'http://douban.fm/j/mine/playlist?'+content.join('&')
    }
    
    // 跳过歌曲
    this.getSkipURL = function(cid){
        tmpIds[songInfo.sid]='s'
        return genAdjustableLink('s',cid,tmpIds,aamode)
    }
    
    // 标记讨厌
     this.getTrashURL = function(cid){
        tmpIds[songInfo.sid]='b'
        return genAdjustableLink('b',cid,tmpIds)
    }
    
    this.getCountURL = function(){
        return url_count;
    }
    
    // 电台链接
    this.getRadioUrl = function(cid){
        if(mylist && mylist.length>0){
	        DBRUtil.log2('mylist len : ' + mylist.length)
            var url = genShareLink(mylist[mylist.length-1],cid) 
            DBRUtil.log2("getRadioUrl " +url)
            return url
        }
        return 'http://douban.fm/radio';
    }
    
    // 对应专辑链接
    this.getAlbumUrl = function(){
       return songInfo? "http://www.douban.com" + songInfo.album : ""
    }
    
    // 对应频道链接
    this.getPlayListUrl = function(cid,flg){
		var addition = aamode?('&'+aamode.type+aamode.id):""
        return 'http://douban.fm/j/mine/playlist?type=n&channel=' + cid + (flg?"":addition)
    }

    
    function genShareLink(si, cid){
        return "http://douban.fm/?start=" + si.sid+"g"+si.ssid+"g1&cid="+cid
    }
	
    // 标记喜欢
    this.love = function(flg){
        songInfo.like = flg?"1":"0"
        tmpIds[songInfo.sid] = flg ? "r" : "u";
        flg?cloneData(songInfo):deleteData()
    }

    function cloneData(song){
        if(lovedPlayList[song.sid]) return
        lovedPlayList[song.sid] = {}
        lovedPlayList[song.sid].title = song.title
        lovedPlayList[song.sid].artist = song.artist
        lovedPlayList[song.sid].ssid = song.ssid
        lovedPlayList[song.sid].sid = song.sid
        persistData();        
    }
    
    function persistData(){
        DBRUtil.setPref('mylist',JSON.stringify(lovedPlayList))   
    }
    
    function deleteData(){
        if(!lovedPlayList[songInfo.sid]) return
        delete lovedPlayList[songInfo.sid]   
        persistData();
    }
    
    // 是否喜欢
    this.isLoved = function(){
         return songInfo.like == "1"
    }
    
    this.getChannelInfo = function(flg){
		if(flg){
			DBRUtil.log2("pref :" + DBRUtil.getPref('channel_douban'))				
			channelInfo = JSON.parse(DBRUtil.getPref('channel_douban')) 
		}
	    return channelInfo
		
    }
    
    this.getChannelName = function(crtCID){
        return  channelInfo['C' + crtCID] 
    }
    
    this.getSongName = function(){
        return songInfo.title
    }
    
    // tooltip注入用html
    this.getTooltipHtml = function(cid){
		var list = '',cnt= 0
		if(mylist.length>0){
			for each(var song in mylist){
				if(cnt++ > mylist.length-2){
					continue
				}
				list = "<tr><font color='red'>" + song.title + "-" + song.artist +"</font></tr>" + list
			}
		}
		DBRUtil.log2('tip list ' + list)
		var albumName = favFlg ?  favName : "专辑频道"
		var status = mylist.length>0 ?albumName :(aamode?"歌手频道":channelInfo['C' + cid])
        return DBRUtil.GSH('douban_albuminfo',[songInfo.title,
                                                    songInfo.artist,
                                                    songInfo.albumtitle, 
                                                    songInfo.company,
                                                    songInfo.picture.replace(/\\/g, ''),
                                                    status,
													list])
    }
    
    // 换歌提示数据
    this.getPopupParam = function(){
        var image = songInfo.picture.replace(/\\/g, '');
        var songTitle = songInfo.title;
        var album = songInfo.albumtitle;
        var artist = songInfo.artist;
        return [image,songTitle,artist+" :: " + album]
    }
    
    // 判断播放器是否出错
    this.isError = function(url){
        return url.indexOf('except') > -1 && url.indexOf('play_slow') == -1
    }
    
    // 判断是否是歌曲
    this.isMusic = function(url){
        // 已经报告可能会带上*.mp3
        return url.indexOf('.mp3') > -1 && url.indexOf('except') == -1
    }
    
    // 判断是否是歌单
    this.isList = function(url){
        return url.indexOf('type=n') > -1 || url.indexOf('type=p') > -1
    }
    
    // 截取音乐ID
    this.getMusicId = function(url,songs){
        var mp3id = url.match(/p\d*/g)[1].replace('p', '')
        songInfo = songs[mp3id]
        if(!songInfo) throw "list over"
        if(mylist.length == 0 && songInfo.like=='1')cloneData(songInfo)
        tmpIds[mp3id]='p'
        return mp3id
    }
    
    this.rstr2 = function(content){
        return DBRUtil.rstr2(content)
    }
    
    this.isAD = function(element, index, array){
		if(!element) return false
         return /^\d{1,}/.test(element['sid']);
    }
    
    this.genSongList = function(list){
        return '{"r":0,"song":' + list + "}"
    }
    
     this.shamDataProcessor = function (data,songs){         
        var flg = false
        var tmpSongs = JSON.parse(data)['song']
        for each(var song in tmpSongs) {
            song.picture = song.picture.replace(/\\/g,'')
            song.album = song.album.replace(/\\/g,'')
            song.url = song.url.replace(/\\/g,'')
            //TODO 统一数据格式的点
            songs[song.sid] = song
            if (song.like=='1'){
                cloneData(song)
                flg = true;
            } 
            DBRUtil.log2("shamDataProcessor : " + song.title +" | "+ song.artist)
        }
        if(flg) persistData()
    }
    
    this.isNeedReload = function(crtRID, adjustableFlg, url){
    	if(overMyListFlg){
            overMyListFlg = false
            favFlg = false
            mylist = []
            return 1
        }
        // 红心歌单
        if(mylist && mylist.length>0 && url.indexOf('type=e')>-1){
        	pop()
           return mylist.length>0?1:2
		}
        
		// 调教豆瓣电台
		if(crtRID==0 && adjustableFlg && url.indexOf('.mp3')>-1){
		     return 1
		}
    }
    
    function pop(){
	   mylist.pop()
       if(favFlg){
    	   mylist.push(getRandomSong())
       }
    }
    
    this.dataProcessor =function (data,shamData,songs){
//        DBRUtil.log2("dataProcessor : " + shamData)
        // 使用红心歌单的时候不替换响应
        if(mylist && mylist.length>0){
            if(/\[\{/.test(data)){
                var song = JSON.parse(DBRUtil.rstr(data.substring(data.indexOf('[{')+1,data.indexOf('}')+1)))
//                 DBRUtil.log2(data.substring(data.indexOf('[{')+1,data.indexOf('}')+1))
                 song.picture = song.picture.replace(/\\/g,'')
                 song.album = song.album.replace(/\\/g,'')
                 song.url = song.url.replace(/\\/g,'')
//                 song.like = '1'
                 songs[song.sid] = song
           }
           return data 
        }
        if(/\}\]\}$/.test(data)){
            return shamData
        }else{
            return " "
        }
    }
   
    this.getRadioName = function getRadioName(){
        return "豆瓣电台"
    }
    
    this.shamReplayDataProcessor =  function(t){
         var i = JSON.stringify(songInfo)
         var idx = t.indexOf('[{'), idx2 = t.indexOf('}')
         t = t.substring(0, idx + 1) + i + t.substring(idx2 + 1)
        return t
    }
    
    this.getCheckURL = function(){
        return "http://www.douban.com/mine"   
    }
    
    this.checkLogin = function(txt,flag,handle){
        if (txt.indexOf('<h1>登录豆瓣</h1>') > -1 || flag == true) {
            DBRUtil.alert(DBRUtil.GSA('nologin4sina'));
            DBRUtil.openPage(DBRUtil.PAGE_DOUBAN)
            handle("1","0")
            new HashMap()
            return false
        }
        return true
    }
    
    this.setPatternString = function(pattern,cid){
        var that = this;
        return DBRUtil.setPatternString(pattern,{
            radio:that.getRadioName(),
            artist:songInfo.artist,
            album:songInfo.albumtitle,
            title:songInfo.title,
            mp3url:genShareLink(songInfo,cid)
        })
        
    }
	
	this.getShareLink = function(cid){
		return genShareLink(songInfo,cid)
	}
    
    this.getAlbumPic = function(fn){
        var file = DBRUtil.getFile2('tmp.jpg')
        DBRUtil.downloadFile(songInfo.picture.replace('mpic','lpic'),file,fn,true)
    }

	this.getSongInfo = function(){
		return songInfo
	}
	
	this.clearModeData = function(){
		aamode = null
	}
	
	this.setModeData = function(data){
		aamode = data
	}
	
	this.setFavChannel = function(name,data){
		favName = name	
		favFlg = true;
		favList = data
		mylist = [getRandomSong()]	
		//alert(aamode[0])
	}
	
	function getRandomSong(){
		var n =  DBRUtil.getRandomNum(favList.length)	
		return favList[n]
	}
	
	this.artistFilter = function(element){
		if(aamode){
			if(!element) return false
			var elm = DBRUtil.SongInfoWarpper(element)
			return DBRUtil.Simplized(elm.getArtist()).indexOf(DBRUtil.Simplized(aamode.name)) != -1;
		}else{
			return true;
		}
	}
}
