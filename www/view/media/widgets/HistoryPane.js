/**
 * Created by Healer on 14-8-10.
 */


$class("HistoryPane", [kx.Weblet, kx.ActionMixin, kx.EventMixin],
    {
        _templateString: "<div><div><a class='btn rate'>刷新获取率</a>&nbsp;<a class='btn history'>获取历史数据</a></div><div class='calendar'></div></div>",

        __constructor: function(deviceType, except) {
            this._deviceType = deviceType;
            this._except = except || 2880;
        },

        onCreated: function(domNode, params) {
            this._except = params['expect'] || 2880;
            var this_ = this;
            var weeks = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
            setTimeout(function(){
                var c = domNode.find('div.calendar');
                c.fullCalendar({
                    firstDay: 1,
                    monthNames:['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
                    dayNames:weeks,
                    dayNamesShort:weeks,
                    header: { left: 'title', right: 'prev, next' },
                    editable: false,
                    titleFormat: 'yyyy年MM月',
                    buttonText: {'prev':"<<上个月", 'next': "下个月>>"},
                    dayClick: function(date, allDay, jsEvent, view) {
                        var sender = $(this);
                        this_.onDayClick(sender, date, allDay, jsEvent, view);
                    },
                    events: []
                });
                c.fullCalendar('option', 'height', 500);

                //domNode.fullCalendar('option', 'contentHeight', 100);

            }, 0);

            domNode.find('a.history').bind('click', function(){
                this_.onClickHistoryButton();
            });

            domNode.find('a.rate').bind('click', function(){
                this_.onFetchRate();
            });

        },

        onDayClick: function(sender, date, allDay, jsEvent, view) {

            sender.parent().parent().find('td.fc-day').css('background', '').removeClass('highlight');
            // TODO: Change color
            sender.css('background', 'gray').addClass('highlight');

            this.selectDate = Date.parse(date);
            this._domNode.find('a.history').text("获取 " + this.selectDate.toString('yyyy-MM-dd') + " 数据");
        },

        onFetchRate: function() {
            var view = this._domNode.find('div.calendar').fullCalendar('getView');

            var start = Date.parse(view.start);
            var end = Date.parse(view.end);

            console.log(start);

            var this_ = this;
            this.getRate(start, end, function(rates){
                this_._domNode.find('div.calendar').fullCalendar('removeEvents');
                // console.log(rates);
                this_._domNode.find('div.calendar').fullCalendar('addEventSource', { events: rates });
            });
        },

        getRate: function(start, end, handler) {
            var startDate = start.toString('yyyy-MM-dd');
            var endDate = end.toString('yyyy-MM-dd');
            var expect = this._except;
            this.ajax(
                'data/count2/' + g.getCurrentStationId() + '/' + this._deviceType + '?' + 'start=' + startDate + "&end=" + endDate,
                null,
                function(data){
                    console.log(data)
                    var d = eval("(" + data + ")");
                    var a = d['results']['counts'];

                    for (var i in a)
                    {
                        var item = a[i];
                        item.time = item.time.substr(0, 10);
                    }

                    var rates = [];
                    var t = start.clone();
                    while (t.getTime() < end.getTime())
                    {
                        var cur = t.clone();
                        if (cur.getTime() > +new Date())
                            break;

                        var todayStr = cur.toString('yyyy-MM-dd');
                        var r = "0";
                        for (var i in a)
                        {
                            var item = a[i];
                            if (item.time == todayStr)
                            {
                                // console.log(1)
                                r = (100 * item.count / expect).toFixed(1);
                            }
                        }
                        var text = '数据获取率:' + r + '%';
                        if (r >= 95) {
                            var c = 'green';
                        } else {
                            var c = 'red';
                        }

                        if (todayStr == (new Date().toString('yyyy-MM-dd'))) {
                            var c = 'orange';
                        }

                        rates.push({'start': cur, 'end': cur, 'title': text, textColor: c})
                        t.addDays(1);
                    }

                    handler(rates);
                });
        },

        onClickHistoryButton: function() {

            if (!this.selectDate) {
                g.showTip('请选择要获取历史数据的日期');
                return false;
            }
            var this_ = this;
            this.selectDate = this.selectDate || Date.parse('yesterday');

            var date = this.selectDate.clone();
            var start = date.toString('yyyy-MM-dd');
            var end = date.addHours(24).toString('yyyy-MM-dd');
            console.log(start, end);
            this.ajax(
                'data/check/' + g.getCurrentStationId() + '/' + this._deviceType,
                {'start':start, 'end':end, 'expect':2880, 'set': 0}, function(data) {
                    console.log(data);
                    var d = eval("(" + data + ")");
                    console.log(d);
                    if (d.results.times.length > 0)
                    {
                        this_.setHistoryCommand(start, end, d['results']['times']);
                    }
                    else
                    {
                        alert('不需要补齐数据');
                    }
                });
        },

        setHistoryCommand: function(start, end, times)
        {
            var payload = {
                'type': 'history',
                'station': g.getCurrentStationId(),
                'device': this._deviceType,
                'content': {
                    'start': start, 'end': end, 'times': times.join(',')
                }
            };
            console.log(111);
            this.ajax('command/post', payload, function(data){
                console.log(222);
                g.showTip('已发送成功获取历史数据的指令');
            });
        }

    });
