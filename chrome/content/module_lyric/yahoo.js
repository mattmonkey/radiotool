var LyricEngineByYahoo = function(){};
extendsClass(LyricEngineByYahoo,LyricEngineBase);

LyricEngineByYahoo.prototype.searchLyric=function(content,multiFlg,fnc,fncErr){
	log2("DBRUtil.LyricEngineByYahoo search " + content)
	var content = encodeURIComponent(content)
	var url = 'http://music.yahoo.cn/s?q=' + content + '&m=0'

	this.max = 5;
	this.site = "http://music.yahoo.cn"
	this.search(url, this, multiFlg, fnc, fncErr)
}

// 解析网页，把有效歌词装入数组
LyricEngineByYahoo.prototype.dataProcessor = function(txt){
	var body = HTMLParser(txt)
	var sp = "$1|||";
	var tds = body.getElementsByClassName('bc5')
	var lyrics = [];
	for each(var td in tds){
		var content = td.textContent
		if (content && content.indexOf('[') >=0){ 
		    content = content.slice(content.indexOf('['))
		    content = content.replace(/[^\]]{1}(?=\[)/g,sp)
		    lyrics.push(content.split(sp))
		}
	}
	return lyrics	
}

// 解析网页，把歌词列表装入数组
LyricEngineByYahoo.prototype.getLyricList = function(txt){
	var list = txt.match(/\/lyric\?q=.*kdbid=\d*/g)
	return list	
}
