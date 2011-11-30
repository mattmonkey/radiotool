/**
 *  处理升级或者第一次安装
 */
setTimeout(function (){
    // 首次安装打开帮助说明
    var flg = Application.prefs.getValue('extensions.doubanradio.firstrunflg',null);
	if (!flg) {
	    DBRUtil.openPage(DBRUtil.PAGE_HELP)
		setTimeout(function(){
			// 新手提示
			DBRUtil.alert(DBRUtil.GSC('firstrun'),100000)
		},4000)
		Application.prefs.setValue('extensions.doubanradio.firstrunflg',true);
	}
    
    // 打开版本说明页面
    AddonManager.getAddonByID('doubanradio@mattmonkey', function(addon){
		try{
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		Components.utils.import("resource://gre/modules/Services.jsm");
		var vc = Services.vc,
			curtVersion = addon.version,
			betaFlg = curtVersion.indexOf('beta') >= 0 ,
			param = betaFlg?'versionrec2':'versionrec'
			versionRec = DBRUtil.getPref(param, betaFlg?'0.1beta1':'0.1.0'),			
			release_url = betaFlg?DBRUtil.PAGE_RELEASE2:DBRUtil.PAGE_RELEASE
		
		DBRUtil.log2("current version：" + curtVersion)
		DBRUtil.log2("older version：" + versionRec)
		// 大于当前版本打开升级说明页
		// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIVersionComparator
        if (vc.compare(curtVersion,versionRec) > 0) {
			DBRUtil.log2('opening releasenote page')
			gBrowser.selectedTab = gBrowser.addTab(release_url)
            DBRUtil.setPref(param, curtVersion)
        }
		if(DBRUtil.getPref('followflg')){
			if(confirm(DBRUtil.GSC('follow'))){
				DBRUtil.openPage(DBRUtil.PAGE_FOLLOW)
			}
			DBRUtil.setPref('followflg',false)
		}
		 }catch(e){alert(e)}
     })
}, 5000)

