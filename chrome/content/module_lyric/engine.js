var LyricEngineBase = function(){}

LyricEngineBase.prototype.search = function(url,self, multiFlg, fnc, fncErr){
	sendXHR(url,null,function(txt){
		//获取歌词列表
		var lyricList = self.getLyricList(txt)
		// 没有找到歌词
		if(lyricList == null || lyricList.length ==0){
			log2("lyric list : "+0)			
			if(fncErr != null)fncErr();
			return;
		}
		log2("lyric list : "+lyricList.length)
		// 处理自动歌词和手动查找的情况
		if(multiFlg == false || multiFlg == null){
			lyricList.length = 1
		}else{
			lyricList.length = self.max
		}
		// 根据歌词列表，获取歌词
		for each(var lyricPage in lyricList){
			sendXHR(self.site+lyricPage,null,function(txt){
				// 解析有效歌词
				var lyrics = self.dataProcessor(txt)
				for(var cnt in lyrics){
					try {
						log2(lyrics[cnt])
						fnc(lyrics[cnt])
					}catch(e){
						log2(e)
					}
				}
			})
		}
	})	
}
