//          douban.com        renren.com        sina.com
//专辑链接      album
//分享ID    ssid              
//标示ID    sid               id                songId
//专辑名称      albumtitle        albumName         albumName
//歌手                artist            artistName        artistName
//发行公司      company 
//喜欢                like              fav               ifSaved
//专辑图片      picture           albumSrc          albumPic
//歌名：           title             name              songName
DBRUtil.DoubanBean = function(object){
	// 保留全部内容
	DBRUtil.SongBean.apply(this,[object])
	// 转换不同内容
	this._title = object.title
	this._album = object.albumtitle
	this._artist = object.artist
	this._uid = object.sid
	this._year = object['public_time']
	this._pic = object.picture
	this._mp3 = object.url
}

DBRUtil.RenrenBean = function(object){
	// 保留全部内容
	DBRUtil.SongBean.apply(this,[object])
	// 转换不同内容
	this._title = object.name
	this._album = object.albumName
	this._artist = object.artistName
	this._uid = object.id
	this._pic = object.albumSrc
	this._mp3 = object.url
}

DBRUtil.SinaBean = function(object){
	// 保留全部内容
	DBRUtil.SongBean.apply(this,[object])
	// 转换不同内容
	this._title = object.songName
	this._album = object.albumName
	this._artist = object.artist
	this._uid = object.songId
	this._pic = object.albumPic
}

DBRUtil.SongBean = function (object){
	for (var key in object){
		this[key] = object[key]		
	}
}

DBRUtil.SongBean.prototype.getTitle = function(){
	return this._title || ""
}
DBRUtil.SongBean.prototype.getAlbum = function(){
	return this._album || ""
}
DBRUtil.SongBean.prototype.getArtist = function(){
	return this._artist || ""
}
DBRUtil.SongBean.prototype.getMp3Url = function(){
	return this._mp3 || ""
}
DBRUtil.SongBean.prototype.getPic = function(){
	return this._pic || ""
}

DBRUtil.SongBean.prototype.getYear = function(){
	return this._year && this._year.slice(0,4) || ""
}

DBRUtil.SongBean.prototype.getDate = function(){
	return this._year && this._year || ""
}

DBRUtil.SongBean.prototype.getID = function(){
	return this._uid || ""
}

DBRUtil.SongBean.prototype.getMusicFileName = function(){
	return this._artist+"-"+this._title || ""
}