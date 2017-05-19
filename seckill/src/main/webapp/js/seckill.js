//存放主要交互逻辑js代码
//javascript模块化
var seckill = {
	
	//封装秒杀相关的ajax的url
	URL: {
		now : function() {
			return '/seckill/seckill/time/now';
		},

		exposer : function(seckillId) {
			return '/seckill/seckill/' + seckillId + '/exposer';
		},
		execution : function(seckillId, md5) {
			return '/seckill/seckill/'+ seckillId + '/'+ md5 + '/execution';
		}
	},

	//验证手机号
	validatePhone: function(phone) {
		if (phone && phone.length == 11 && !isNaN(phone)) {
			return true
		} else {
			return false
		}
	},

	//执行秒杀
	handleSeckill: function(seckillId, node) {
		//处理秒杀逻辑
		node.hide()
			.html('<button class="btn btn-primary btn-lg" id="killBtn">开始秒杀</button>');
		$.post(seckill.URL.exposer(seckillId), {}, function(result) {
			//在回调函数中, 执行交互流程
			if (result && result['success']) {
				var exposer = result['data'];
				if (exposer['exposed']) {
					//开启秒杀
					//获取秒杀地址
					var md5 = exposer['md5'];
					var killUrl = seckill.URL.execution(seckillId, md5);
					console.log(killUrl);
					//one只绑定一次事件,click一直绑定
					$('#killBtn').one('click', function() {
						//执行秒杀请求
						//1.禁用按钮
						$(this).addClass('disabled');
						//2.发送秒杀请求执行秒杀
						$.post(killUrl, {}, function(result) {
							if (result && result['success']) {
								var killResult = result['data'];
								var state = killResult['state'];
								var stateInfo = killResult['stateInfo'];
								//3.显示秒杀结果
								node.html('<span class="label label-success">' + stateInfo + '</span>');
							}
						}, "json")
					});
					node.show();
				} else {
					//未开启秒杀
					var now = exposer['now']
					var start = exposer['start']
					var end = exposer['end']
					//重新计算计时逻辑
					seckill.countdown(seckillId, now, start, end);
				
				}
			} else {
				console.log('result: ' + result)
			}

		}, "json");
	},

	//倒计时
	countdown:function(seckillId, nowTime, startTime, endTime) {
		var seckillBox = $("#seckill-box");		
		if (nowTime > endTime) {
			sekcillBox.html("秒杀结束");
		} else if (nowTime < startTime) {
			//秒杀未开始,计时事件绑定:
			console.log(nowTime + ": " + startTime)
			var killTime = new Date(startTime + 1000);
			seckillBox.countdown(killTime, function(event) {
				//时间格式
				var format = event.strftime('秒杀倒计时: %D天 %H时 %M分 %S秒')
				console.log(format);
				seckillBox.html(format);
				
			}).on('finish.countdown', function() {
				//获取秒杀地址，控制现实逻辑，执行秒杀
				seckill.handleSeckill(seckillId, seckillBox);
			});

		} else {
			//秒杀进行中
			seckill.handleSeckill(seckillId, seckillBox);
		}
	},

	//详情页秒杀逻辑
	detail: {
		//详情页初始化
		init : function(params) {
			//手机验证和登录, 计时交互
			//规划我们的交互流程
			//在cookie中查找手机号
			var killPhone = $.cookie('killPhone')
			//验证手机号
			if (!seckill.validatePhone(killPhone)) {
				//绑定phone
				//控制输出
				var killPhoneModal = $("#killPhoneModal")
				killPhoneModal.modal({
					show: true, //弹出显示层
					backdrop: 'static', //禁止位置关闭
					keyboard: false //关闭键盘事件
				});
				
				$("#killPhoneBtn").click(function(){
					var inputPhone = $("#killPhoneKey").val()
					console.log(inputPhone)
					if (seckill.validatePhone(inputPhone)) {
						//电话写入cookie
						$.cookie('killPhone', inputPhone, {expires: 7, path: '/seckill'})
						//刷新页面
						window.location.reload()
					} else {
						console.log("执行?")
						$('#killPhoneMessage').hide().html('<label class="label label-danger">手机号错误！</label>').show(300)
					}
				});
			}

			//已登录
			//计时交互
			var startTime = params['startTime']
			var endTime = params['endTime']
			var seckillId = params['seckillId']
			$.get(seckill.URL.now(), {}, function(result) {
				if (result && result['success']) {
					var nowTime = result['data'];
					//时间判断
					seckill.countdown(seckillId, nowTime, startTime, endTime);

				} else {
					console.log('result:' + result);
				}
			});

		}
	}
}
