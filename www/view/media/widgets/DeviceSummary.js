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
        $("#station-row").hide();
        $("#devices-row").show();

        var d = ["hpic", "weather", "labr", "environment", "hpge", "cinderella"];

        for (var i in d)
        {
            var wid = d[i] + "-tab-pane";

            var w = Widget.widgetById(wid);
            if (w)
            {
                if (d[i] != this._deviceName)
                {
                    w._domNode.hide();
                }
                else
                {
                    w._domNode.show();
                }
            }
        }
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
        this._deviceName = "hpic";
        this.onAttached(domNode);
    }

});

$class("WeatherSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceName = "weather";
        this.onAttached(domNode);
    }

});


$class("LabrSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceName = "labr";
        this.onAttached(domNode);
    }
});

$class("CinderellaSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceName = "cinderella";
        this.onAttached(domNode);
    }

});

$class("EnvSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceName = "environment";
        this.onAttached(domNode);
    }

});

$class("HpGeSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceName = "hpge";
        this.onAttached(domNode);
    }
});