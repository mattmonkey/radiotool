var LyricEngineByYoudao = function(){};
extendsClass(LyricEngineByYoudao,LyricEngineBase);

LyricEngineByYoudao.prototype.searchLyric=function(content,multiFlg,fnc,fncErr){
	log2("DBRUtil.LyricEngineByYoudao search " + content)
	var searchStr = "http://mp3.youdao.com/search?q={1}&start=1&ue=utf8&keyfrom=music.page1&t=LRC&len=5"
	var content = encodeURIComponent(content)
	var url = searchStr.replace('{1}',content)
	
	this.max = 5;
	this.site = "http://mp3.youdao.com/";
	this.search(url, this, multiFlg, fnc, fncErr)
}

//解析网页，把有效歌词装入数组
LyricEngineByYoudao.prototype.dataProcessor = function(txt){
	txt = txt.split('<BR\/><BR\/>')[1];
	return [txt.split('<br\/>')];	
}

//解析网页，把歌词列表装入数组
LyricEngineByYoudao.prototype.getLyricList = function(txt){
	return txt.match(/lyric\?d\=\d{1,}/g)
}

