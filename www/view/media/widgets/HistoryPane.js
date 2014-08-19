/**
 * Created by Healer on 14-8-10.
 */


$class("HistoryPane", [kx.Weblet, kx.ActionMixin, kx.EventMixin],
{
    _templateString: "<div><div><a class='btn rate'>刷新获取率</a>&nbsp;<a class='btn history'>获取历史数据</a></div><div class='calendar'></div></div>",

    __constructor: function() {

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
                    this_.onDayClick(date, allDay, jsEvent, view);
                },
                events: []
            });
            c.fullCalendar('option', 'height', 500);

            //domNode.fullCalendar('option', 'contentHeight', 100);

        }, 0);

    },

    onDayClick: function(date, allDay, jsEvent, view) {
        console.log(view)
        //view.css('background', 'red');
    }

});