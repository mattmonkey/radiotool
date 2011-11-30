var ID3V1 = function(file,songInfo,comment){
	this.file = file
	// 生成标签
	this.genTag(songInfo,comment)
}

// 写标签
ID3V1.prototype.writeTag = function (){
	//TODO 应该可以只覆盖最后一部分的待改良
	var bytes = getFileBytes(this.file)
	bytes = bytes.slice(0,-128).concat(this.content)
	writeFile(this.file,bytes)
}

// 生成标签内容 
ID3V1.prototype.genTag = function(songInfo,comment){
	this.content = "TAG"
	this.content += fillChars(songInfo.getTitle(),30,'\0')
	this.content += fillChars(songInfo.getArtist(),30,'\0')
	this.content += fillChars(songInfo.getAlbum(),30,'\0')
	this.content += fillChars(songInfo.getYear(),4,'\0')
	this.content += fillChars(comment ,30,'\0')
	//TODO 豆瓣电台的话，可以通过api获取更完善的数据
	this.content += fcc(255) 
}


var fcc = function(c){
	return String.fromCharCode(c);
}

//ID3v2.3 实现 但是没想好流程
var ID3V23 = function(file,info,imageFile){
	var tags = []; 
	this.len = 0 ;
	this.content = '';
	this.file = file;
		
	// 歌手
	tags.push(new ID3V2Frame('TPE1',info.getArtist())) 
	// 标题
	tags.push(new ID3V2Frame('TIT2',info.getTitle()))
	// 专辑
	tags.push(new ID3V2Frame('TALB',info.getAlbum()))
	// 年代
	tags.push(new ID3V2Frame('TYER',info.getYear()))
	// 封面
	tags.push(new ID3V2Frame('APIC',imageFile))
	
	// 合计长度和组装标签帧
	for each(var f in tags){
		this.len += f.content.length
		this.content += f.content
	}
	
	// 生成ID3V2.3 [ID3][版本号][版本号][flag][size][标签帧]	
	this.content = 'ID3'+ fcc(3)+ fcc(0)+  fcc(0) +	this.getSize() + this.content
}

//写标签
ID3V23.prototype.writeTag = function (){
	//TODO 应该可以只覆盖最后一部分的待改良
	var bytes = getFileBytes(this.file)
	bytes = bytes.slice(this.content.length)
	bytes = this.content.concat(bytes) 
	writeFile(this.file,bytes)
}


//计算长度
ID3V23.prototype.getSize = function(len){
	var rslt = fcc((this.len >> 21) & 0x7F)
	rslt += fcc((this.len >>14 )& 0x7F)
	rslt += fcc((this.len >> 7) & 0x7F)
	rslt += fcc(this.len & 0x7F)
	return rslt
}

var ID3V2Frame = function(key,value){
	// FrameID[4]+ char Size[4]+ char Flags[2] + encoding[1] +content
	var rslt = key, sp = fcc(3)
	if(typeof value == 'string'){
		value = convertUTF8(value)
	}else{
		value = getFileBytes(value)
		sp = this.getPicString(value)
	}
	rslt += this.getSize(value.length+sp.length) + fcc(0) + fcc(0)
	rslt += sp + value
	this.content =  rslt
}

ID3V2Frame.prototype.getPicString = function(bytes){
	//TODO 判断类型
	// PNG 文件头标识 (8 bytes)   89 50 4E 47 0D 0A 1A 0A
	// JPEG 文件标识(2 bytes): 0xff, 0xd8 
	return fcc(3) + "image/jpg" +fcc(0)+fcc(3)+fcc(0)
}


ID3V2Frame.prototype.getSize = function (len){
	var rslt = fcc(len >> 24 & 0xFF)
 rslt += fcc(len >>16 & 0xFF)
	rslt += fcc(len >> 8 & 0xFF)
	rslt += fcc(len & 0xFF)
	return rslt
}
