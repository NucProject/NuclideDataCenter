/**
 * Created by Healer on 14-6-8.
 */

//////////////////////////////////////////////////////////////////////////
// Devices Base
$class("DeviceSummaryBase", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{


    __constructor: function() {
    },

    onAttached: function(domNode) {
        console.log(domNode)
        domNode.find("a.details").bind("click", kx.bind(this, "onDetailsClicked"));

    },

    onDetailsClicked: function()
    {
        g.showRow("#devices-row");

        var dt = ["hpic", "weather", "labr", "environment", "hpge", "cinderella"];

        for (var i in dt)
        {
            var wid = dt[i] + "-tab-pane";

            var w = Widget.widgetById(wid);
            if (w)
            {
                if (dt[i] != this._deviceType)
                {
                    w._domNode.hide();
                }
                else
                {
                    w._domNode.show();
                    Widget.widgetById(this._deviceType + "-device").refresh();
                }
            }
        }

        var sidebar = Widget.widgetById("sidebar");
        var breadcrumb = Widget.widgetById("breadcrumb");
        var deviceName = g.getDeviceName(this._deviceType);
        breadcrumb.setLevels(
            [
                {"url":"#network", "name":"监测网络", "type":"network"},
                {"url":"#station" + sidebar.getCurrentStationId(), "name":sidebar.getCurrentStationName(), "type":"station"},
                {"url":"#device-" + this._deviceType, "name": deviceName, "type":"device"}
            ]);
        return false;
    }
});

//////////////////////////////////////////////////////////////////////////
// Devices
$class("HpicSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "hpic";
        this.onAttached(domNode);
    }

});

$class("WeatherSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "weather";
        this.onAttached(domNode);
    }

});


$class("LabrSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "labr";
        this.onAttached(domNode);
    }
});

$class("CinderellaSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "cinderella";
        this.onAttached(domNode);
    }

});

$class("EnvSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "environment";
        this.onAttached(domNode);
    }

});

$class("HpGeSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "hpge";
        this.onAttached(domNode);
    }
});