/**
 * Created by Healer on 14-6-9.
 */

$class("Sidebar", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    _currentStationId: -1,

    __constructor: function() {
    },

    onAttach: function(domNode) {

        this.ajax("main/stations/1", null, function(data){


            var ul = domNode.find('ul.stations');
            var res = eval("(" + data + ")");
            var stations = res['results']['items'];
            for (var i in stations)
            {
                var s = stations[i];
                var html = "<li><a href='#stations-row'>" + s.name + "</a></li>";
                var li = $(html);
                li.attr("station_id", s.station_id);
                ul.append(li)
            }

            var self = this;
            ul.find("li a").bind("click", function(){
                var li = $(this).parent();
                self.onStationClicked(li);
                return false;
            });
        });
    },

    getCurrentStationId: function() {
        return this._currentStationId;
    },

    onStationClicked: function(li) {
        var currentStationId = li.attr("station_id")
        this._currentStationId = currentStationId;

        console.log(this.getCurrentStationId());

        $('#network-row').hide();
        $('#devices-row').hide();
        $('#admin-row').hide();

        $('#station-row').show();

        var breadcrumb = Widget.widgetById("breadcrumb");
        breadcrumb.setLevels(
            [{"url":"#network", "name":"监测网络"},
             {"url":"#station" + currentStationId, "name":li.find("a").text()}
            ]);

        return false;
    }



});