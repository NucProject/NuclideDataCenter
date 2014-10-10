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

    onCreated: function(domNode) {

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
        var endDate = end.toString('yyyy-MM-dd');


        var dates = [];
        var date = start;
        while (true) {
            var day = date.toString('yyyy-MM-dd');
            if (day == endDate)
                break;
            dates.push(date.clone());
            date.addHours(24);
        }

        var rates = [];
        for (var i in dates) {
            var startDate = dates[i];
            var start = startDate.toString('yyyy-MM-dd');
            var endDate = startDate.addHours(24);
            var end = endDate.toString('yyyy-MM-dd');

            this.getRate(start, end, rates);
            console.log(start, end)
        }

        var this_ = this;
        // TODO: modify here, if over 1sec.
        //
        this_._domNode.find('div.calendar').fullCalendar('removeEventSource', { events: rates });
        setTimeout(function(){
            this_._domNode.find('div.calendar').fullCalendar('addEventSource', { events: rates });
        }, 2000);


    },

    getRate: function(start, end, rates) {
        var payload = {'start': start, 'end': end };
        var expect = this._except;
        this.ajax(
            'data/count/' + g.getCurrentStationId() + '/' + this._deviceType,
            payload,
            function(data){
                // console.log(data)
                var d = eval("(" + data + ")");
                var count = parseInt(d['results']['count']);

                var title = '';
                if (count >= expect) {
                    title = '获取率: ' + "100%";
                } else {
                    title = '获取率: ' + (count * 100 / expect).toFixed(1) + "%";
                }

                rates.push({'start': start, 'end': start, 'title': title})
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

        this.ajax(
            'data/check/' + g.getCurrentStationId() + '/' + this._deviceType,
            {'start':start, 'end':end, 'expect':2880}, function(data) {
            var d = eval("(" + data + ")");
            this_.setHistoryCommand(start, end, d['results']['times']);
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
        this.ajax('command/post', payload, function(data){
            g.showTip('已发送成功获取历史数据的指令');
        });
    }

});