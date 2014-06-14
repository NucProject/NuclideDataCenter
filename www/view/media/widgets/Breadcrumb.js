/**
 * Created by Healer on 14-6-6.
 */
$class("Breadcrumb", [kx.Widget, kx.EventMixin],
{
    __constructor: function() {

    },

    onAttach: function() {
        $("body").bind("dateRangeChanged", kx.bind(this, "onDateRangeChanged"));
        this.setLevels([{"url": "#network", "name": "监测网络", "type": "network"}]);
    },

    onDateRangeChanged: function(e, beginTime, endTime) {
        g.setBeginTime(beginTime);
        g.setEndTime(endTime);

        g.showTip("时间选择变化");
    },

    setLevels: function(levels) {
        this._domNode.find("ul li.home").hide();
        this._domNode.find("ul li.home i.icon-angle-right").hide();
        var l = 0;
        for (var i in levels)
        {
            l += 1;
            var level = this._domNode.find("ul li.level" + l);
            level.show();
            level.find("a")
                .text(levels[i]['name'])
                .attr("href", levels[i]['url'])
                .attr("type", levels[i]['type']);

            if (l > 1)
            {
                var prev = l - 1;
                this._domNode.find("ul li.level" + prev).find("i.icon-angle-right").show();
            }
        }

        this._domNode.find("ul li.home a").bind("click", kx.bind(this, "onLevelClick"));
    },

    onLevelClick: function(e) {
        var i = $(e.target);
        var url = i.attr("href");
        var type = i.attr("type");

        if (type == "network")
        {
            g.showRow("#network-row");
        }
        else if (type == "station")
        {
            g.showRow("#station-row");
        }
        else if (type == "device")
        {
            g.showRow("#devices-row");
        }

        return false;
    }



});