/**
 * Created by Healer on 14-8-10.
 */


$class("HistoryPane", [kx.Weblet, kx.ActionMixin, kx.EventMixin],
{
    _templateString: "<div><div><a class='btn rate'>刷新获取率</a>&nbsp;<a class='btn history'>获取历史数据</a></div><div class='calendar'></div></div>",

    __constructor: function(deviceType) {
        this._deviceType = deviceType;
        console.log('Enter', deviceType, 'HistoryPane');
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

    },

    onDayClick: function(sender, date, allDay, jsEvent, view) {

        sender.parent().parent().find('td.fc-day').css('background', '');
        // TODO: Change color
        sender.css('background', 'red');

        this.selectDate = Date.parse(date);
    },

    onClickHistoryButton: function() {
        var this_ = this;
        this.selectDate = this.selectDate || Date.parse('yesterday');

        var start = this.selectDate.toString('yyyy-MM-dd');
        var end = this.selectDate.addHours(24).toString('yyyy-MM-dd');

        this.ajax('data/check/128/hpic', {'start':start, 'end':end, 'expect':2880}, function(data) {
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
            console.log(data)
        });
    }

});