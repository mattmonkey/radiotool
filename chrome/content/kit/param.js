// 版本说明
var PAGE_RELEASE = 'http://alphatown.douban.com/widget/notes/2420702/note/144551179/';
var PAGE_RELEASE2 = "http://alphatown.douban.com/widget/notes/2420702/note/147829270/";
// 快捷方式
var PAGE_SHORTCUT = 'http://alphatown.douban.com/widget/notes/2420702/note/144533317/';
// 授权说明
var PAGE_CALLBACK = "http://alphatown.douban.com/widget/notes/2420702/note/144563580/";
// 常见故障
var PAGE_ERROR = "http://alphatown.douban.com/widget/notes/2420702/note/144564427/";
// 帮助说明
var PAGE_HELP = 'http://alphatown.douban.com/widget/photos/2420683/';
// 统计页面
var PAGE_BAIDU_LYRIC = "http://mp3.baidu.com/m?f=ms&tn=baidump3lyric&ct=150994944&lf=2&rn=10&lm=-1&word=";
var PAGE_DOUBAN = "http://www.douban.com/";
var PAGE_RENREN = "http://www.renren.com";
var PAGE_MUSICHOME = "http://music.douban.com/mine";
var DEFAULT_CHATROOM = "http://alphatown.douban.com/widget/chat/3095946";
var PAGE_CHATROOMLIST = "http://www.douban.com/note/149009567/";
var PAGE_CHATROOM = "http://alphatown.douban.com/117738/";
var PAGE_LOVEWALL = "http://alphatown.douban.com/j/widget/wall/3171871/add_post";
var PAGE_HATEWALL = "http://alphatown.douban.com/j/widget/wall/3171834/add_post";
var PAGE_DONATE = "https://lab.alipay.com/p.htm?id=2011052500205903";
var PAGE_FOLLOW = "http://www.douban.com/people/doubanradiotool/";
var PAGE_MXLIST = 'http://www.douban.com/note/156629759/'
var PAGE_REPOSITORY = 'http://www.douban.com/note/'

// 获取GBK
var PAGE_BAIDU_GB = "http://www.baidu.com/s?ie=utf-8&wd=";
var PAGE_SINA = "http://music.sina.com.cn/yueku/";
var PAGE_GROUP = "http://www.douban.com/group/343632/";

var PROC_LINK = "openlink";
var PROC_NEG = "negative";
var PROC_CLR = "clear";

var NOTIFY_MSG = "douban_radio_msg";
var NOTIFY_LYRIC = "douban_radio_mp3_lyric";
var NOTIFY_STATUS = "douban_radio_status";

// 界面参数，放一起我好改啊
var UI_FINDLYRIC  = "chrome://doubanradio/content/findlyric.xul";
var UI_AALIST  = "chrome://doubanradio/content/aalist.xul";
var UI_FINDLYRIC_PARAM2 = ["modal,dialog,centerscreen,width=400,height=200"];
var UI_FINDLYRIC_PARAM =  ["modal,dialog,centerscreen,width=400,height=600"];
var UI_MYLIST = "chrome://doubanradio/content/mylist.xul";
var UI_MYLIST_PARAM = ["modal,dialog,centerscreen,width=400,height=600"];
var UI_SONGLIST = "chrome://doubanradio/content/listeditor.xul";
var UI_SONGLIST_PARAM = ["modal,dialog,centerscreen,width=400,height=600"];
var UI_WINDOWLYRIC = "chrome://doubanradio/content/windowlyric.xul";
var UI_WINDOWLYRIC_PARAM = ["width=700,height=200"];   
var MODE_MUSICIAN = "context=channel:0|musician_id:" ;
var MODE_ALBUM = "context=channel:0|subject_id:";

var UID_STATUSBAR = 'dbr_sbp_container';
var UID_STATUSBAR2 = 'status-bar';
var UID_URLBAR = 'urlbar-icons';

// 内部图片的存放点        
var ICO_PREFIX = 'chrome://doubanradio/skin/';


// 豆瓣我说 豆瓣开放平台
var oauth_consumer_secret_douban = "a2f34af6dce0d3b8";
var oauth_consumer_key_douban = "0475e13ba7dfc2150d61a3b2f79f463f";
var request_token_uri_douban = "http://www.douban.com/service/auth/request_token";
var authorization_uri_douban = "http://www.douban.com/service/auth/authorize?oauth_token=";
var access_token_uri_douban = "http://www.douban.com/service/auth/access_token";
var api_say_douban = "http://api.douban.com/miniblog/saying";

// 新浪围脖  新浪开放平台
var oauth_consumer_secret_sina = "641bebf17773f734b37ac6b800c7b789";
var oauth_consumer_key_sina = "1504462621";        
var request_token_uri_sina = "http://api.t.sina.com.cn/oauth/request_token";
var authorization_uri_sina = "http://api.t.sina.com.cn/oauth/authorize?oauth_token=";
var access_token_uri_sina = "http://api.t.sina.com.cn/oauth/access_token";
var api_say_sina = "http://api.t.sina.com.cn/statuses/update.json";
