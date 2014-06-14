/**
 * Created by Healer on 14-6-8.
 */

/*
* <input type="text">&nbsp;一级报警阈值</input>
 <input type="text">&nbsp;二级报警阈值</input>
 <a href="#" class="btn green change-alert">确定</a>
* */

$class("AlertSettingPane", [kx.Weblet, kx.ActionMixin, kx.EventMixin],
{
    _templateString: "<div><select></select></div>",

    _device: null,

    __constructor: function(device)
    {
        this._device = device;
        console.log(device)
    },

    onCreated: function(domNode) {

    },

    setAlertFields: function(alertFields) {

        var selNode = this._domNode.find("select");

        var _first = "";
        for (var i in alertFields)
        {
            _first = _first || i;
            var item = $("<option></option>");
            item.val(i).text(alertFields[i].name);


            selNode.append(item);
        }
        this.fetchValues(_first);
        selNode.bind('change', kx.bind(this, "onSelectChanged"));
    },

    onSelectChanged: function()
    {
        var field = this._domNode.find("select").val();
        this.fetchValues(field)
    },

    fetchValues: function(field)
    {
        var url = "alert/get/" + g.getCurrentStationId() + "/" + this._device;
        this.ajax(url + "?f=" + field, null, function(data)
        {
            console.log(data)
        });
    },

    setValues: function(values)
    {
        var field = this._domNode.find("select").val();
        var url = "alert/set/" + g.getCurrentStationId() + "/" + this._device;
        var payload = {
            'f': field,
            'v1': values[0],
            'v2': values[1]
        };
        this.ajax(url + "?f=" + field, payload, function(data)
        {
            console.log(data)
        });
    }

});

//////////////////////////////////////////////////////////////////////////
// Devices Base
$class("DeviceSummaryBase", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    __constructor: function() {
    },

    onAttached: function(domNode) {

        var self = this;
        domNode.find("div.caption i").text(" " + g.getDeviceName(this._deviceType));
        domNode.find("a.details").bind("click", kx.bind(this, "onDetailsClicked"));
        domNode.find("a.change-alert").bind("click", kx.bind(this, "changeAlertClicked"));

        domNode.find("ul.nav li").bind("click", kx.bind(this, "onPaneShow"));
        setInterval(kx.bind(this, "getLatestData"), 10000);

    },


    getLatestData: function() {
        var station = g.getCurrentStationId();
        var url = "data/latest/" + station + "/" + this._deviceType;
        var self = this;
        this.ajax(url, null, function(data) {

            var r = eval("(" + data + ")");
            var latest = r['results']['time']
            if (g.getUnixTime() - latest > 100)
            {
                self.updateRunState(false);
            }
            else
            {
                self.updateRunState(true);
            }
        });
    },

    updateRunState: function(running)
    {
        if (running)
        {
            this._domNode.find("div.caption span").addClass("label-success").removeClass("label-danger").text("运行");
        }
        else
        {
            this._domNode.find("div.caption span").addClass("label-danger").removeClass("label-success").text("停止");
        }
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
    },

    onPaneShow: function(e)
    {
        if ($(e.target).attr("href").indexOf("_setting") > 0)
        {
            var self = this;
            this.ajax("alert/config/" + this._deviceType, null, function(data){
                var fc = eval("(" + data + ")");
                //self.onSettingPaneShow(fc['results']);

                var alertSettingPane = new AlertSettingPane(this._deviceType);
                var dn = alertSettingPane.create();
                dn.appendTo(this._domNode.find('div.setting'));
                alertSettingPane.setAlertFields(fc['results'])

            });

        }
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
    },

    onSettingPaneShow: function(fieldConfig)
    {
        console.log(fieldConfig);
        for (var i in fieldConfig)
        {
            console.log(i, fieldConfig[i]);
        }
        /*
        var url = "alert/get/" + g.getCurrentStationId() + "/hpic";
        this.ajax(url, null, function(data){
            console.log(data)
        });
        return false;
        */
    },

    changeAlertClicked: function()
    {
        var url = "alert/set/" + g.getCurrentStationId() + "/hpic";
        var payload = { "f": "doserate", "v1": 100, "v2": 150, "r": 1};
        this.ajax(url, payload, function(data){
            console.log(data)
        });
        return false;
    }

});

$class("WeatherSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "weather";
        this.onAttached(domNode);
    },

    onSettingPaneShow: function(fieldConfig)
    {
        console.log(fieldConfig);
        /*
         var url = "alert/get/" + g.getCurrentStationId() + "/hpic";
         this.ajax(url, null, function(data){
         console.log(data)
         });
         return false;
         */
    },

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