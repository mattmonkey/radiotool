/**
 * 改造豆瓣与音乐有关的网页，使之整合进电台工具
 */
(function(){
	var PLAY_LINK ="&nbsp;<a class='doubanradio' title='使用小明电台' ssid={ssid} sid={sid} href='javascript:void(0)'>试听</a>&nbsp;";
	var DOWNLOAD_LINK ="&nbsp;<a id='downloadalbum' title='使用小明电台' albumdata={albumdata}  href='javascript:void(0)'>==>下载专辑 <==</a>&nbsp;";
	var FAV_LINK ="&nbsp;<a class='redlist' title='添加到红心歌单' ssid={ssid} sid={sid} href='javascript:void(0)'>收藏</a>&nbsp;";
	var DEEP_LIMIT = 5
	var DOUBAN = 'douban.com'
	var data ={
		'list':{
			check:null,
			scope:['http://music.douban.com/musician/',
				'http://music.douban.com/subject/'],
			process:genAdditionalDiv,
			evtName:"DoubanPlayEvent",
			attrs:['pid','name','ptype']
		},
		'play':{
			check:null,
			scope:['http://alphatown.douban.com/117738',
				'http://alphatown.douban.com/widget/wall/3171834',
				'http://alphatown.douban.com/widget/wall/3171871'],
			process:genPlayButton,
			evtName:"DoubanWallPlayEvent",
			attrs:['sid','ssid']		
		},
		'search':{
			check:null,
			scope:['http://music.douban.com/subject_search'],
			process:genPlayButtonAtSearch,
			evtName:"DoubanPlayEvent",
			attrs:['pid','name','ptype']
		},
		'cover':{
			check:null,
			scope:['http://music.douban.com/mine',
				/http\:\/\/music\.douban\.com\/people\/[0-9a-zA-Z]{1,}\/$/],
			process:genPlayDiv,
			evtName:"DoubanPlayEvent",
			attrs:['pid','name','ptype',"check_url"]			
		},
		'songlist':{
			scope:[/http\:\/\/music\.douban\.com\/subject\/\d{1,}\//],
			process:genCoverPlayListLink,
			evtName:"DoubanWallPlayEvent",
			attrs:['sid','ssid'],
			asyn:true		
		},
		'personal_album':{
			check:null,
			scope:[/http\:\/\/music\.douban\.com\/people\/[0-9a-zA-Z]{1,}\/(do|wish|collect)/],
			process:genPlayDiv2,
			evtName:"DoubanPlayEvent",
			attrs:['pid','name','ptype',"check_url"]			
		},
		'personal_musicians':{
			check:null,
			scope:[/http\:\/\/music\.douban\.com\/people\/[0-9a-zA-Z]{1,}\/musicians/],
			process:genPlayDiv3,
			evtName:"DoubanPlayEvent",
			attrs:['pid','name','ptype',"check_url"]	
		},
		'album':{
			check:null,
			scope:[/http\:\/\/www\.douban\.com\/group\/topic/],
			process:genAlbumPlayLink,
			evtName:"DoubanWallPlayEvent",
			attrs:['list','sid','ssid']	
		},
		'download':{
			evtName:"DoubanDownloadEvent",
			attrs:['albumdata']	
		},
//		'redlist':{
//			evtName:"DoubanAddListEvent",
//			attrs:['ssid','sid']	
//		}
	}
	
	var defautltURLCheck = checkWebPage
	
    function initPageProcessor(){	
		gBrowser.addEventListener("DOMContentLoaded", function(event){
			if (event.originalTarget instanceof HTMLDocument) {
				var doc = event.originalTarget
				var href = doc.location.href
				// 只处理豆瓣网
				if(!checkDomain(href)) return
				for (var processor in data){
					// 验证是否符合修改条件
					var checkFN = data[processor].check?data[processor].check:defautltURLCheck
					var rslt = checkFN(href,data[processor].scope)
					if(rslt){
						// 获取修改过的元素
						if(!data[processor].asyn){
							var elms = data[processor].process(doc)||[]
							elmsProcessor(elms,data,processor)
						}else{
							data[processor].process(doc,data,processor,elmsProcessor)
						}
					}
				}
			}
		}, true);
	}
	
	function elmsProcessor(elms,data,processor){
		if(!elms) return;
		for(var idx=0;idx<elms.length;idx++){
			// 加入触发事件
			(function(elm,processor){
				try {
					elm.addEventListener('click', function(e){
						// 分发事件
						dispatchEvent(e, data[processor].evtName, data[processor].attrs)
					}, false)
				}catch(e){}
			})(elms[idx],processor)
		}
	}
	
	function checkWebPage(href,scope){
		for each(var url in scope){
			if((typeof url) =='string'){
				if(href.indexOf(url)==0){
					return true
				}
			}else{
				if(url.test(href)){
					return true
				}
			}
		}
		return false
	}
	
	// 音乐人、专辑
	function genAdditionalDiv(doc){
		var name = doc.body.getElementsByTagName('h1')[0].textContent.trim()
		var div = doc.body.getElementsByClassName('aside')[0]
		var param = {} 
		var content = div.innerHTML;
		if(content.match(/subject_id\:\d{1,}/g)){
			param.ptype = DBRUtil.MODE_ALBUM;
			param.pid = content.match(/subject_id\:\d{1,}/g)[0].split(':')[1]
			param.name  = name
		}else if(content.match(/musician_id\:\d{1,}/g)){
			param.ptype = DBRUtil.MODE_MUSICIAN;
			param.pid = content.match(/musician_id\:\d{1,}/g)[0].split(':')[1]
			param.name  = name
		}
		if(!param.ptype) return;
		var div = doc.body.getElementsByClassName('aside')[0]
		var _div = '<div class="gray_ad"><h2>小明牌豆瓣电台工具</h2>从这里<a pid="'+param.pid+'" ptype ="'+param.ptype+'" name ="'+param.name+'" id="doubanradio" href="javascript:void(0)">播放</a>音乐<div id="doubanradio_playlist"></div></div>'
		div.innerHTML = _div  + div.innerHTML;			
		return [doc.getElementById('doubanradio')]	
	}
	
	// 留言墙
	function genPlayButton(doc){
		var contents = doc.body.getElementsByClassName('content')
		for each(var content in contents){
			try{
				if(content && content.childNodes){
					var span = content.childNodes[3].innerHTML
					var playInfo = getPlayInfo(span);
					if(playInfo){
						var link =  genPlayLink(playInfo)
						content.childNodes[3].innerHTML = span.replace(/http\:\/\/.*/g,"") + link
					}
				}
			}catch(e){DBRUtil.log2(e)}
		}
		return doc.getElementsByClassName('doubanradio')
	}
	
	// 播放自选专辑
	function genAlbumPlayLink(doc){
		var content = doc.body.getElementsByClassName('topic-doc')[0].childNodes[3]
		var albumData = content.innerHTML.match(/\{\"content\".*\"version\"\:1\}/)
		content.innerHTML = content.innerHTML.replace(/\{\"content\".*\"version\"\:1\}/,"")
		var rslt = '</br>数据不合法'
		try {
			if(albumData){
				var albumData = JSON.parse(albumData[0])
				var verify = DBRUtil.genSignatur2((albumData.content))
				if(albumData.content && albumData.verify && (albumData.verify  == verify)){
					rslt =  "<h3><a class ='doubanradio' list ='" + albumData.content +"' herf='javascript:void(0)'>全部播放</a></h3>" 
					var songs = JSON.parse(albumData.content)
					for each(var song in songs){
						rslt+='</br>' + song.title +'-' + song.artist+ genPlayLink(song)	
					}
				}	
			}else{
				rslt = ""
			}
		}catch(e){}
		content.innerHTML += rslt
		return doc.getElementsByClassName('doubanradio')
	}
	
	// 修改音乐检索页面
	function genPlayButtonAtSearch(doc){
		var content = doc.body.querySelectorAll('a.start_radio_musician,a.start_radio')
		for each(var a in content){
			try {
				var href = a.getAttribute('href')
				var ptype = a.getAttribute('class')=="start_radio_musician"?DBRUtil.MODE_MUSICIAN: DBRUtil.MODE_ALBUM
				var idx = a.getAttribute('class')=="start_radio_musician"? 1: 0
				a.setAttribute('href', "javascript:void(0)")
				var name = a.parentNode.childNodes[idx].textContent.trim()
				a.setAttribute('target', "");
				a.setAttribute('pid', href.slice(href.lastIndexOf(':') + 1));
				a.setAttribute('title', "使用小明电台收听")
				a.setAttribute('ptype', ptype);
				a.setAttribute('name', name);
			}catch(e){}			
		}
		return content
	}
	
	function genCoverPlayListLink(doc,data,processor,elmsProcessor){
		var name = doc.body.getElementsByTagName('h1')[0].textContent.trim()
		var div = doc.body.getElementsByClassName('aside')[0]
		var param = "http://douban.fm/j/mine/playlist?type=n&channel=0&context=channel:0|"
		var content = div.innerHTML.match(/subject_id\:\d{1,}/g);
		if(content){
			param += content[0]
		}else{
			return ;
		}
		var songNames = []
		var songNodes = []
		var nodes =doc.body.getElementsByTagName("tr") 
		for(var idx = 1;idx <nodes.length;idx++){
			songNodes.push(nodes[idx].childNodes[0])
			songNames.push(nodes[idx].childNodes[0].textContent)
		}
		fetch(0)
		var title = doc.body.getElementsByTagName('h1')[0].textContent.trim()
		var albumData = [];
		var listDiv = doc.getElementById('doubanradio_playlist');
		listDiv.innerHTML += DOWNLOAD_LINK + "<br/>";
		function fetch(deep){
			DBRUtil.sendXHR(param,null,function(txt){
				// 转换成json数据
				var songInfos = JSON.parse(txt).song
				// 比对
				for each(var songInfo in songInfos){
					var rslt = songNames.indexOf(songInfo.title)
					// 歌名一致
					if(rslt > -1){
						// 添加播放链接
						var link = genPlayLink({sid:songInfo.sid,ssid:songInfo.ssid})
						albumData.push(songInfo)
						songNodes[rslt].innerHTML += link
						listDiv.innerHTML+= songInfo.title + link + '<br/>'
						songNames = clearArray(songNames,rslt)
						songNodes = clearArray(songNodes,rslt)
					}
					
				}
				// 判断是否继续	
				if(songNames.length >0 && deep<DEEP_LIMIT){
					fetch(deep+1)	
				}else {
					//TODO 完整收录的把数据保存下来
					var elms = doc.getElementsByClassName('doubanradio')
					var elms2 = [doc.getElementById('downloadalbum')]
					elms2[0].setAttribute('albumdata',JSON.stringify(albumData))
					elmsProcessor(elms2,data,"download")
//					alert(title+JSON.stringify(tmpData))
					elmsProcessor(elms,data,processor)
				}
			})	
		}
	}
	
	function clearArray(data,idx){
		data[idx] = null
		var tmpArray = []
		for each(var d in data){
			if(d) tmpArray.push(d)
		}
		return tmpArray
	}
	
	function genPlayDiv(doc){
		return genFloatDivButton(doc)
	}
	
	function genPlayDiv2(doc){
		return genFloatDivButton(doc,'a.nbg')
	}
	
	function genPlayDiv3(doc){
		return genFloatDivButton(doc,'div.pic')
	}
	
	function genFloatDivButton(doc,className){
		// 加入一个浮动div
		var div ="<div id='dbr_div_play' style='position: absolute; display:none; width:180;top:0;left:0'><input type='button' id='dbr_btn_play' value='播放'/></div>"
		doc.body.innerHTML+=div
		// 找出所有cover图片，加入事件
		var covers = doc.body.querySelectorAll(className?className:'a.cover')
		for each(var a in covers){
			try {
				a.addEventListener('mouseover', function(e){
					if(e.target.tagName !=='IMG') return
					var rect = e.target.getBoundingClientRect()
					var top = parseInt(rect.top+doc.documentElement.scrollTop)
					var left = parseInt(rect.left + rect.width)
					var div = doc.getElementById('dbr_div_play')
					// 设置按钮位置
					div.style.left = left + 'px'
					div.style.top = top+ 'px'
					// 设置按钮事件参数					
					var btn = doc.getElementById('dbr_btn_play')
					var node = e.target.parentNode
					var href= node.getAttribute('href')
					var ptype = /subject/.test(href)?DBRUtil.MODE_ALBUM: DBRUtil.MODE_MUSICIAN
					var name =className?node.getAttribute('title'):e.target.getAttribute('alt')
					// className是个人音乐主页的话为空，需要做截断处理
					if (!className) {
						if (ptype == DBRUtil.MODE_ALBUM) {
							name = name.split('-')[1].trim()
						}
					}
					btn.setAttribute('pid',href.match(/\/\d{1,}\//)[0].slice(1,-1))
					btn.setAttribute('ptype',ptype)
					btn.setAttribute('name',name)
					btn.setAttribute('check_url',href)
					div.style.display='block'
				}, false)
			}catch(e){}
		}
		// 点击后消失
		doc.getElementById('dbr_btn_play').addEventListener('click',function(e){
			e.target.parentNode.style.display='none'
		},false)
		return [ doc.getElementById('dbr_btn_play')]
	}
	
	function genPlayLink(param){
		var link = PLAY_LINK
		for(var k in param){
			link = link.replace('{'+k+'}',param[k])
		}
		return link
	}

	function dispatchEvent(e,evtName,attrs){
		var element = document.createElement("DoubanPlayEventElement");
		for each(var attr in attrs){
			element.setAttribute(attr, e.target.getAttribute(attr));
		}	
		document.documentElement.appendChild(element);
		var evt = document.createEvent("Events");
		evt.initEvent(evtName, true, false);
		element.dispatchEvent(evt);		
	}
	
	function checkDomain(href){
		return href.indexOf(DOUBAN)> -1
	}
	
	function getPlayInfo(msg){
		var linkInfo = msg.match(/start\=\d{1,}g.{4}g1/g)
		if (linkInfo) {
			linkInfo = linkInfo[0].slice(6, -2)
			var rslt = {}
			var idx = linkInfo.indexOf('g')
			rslt.sid = linkInfo.substring(0,idx)
			rslt.ssid = linkInfo.slice(idx+1)
			return rslt
		}
	}
	
	window.addEventListener("load",initPageProcessor ,false)
	
	window.addEventListener("DoubanPlayEvent", function(e) {
		if((douban_radio.radio.getRID() != 0 )||( douban_radio.radio.isOpen() == false)){
			DBRUtil.alert(DBRUtil.GSA('dontopendoubanradio'))
		}else{
			if(e.target.getAttribute('check_url')){
				DBRUtil.sendXHR(e.target.getAttribute('check_url'),null,function(txt){
					if(txt.indexOf('class="start_radio"')>0){
						douban_radio.openSongListEditor2(e.target.getAttribute('name'),e.target.getAttribute('pid'),e.target.getAttribute('ptype'),true)
					}else{
						DBRUtil.alert(DBRUtil.GSC('noalbummode'))
					}
				})
			}else{
				douban_radio.openSongListEditor2(e.target.getAttribute('name'),e.target.getAttribute('pid'),e.target.getAttribute('ptype'),true)
			}
		}
	}, false, true); 
	
	window.addEventListener("DoubanDownloadEvent", function(e) {
		setTimeout(function(){
			douban_radio.donwloadAlbum(JSON.parse(e.target.getAttribute('albumdata')),0)
		},50)
	}, false, true); 
	
//	window.addEventListener("DoubanAddListEvent", function(e) {
//		var ssid = e.target.getAttribute('ssid');
//		var sid = e.target.getAttribute('sid');
//		var list = JSON.parse(DBRUtil.getPref('mylist'));
//		DBRUtil.setPref('mylist',JSON.stringify()) 
//	}, false, true);
	
	window.addEventListener("DoubanWallPlayEvent", function(e) {
		if((douban_radio.radio.getRID() != 0 )||( douban_radio.radio.isOpen() == false)){
			DBRUtil.alert(DBRUtil.GSA('dontopendoubanradio'))
		}else{
			var list = e.target.getAttribute('list')
			if(list){
				var rslt = []
				list = JSON.parse(list)
				for each(var song in list){
					rslt.push({ssid:song.ssid,sid:song.sid,title:song.title,artist:song.artist})
				}
				douban_radio.playSong(rslt)
			}else{
				var ssid = e.target.getAttribute('ssid')
				var sid = e.target.getAttribute('sid')
				douban_radio.playSong([{ssid:ssid,sid:sid}])
			}
		}		
	}, false, true);
	
	
	 
})()
