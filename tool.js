var tools = {};

//老虎机抽奖
tools.luckDraw = function(opts){
    //老虎机抽奖
    function LuckDraw(opts){
        opts = $.extend({
            ele : $('#box'),    //外层元素
            list : [],          //中奖列表  {src,type}  src 图片链接  type 奖品标记
            type : -1,          //-1为不中奖  中奖设置type值
            speed : 10,         //设置初始加速度 //不建议修改
            allStop : false,     //同步停止，异步停止
            stopTime : 3000,      //停止时间
        },opts);

        for (i in opts) {
            this[i] = opts[i];
        }
    }

    //抽奖初始化
    LuckDraw.prototype.init = function(fn){
        this.start();
        this.defalutStop(fn);
        return this;
    };

    //初始化dom元素
    LuckDraw.prototype.domInit = function(){
        var that = this;
        var num = 5;
        this.uls = this.ele.find('ul');
        this.li = this.ele.find('li').eq(0);
        this.uls.css({
            'position' : 'absolute',
            'top' : 0
        });
        this.uls.each(function(i,obj){
            var arr = [];
            var $li = $(this).find('li');
            var length = $li.length;
            var i=0;
            var max;

            while (length != num) {
                if (length < num) {
                    $(this).append(that.cloneLi());
                    length ++;
                } else if (length > num) {
                    $li.eq(length-1).remove();
                    length --;
                }
            }
        });
    };

    //数据初始化
    LuckDraw.prototype.dataInit = function(){
        var that = this;
        this.endOff = false;
        this.num = 0;
        this.uls.each(function(i,obj){
            $(obj).data({
                top : 0,
                speed : that.speed,
                acc : 0.2,
                index : i,
                last : true,
                endOff : false
            });
        });
        this.liH = this.li.outerHeight(true);
        this.maxSpeed = Math.round(this.liH * 1/4);
        return this;
    };

    //工具-复制元素 返回一个新的li元素
    LuckDraw.prototype.cloneLi = function(num){
        if (typeof(num) !== 'number' && typeof(num) !== 'string') {
            num = this.randomData();
        }
        var newLi;
        if (this.li.length > 0) {
            newLi = this.li.clone(true);
            newLi.attr('data-type',this.list[num].type);
            newLi.find('img').attr('src',this.list[num].src);
        } else {
            newLi = $('<li data-type=' + this.list[num].type + '><img src="' + this.list[num].src + '" /></li>')
        }
        return newLi;
    };

    //工具-随机数生成
    LuckDraw.prototype.randomData = function(){
        return Math.floor(Math.random() * this.list.length + 0);
    };

    //开始抽奖
    LuckDraw.prototype.start = function(){
        if (this.list.length < 2) {
            return false;
        }
        var that = this;
        this.domInit();
        this.dataInit();
        that.uls.each(function(i,el){
            var timer;
            clearInterval(timer);
            timer = setInterval(function(){
                that.sport($(el),timer);
            },20);
        });
        return this;
    };

    //运动函数
    LuckDraw.prototype.sport = function(obj,timer){
        var speed = obj.data('speed');
        var top = obj.data('top');
        var off = obj.data('endOff');
        var that = this;
        //设置加速度
        if (obj.data('last') && speed <= this.maxSpeed){
            speed = speed + Math.floor((this.maxSpeed - speed) * obj.data('acc'));
            obj.data('speed',speed);
        }

        //设置移动
        if (top > -this.liH && (!this.endOff && !off)) {
            //正常的移动
            obj.data('top',top - speed);
            obj.css('top',top - speed + 'px');
        } else if (!this.endOff && !off) {
            //删除头元素，新增新元素
            obj.find('li').eq(0).remove();
            obj.css('top',obj.data('top') + this.liH + 'px');
            obj.data('top',obj.data('top') + this.liH);
            obj.append(this.cloneLi());
        } else {
            if (obj.data('last')){
                //结束运动
                clearInterval(timer);
                obj.append(this.cloneLi(this.lotteryArr[obj.data('index')]));
                obj.data({
                    'H':obj.outerHeight(true),
                    'last':false
                });

                obj.animate({
                    top : -obj.data('H') + this.liH
                },{
                    duration : 3000,
                    complete : function(){
                        var length = that.uls.length;
                        that.num ++;
                        if (length == that.num) {
                            that.ele.trigger('stopLottery',[that],that.type);
                            that.stopFn && that.stopFn(that.type);
                        }
                    },
                    //      easing : 'easeOutQuint'
                    easing : 'easeOutElastic'
                })

            }
        }
        return this;
    };

    //结束抽奖
    LuckDraw.prototype.stop = function(fn){
        if (Object.prototype.toString.call(fn) === '[object Function]') {
            this.stopFn = fn;
        } else {
            this.stopFn = false;
        }
        var that = this;
        var time = 2000;
        this.lotteryArr = this.randomNums();
        if (this.allStop) {
            this.endOff = true;
        } else {
            this.uls.each(function(i,obj){
                var _self = this;
                setTimeout(function(){
                    $(_self).data('endOff',true);
                },time + i * 500);
            });
        }
        return this;
    };

    //默认关闭抽奖
    LuckDraw.prototype.defalutStop = function(fn){
        var that = this;
        if (this.stopTime >= 3000) {
            setTimeout(function(){
                that.stop(fn);
            },this.stopTime)
        }
    };

    //结束抽奖结果显示生成
    LuckDraw.prototype.randomNums = function(){
        var lotteryArr = [];
        var that = this;
        var winning = false;
        if (this.type !== -1) {
            $.each(this.list,function(index,obj){
                if (obj.type == that.type) {
                    for (var i=0,maxi=that.uls.length;i<maxi;i++) {
                        lotteryArr.push(index);
                    }
                    winning = true;
                    return false;
                }
            });
        }
        if (!winning) {
            lotteryArr = this.randomArr();
            this.type = -1;
        }

        return lotteryArr;
    };

    //生成一组不中奖数据
    LuckDraw.prototype.randomArr = function(){
        var lotteryArr = [];
        var lotteryOff = true;
        var lastRandomNum;
        for (var i=0,maxi=this.uls.length;i<maxi;i++) {
            if (i<maxi-1) {
                lotteryArr.push(this.randomData());
            } else {
                for (var j=1,maxj=lotteryArr.length;j<maxj;j++) {
                    if (lotteryArr[j] != lotteryArr[0]) {
                        lotteryOff = false;
                        break;
                    }
                }
                while (lotteryOff) {
                    lastRandomNum = this.randomData();
                    if (lastRandomNum != lotteryArr[0]) {
                        lotteryOff = false;
                        lotteryArr.push(lastRandomNum);
                    }
                }
            }
        }
        return lotteryArr;
    }

    //设置中奖结果方法
    LuckDraw.prototype.setType = function(num){
        this.type = num || -1;
        return this;
    };

    //读取中奖结果方法
    LuckDraw.prototype.getType = function(){
        return this.type;
    };

    //无用
    LuckDraw.prototype.lottery = function(){
        var that = this;

        return this;
    };

    return new LuckDraw(opts);
};

//剩余时间求值
tools.residualTime = function(time){
    var date = {};
    date.s = time/1000;
    date.day = Util.checkTime(Math.floor(date.s/(24*60*60)));
    date.s = date.s - (date.day * 24*60*60);
    date.h = Util.checkTime(Math.floor(date.s/(60*60)));
    date.s = date.s - (date.h*60*60);
    date.m = Util.checkTime(Math.floor(date.s/60));
    date.s = Util.checkTime(date.s - (date.m*60));
    return date;
};
