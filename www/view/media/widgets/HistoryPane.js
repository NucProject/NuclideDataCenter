/**
 * Created by Healer on 14-8-10.
 */


$class("HistoryPane", [kx.Weblet, kx.ActionMixin, kx.EventMixin],
{
    _templateString: "<div class='calendar'></div>",

    __constructor: function() {

    },

    onCreated: function(domNode) {

        var weeks = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        setTimeout(function(){
            domNode.fullCalendar({
                firstDay: 1,
                monthNames:['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
                dayNames:weeks,
                dayNamesShort:weeks,
                header: { left: 'title', right: 'prev, next' },
                editable: false,
                events: []
            });
            domNode.fullCalendar('option', 'height', 500);

            //domNode.fullCalendar('option', 'contentHeight', 100);

        }, 0);

    }

});