Class('AppImageLoader', {
   single: true,
   timeout: 5000,// img load timeout
   fxTime: 800,// progress fx speed
   _style:[
        'z-index:20000;position:absolute;left:0;top:0;width:100%;height:100%;text-align:center;background-color:{1};',  
       'border:1px solid #333;width:200px;height:6px;overflow:hidden;margin:0 auto;text-align:left;position:relative;top:50%;',
       'width:0;height:5px;font-size: 0;color:#fff;text-align:center;'
   ],
   index: function (logo, bgColor){//默认为百度loading, 白色
      this._createNodes(logo, bgColor);
      this.loading = this.getNoop();
      this.end = this.getNoop();
   },
   _createNodes: function (logo, bgColor){//创建三个结构标签
        this.bgColor = bgColor || '#fff';
        this.logo = logo ? logo : '../app-loading.gif';//defautl logo
        this.body = this.createNode('div', document.body).setStyle(this._style[0].format(bgColor));
        this.outbar = this.createNode('div', this.body).setStyle(this._style[1]).addClass('app-loadout').show(logo);//baidu不显示进度条
        this.bar = this.createNode('div', this.outbar).setStyle(this._style[2]).addClass('app-loadin').show(logo);
   },
   showLogo: function (){
      this.body.setStyle('background:' +this.bgColor +' url(' + this.logo + ') no-repeat 50% 36%;	')
   },
   load: function (imgs){//加载方法
       this.body.show();
       this.bar.setStyle('width', '0');
       var gid = this.getGuid();
       this.imgReady(imgs, function (len, count, ok, err, img){
           var scale = Math.ceil(count/len*100);
           var old = this.getInt(this.bar.getStyle('width'));
           this.loading(len, count, ok, err, img);
           if (img.getAttribute('src', 3).indexOf(this.logo) > -1) {//img.src for IE is auto absolute url
                this.showLogo()
           }
           this.fx(function (f, i){
               this.bar.setStyle('width', f(old, scale)+'%')
           },{time:this.fxTime, mx: gid, end: function (){
               if (len == count) {this._end(ok, err)}
           }})      
       })
   },
   tween:function(pos){//惯性
       if ((pos) < (1/2.75)) {
           return (7.5625*pos*pos);
       } else if (pos < (2/2.75)) {
           return (7.5625*(pos-=(1.5/2.75))*pos + .75);
       } else if (pos < (2.5/2.75)) {
           return (7.5625*(pos-=(2.25/2.75))*pos + .9375);
       } else {
           return (7.5625*(pos-=(2.625/2.75))*pos + .984375);
       }
   },
   _end: function (ok, err){//结束的动画
        var G = this, body = this.body.one();
        G.outbar.hide();
        if (this.lastFx !== false) {
            G.fx(function (f, i){
                body.style.backgroundPosition = '50% ' + f(30, 50)+ '%'
            },{end: function (){
                 setTimeout(function() {
                      G._doEnd(ok, err)    
                 },800)             
            }, tween: G.tween});            
        }else{
            G._doEnd(ok, err)            
        }
   },
   _doEnd: function (ok, err){//加载完成后隐藏背景层
        if (this.end(ok, err) !== false) {
            this.body.hide()
        } 
   },
   imgReady: function (urls, loading, error){//加载器
        var len, err = 0, ok = 0, count = 0, G = this;
       if(!urls){urls = []}
       if (this.isString(urls)) {urls = urls.trim() == '' ? [] : urls.split(',')}// if urls is null
       if (!this.loaded) {//自动添加logo加载
           this.loaded = true;
           urls.unshift(this.logo)
       }
        len = urls.length;
        urls.each(function (url){
            var img = new Image();
            img.src = url.trim();
            if (img.complete) {
                _load.call(img)
            }else{
                img.onerror = _error;
                img.onload = _load;
                img.timeout = setTimeout(function() {_load.call(img, true)}, G.timeout);// timeout
            }
        });
        function _error(){
            _load.call(this, true)
        }
        function _load(isErr){
            if (isErr) {err++}else{ok++}
            count++;
            clearTimeout(this.timeout);
            this.onload = this.onerror = null;
            loading.call(G, len, count, ok, err, this)// 目标数, 完成数, 成功数, 失败数
        }
    } 
});
/*
用于web应用的预加载图片, 自动生成一个黑屏在最上层, 加载完成后隐藏黑屏
html结构 div.app-loading > div.app-loadout > div.app-loadin
渐变条效果由样式决定
var loader = this.lib.AppImageLoader();//黑白两种风格， 默认为黑
loader.load('bg.jpg,key.png,kf.png,cloud.png');
属性: lastFx = bool; 是否最后有个logo落下的效果, logo是主层的背景
tween: 落下的曲线
loading: 事件, 每个元素加载的事件
showLogo: 把logo显示出来
end: 事件,默认隐藏黑层
*/