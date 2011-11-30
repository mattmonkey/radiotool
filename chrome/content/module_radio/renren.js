DBRUtil.RenRenMoudle = function (){
    var url_love = 'http://music.renren.com/fm/favorites/add/';
    var url_trash = 'http://music.renren.com/fm/remove/';
    var url_unlove = 'http://music.renren.com/fm/favorites/remove/';    
    var url_count = 'http://music.renren.com/fm/list/favorites?curpage=0'
   
    var channelInfo = JSON.parse(DBRUtil.getPref('channel_renren'))
    var step = 0 ;
    var songInfo;
    this.ico= 'renren.jpg'

    this.logged = false
    // 清除临时数据
    this.clearTmpData = function(){
        step = 0;
    }
        
    // 返回MP3文件名    
    this.getMusicFileName = function(){
        return songInfo.artistName + '-' + songInfo.name+'.mp3';
    }
    
    // 返回歌词查询参数
    this.getLyricParam = function(){
        return [songInfo.name,songInfo.artistName,songInfo.albumName];
    }
    // 返回歌词查询参数
    this.getLyricParam2 = function(){
        return {title:songInfo.name,artist:songInfo.artistName,album:songInfo.albumName};
    }
    
    // 标记喜欢   
    this.getLoveURL = function(){
        return url_love + songInfo.id 
    }
    
    // 标记不喜欢
    this.getUnLoveURL = function(){
        return url_unlove + + songInfo.id
    }
    
    // 标记讨厌
     this.getTrashURL = function(cid){
        return url_trash + songInfo.id + '/' + cid
    }
    
    // 电台链接
    this.getRadioUrl = function(){
        return 'http://music.renren.com/fm';
    }
    
    // 标记喜欢
    this.love = function(flg){
        songInfo.fav = flg
        
    }
    
    // 是否喜欢
    this.isLoved = function(){
         return songInfo.fav
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
        return songInfo.name
    }
    
    // 对应专辑链接
    this.getAlbumUrl = function getAlbumUrl(){
       return songInfo?"http://guide.renren.com/guide#//music/song/"+songInfo.id:""
    }
    
    // 对应频道链接
    this.getPlayListUrl = function(cid){
            return 'http://music.renren.com/fm/radio/'+cid
    }
    
    // tooltip注入用html
    this.getTooltipHtml = function(crtCID){
            return DBRUtil.GSH('renren_albuminfo',[songInfo.name,
                                                    songInfo.artistName,
                                                    songInfo.albumName,
                                                    songInfo.albumSrc.replace(/\\/g, ''),
                                                    channelInfo['C' + crtCID]])
    }
    
    // 换歌提示数据
    this.getPopupParam = function(){
        var image = songInfo.albumSrc.replace(/\\/g, '');
        var songTitle = songInfo.name;
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
       return url=='http://music.renren.com/fm'
    }
    
    // 判断是否是歌曲
    this.isMusic = function(url){
        return url.indexOf('.mp3') > -1
    }
    
    // 截取音乐ID并且设置模块的当前歌曲
    this.getMusicId = function(url,songs){
        var mp3id = url.match(/m\d*\_/g)[0].replace(/(m|\_)/g,"");
        songInfo = songs[mp3id]
        if(!songInfo) throw "list over"
        return mp3id
    }
    
    this.isAD = function(element, index, array){
         return /^\d{1,}/.test(element['sid']);
    }
    
    this.rstr2 = function(content){
        var t = JSON.parse(content)
        for each(var song in t.songs){
            song.name = DBRUtil.rstr3(song.name)
            song.artistName = DBRUtil.rstr3(song.artistName)
            song.albumName = DBRUtil.rstr3(song.albumName)
        }
        return JSON.stringify(t.songs)
    }
    
    this.genSongList = function(list){
        return '{"songs":' + list + "}"
    }    
    
    this.shamDataProcessor = function (data,songs){
        var tmpSongs = JSON.parse(data)['songs']
        for each (var s in tmpSongs) {
            songs[s['id']] = s
        }
    }
    
    this.dataProcessor = function(data,shamData){
        if (step ==2) return data
        if(/\"songs[\n\r\s\S]*\}\]/.test(data)){
            step = 2;
            return data.replace(/\"songs\"[\r\n\s\S]*\}\]/g,'\"songs\":' + shamData)
        }else if(/\"songs[\n\r\s\S]*$/.test(data)){
            step  = 1;
            return data.replace(/\"songs\"[\n\r\s\S]*$/," ");
        }else if(/^[\n\r\s\S]*\}\]/.test(data) && step ==1){
            step = 2
            return data.replace(/^[\n\r\s\S]*\}\]/,'\"songs\":' + shamData);
        }
        return data;  
    }
    
    this.getRadioName = function getRadioName(){
        return "人人电台"
    }
    
    this.shamReplayDataProcessor =  function(t){
         var i = JSON.stringify(songInfo)
         var idx = t.indexOf('[{'), idx2 = t.indexOf('}')
         t = t.substring(0, idx + 1) + i + t.substring(idx2 + 1)
        return t
    }
    
    this.getCheckURL = function(){
        return "http://music.renren.com/fm"   
    }
    
    this.checkLogin = function(txt,flag){
        if (txt.indexOf('未登录') > -1 || flag == true) {
            DBRUtil.alert(DBRUtil.GSA('nologin'));
            DBRUtil.openPage(DBRUtil.PAGE_RENREN)
            return false
        }
        return true
    }
    
    this.setPatternString = function(pattern,cid){
        var that = this;
        return DBRUtil.setPatternString(pattern,{
            radio:that.getRadioName(),
            artist:songInfo.artistName,
            album:songInfo.albumName,
            title:songInfo.name,
            mp3url:that.getAlbumUrl()
        })
    }
    
     this.getAlbumPic = function(fn){
        var file = DBRUtil.getFile2('tmp.jpg')
        DBRUtil.downloadFile(songInfo.albumSrc,file,fn,true)
        
    }
	
	this.getSongInfo = function(){
		return songInfo
	}
}
