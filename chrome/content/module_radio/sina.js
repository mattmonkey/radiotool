DBRUtil.SinaMoudle = function (){
    var url_love = 'http://music.sina.com.cn/radio/port/webRadioCollectSong.php?songId={songId}&radioId={radioId}';
    var url_trash = 'http://music.sina.com.cn/radio/port/webRadioRmSong.php?songId={songId}&radioId={radioId}';
    var url_unlove = 'http://music.sina.com.cn/radio/port/webRadioRmCollectSong.php?songId={songId}&radioId={radioId}';    
    var url_count = 'http://music.sina.com.cn/shequ/mu_center/muc_mymusic.php'
    var channelInfo = JSON.parse(DBRUtil.getPref('channel_sina'))
    var songInfo;
    this.ico = 'sina.png'

    this.logged = false
    // 清除临时数据
    this.clearTmpData = function(){
    }
        
    // 返回MP3文件名    
    this.getMusicFileName = function(){
        return songInfo.artistName + '-' + songInfo.songName+'.mp3';
    }
    
    // 返回歌词查询参数
    this.getLyricParam = function(){
        return [songInfo.songName,songInfo.artistName,songInfo.albumName];
    }
    // 返回歌词查询参数
    this.getLyricParam2 = function(){
        return {title:songInfo.songName,artist:songInfo.artistName,album:songInfo.albumName};
    }
    
    // 标记喜欢   
    this.getLoveURL = function(cid){
        return DBRUtil.setPatternString(url_love,{songId:songInfo.songId,radioId:cid})
    }
    
    // 标记不喜欢
    this.getUnLoveURL = function(cid){
        return DBRUtil.setPatternString(url_unlove,{songId:songInfo.songId,radioId:cid})
    }
    
    // 标记讨厌
     this.getTrashURL = function(cid){
         return DBRUtil.setPatternString(url_trash,{songId:songInfo.songId,radioId:cid})
    }
    
    // 电台链接
    this.getRadioUrl = function(){
        return 'http://music.sina.com.cn/radio/play/index.php';
    }
    
    // 标记喜欢
    this.love = function(flg){
        songInfo.ifSaved = flg
    }
    
    // 是否喜欢
    this.isLoved = function(){
         return songInfo.ifSaved
    }
    
    this.getCountURL = function(){
        return url_count;
    }
    
    this.getChannelInfo = function(){
        return channelInfo;
    }
    
    this.getChannelName = function(crtCID){
        return channelInfo['C' + crtCID] + "频道"
    }
    
    this.getSongName = function(){
        return songInfo.songName
    }
    
    // 对应专辑链接
    this.getAlbumUrl = function getAlbumUrl(){
       return songInfo?"http://music.sina.com.cn/yueku/i/"+songInfo.songId+".html":''
    }
    
    // 对应频道链接
    this.getPlayListUrl = function(cid){
            return 'http://music.sina.com.cn/radio/port/webFeatureRadioList.php?id='+cid
    }
    
    // tooltip注入用html
    this.getTooltipHtml = function(crtCID){
        return DBRUtil.GSH('sina_albuminfo',[songInfo.songName,
                                                    songInfo.artistName,
                                                    songInfo.albumName,
                                                    songInfo.albumPic.replace(/\\/g, ''),
                                                    channelInfo['C' + crtCID]])
    }
    
    // 换歌提示数据
    this.getPopupParam = function(){
        var image = songInfo.albumPic.replace(/\\/g, '');
        var songTitle = songInfo.songName;
        var album = songInfo.albumName;
        var artist = songInfo.artistName;
        return [image,songTitle,artist+" :: " + album]
    }
    
    // 判断播放器是否出错
    this.isError = function(url){
        return url.indexOf('except') > -1
    }
    
    // 判断是否是歌单
    this.isList = function(url){
       return url.indexOf('webFeatureRadioList')>-1
    }
    
    // 判断是否是歌曲
    this.isMusic = function(url){
        return url.indexOf('.mp3') > -1
    }
    
    // 截取音乐ID并且设置模块的当前歌曲
    this.getMusicId = function(url,songs){
        var mp3id = url.match(/\d*\.mp3/g)[0].replace(/\.mp3/g,"");
        songInfo = songs[mp3id]
        if(!songInfo) throw "list over"
        DBRUtil.log2('mp3id : ' + mp3id)
        return mp3id
    }
    
    this.isAD = function(element, index, array){
         return /^\d{1,}/.test(element['songId']);
    }
    
    this.rstr2 = function(content){
        return content
    }
    
    this.genSongList = function(list){
        return '{"resultCode":1,"content":' + list + "}"
    }    
    
    this.shamDataProcessor = function (data,songs){
        var tmpSongs = JSON.parse(data)['content']
        for each (var s in tmpSongs) {
            s.albumPic.replace(/\\/,'')
            songs[s['songId']] = s
        }
    }
    
    this.dataProcessor = function(data,shamData){
        if(/\}\]\}$/.test(data)){
            return shamData
        }else{
            return " "
        }
    }
    
    this.getRadioName = function(){
        return "新浪电台"
    }
    
    this.shamReplayDataProcessor =  function(t){
         songInfo.albumPic.replace(/\//,'\\/')
         var i = JSON.stringify(songInfo)
         var idx = t.indexOf('[{'), idx2 = t.indexOf('}')
         t = t.substring(0, idx + 1) + i + t.substring(idx2 + 1)
        
        return t
    }
    
    this.getCheckURL = function(){
        return "http://t.sina.com"   
    }
    
    this.checkLogin = function(txt,flag){
        if (txt.indexOf('登录名') > -1 || flag == true) {
            DBRUtil.alert(DBRUtil.GSA('nologin'));
            DBRUtil.openPage(DBRUtil.PAGE_SINA)
            return false
        }
        return true
    }
    
    this.getAlbumPic = function(fn){
        var file = DBRUtil.getFile2('tmp.jpg')
        DBRUtil.downloadFile(songInfo.albumPic,file,fn,true)
    }
    
    this.setPatternString = function(pattern,cid){
        var that = this;
        return DBRUtil.setPatternString(pattern,{
            radio:that.getRadioName(),
            artist:songInfo.artistName,
            album:songInfo.albumName,
            title:songInfo.songName,
            mp3url:that.getAlbumUrl()
        })
    }
	
	this.getSongInfo = function(){
		return songInfo
	}
}

