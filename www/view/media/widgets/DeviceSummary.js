/**
 * Created by Healer on 14-6-8.
 */

$class("SettingPane", [kx.Weblet, kx.ActionMixin, kx.EventMixin],
{
    _templateFile: "settingspane.html",

    _device: null,

    __constructor: function(device)
    {
        this._device = device;
    },

    onCreated: function(domNode) {

        domNode.find('a.sure').bind('click', kx.bind(this, "onClickModify"))


        /*
        $('#dashboard-report-range2').daterangepicker({
                ranges: {
                    '今天': [Date.today(), Date.today().addHours(24)],
                    '昨天': [Date.today().addHours(-24), Date.today()],
                    '前天': [Date.today().addHours(-48), Date.today().addHours(-24)]

                },
                opens: 'left', //(App.isRTL() ? 'right' : 'left'),
                format: 'yyyy-MM-dd',
                separator: ' to ',
                startDate: Date.today().add({
                    days: -29
                }),
                endDate: Date.today(),
                minDate: '01/01/2012',
                maxDate: '12/31/2014',
                locale: {
                    applyLabel: '确定',
                    fromLabel: '从',
                    toLabel: '到',
                    customRangeLabel: '自定义',
                    daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    firstDay: 1
                },
                showWeekNumbers: true,
                buttonClasses: ['btn-danger']
            },

            function (start, end) {
                App.blockUI(jQuery("#dashboard"));
                setTimeout(function () {
                    App.unblockUI(jQuery("#dashboard"));
                    // App.scrollTo();
                }, 10);


                if (start.clone().addHours(24).toISOString() == end.toISOString())
                {
                    if (start.toISOString() == Date.today().toISOString())
                    {
                        $('#dashboard-report-range span').html('今天');
                    }
                    else if (start.toISOString() == Date.today().addHours(-24).toISOString())
                    {
                        $('#dashboard-report-range span').html('昨天');
                    }
                    else if (start.toISOString() == Date.today().addHours(-48).toISOString())
                    {
                        $('#dashboard-report-range span').html('前天');
                    }
                }
                else
                {
                    $('#dashboard-report-range span').html(start.toString('yyyy年MM月dd日') + ' - ' + end.toString('yyyy年MM月dd日'));
                }

                $("body").trigger("dateRangeChanged", [start, end]);
            });

        $('#dashboard-report-range').show();

        $('#dashboard-report-range span').html(Date.today().toString('yyyy年MM月dd日') + ' - ' + Date.today().addHours(24).toString('yyyy年MM月dd日'));
        */
    },

    setAlertFields: function(alertFields) {

        this._alertFields = alertFields;    //???
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
        this._domNode.find('input.v1').val('');
        this._domNode.find('input.v2').val('');
        var url = "alert/get/" + g.getCurrentStationId() + "/" + this._device;
        this.ajax(url + "?f=" + field, null, function(data)
        {
            var d = eval('(' + data + ')');
            if (d['errorCode'] == 0)
            {
                var values = d['results']['values'];
                this._domNode.find('input.v1').val(values['v1']);
                this._domNode.find('input.v2').val(values['v2']);
            }
        });
    },

    setValues: function(v1, v2)
    {
        var field = this._domNode.find("select").val();
        var url = "alert/set/" + g.getCurrentStationId() + "/" + this._device;
        var payload = {
            'f': field,
            'v1': v1,
            'v2': v2
        };
        this.ajax(url + "?f=" + field, payload, function(data)
        {
            console.log(data, "Set alert value(s) success")
        });
    },

    onClickModify: function()
    {
        var v1 = this._domNode.find('input.v1').val();
        var v2 = this._domNode.find('input.v2').val();
        if (isNaN(v1))
        {
            return false;
        }
        if (v2 != "" && isNaN(v2))
        {
            return false;
        }
        this.setValues(v1, v2);
    }

});

//////////////////////////////////////////////////////////////////////////
// Devices Base
$class("DeviceSummaryBase", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    __constructor: function() {
    },

    onAttached: function(domNode)
    {
        domNode.find("div.caption i").text(" " + g.getDeviceName(this._deviceType));
        domNode.find("a.details").bind("click", kx.bind(this, "onDetailsClicked"));
        domNode.find("a.change-alert").bind("click", kx.bind(this, "changeAlertClicked"));

        domNode.find("ul.nav li").bind("click", kx.bind(this, "onPaneShow"));
        setInterval(kx.bind(this, "getLatestData"), 10000);

        this.updateRunState(true, "获取运行状态...");

        // For each CSS.
        var width = domNode.css('width');
        domNode.css('min-height', (parseInt(width) * 4 / 5) + 'px');
        domNode.removeClass('blue');
        domNode.css('border', "#4b8df8 solid 1px");
        domNode.find('div.panel').css('height', '80px');
        domNode.find('.portlet-title').css('background-color', "white")
            .css('border-bottom', '1px solid #B1A7A7')
            .css('margin', '5px')
    },


    getLatestData: function() {
        var station = this._stationId;
        var url = "data/latest/" + station + "/" + this._deviceType;
        var self = this;
        this.ajax(url, null, function(data) {

            var r = eval("(" + data + ")");
            var latest = r['results']['status']
            if (g.getUnixTime() - latest > 60 * 30)
            {
                self.updateRunState(false, "运行状态: 停止");
            }
            else
            {
                self.updateRunState(true, "运行状态: 运行");
            }
        });
    },

    updateRunState: function(running, text)
    {
        if (running)
        {
            this._domNode.find("div.tab-content span.run").addClass("label-success").removeClass("label-danger").text(text);
        }
        else
        {
            this._domNode.find("div.tab-content span.run").addClass("label-danger").removeClass("label-success").text(text);
        }
    },

    onDetailsClicked: function()
    {
        g.showRow("#devices-row");

        DeviceSummaryBase.showDevice(this._deviceType);
        return false;

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
                    var d = Widget.widgetById(dt[i] + "-device");
                    if (d)
                    {
                        d.onHide();
                    }
                }
                else
                {
                    w._domNode.show();
                    Widget.widgetById(this._deviceType + "-device").onShow();
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
            if (!self._alertSettingPane)
            {
                self.ajax("alert/config/" + self._deviceType, null, function(data){
                    var fc = eval("(" + data + ")");


                    self._alertSettingPane = new AlertSettingPane(self._deviceType);
                    var dn = self._alertSettingPane.create();

                    dn.appendTo(self._domNode.find('div.config'));
                    self._alertSettingPane.setAlertFields(fc['results'])

                });
            }
        }
    }
});

DeviceSummaryBase.showDevice = function(deviceType, params)
{
    var dt = ["hpic", "weather", "bai9125", "bai9850", "radeye", "mds", "gama"];

    console.log(deviceType);
    for (var i in dt)
    {
        var wid = dt[i] + "-tab-pane";

        var w = Widget.widgetById(wid);
        if (w)
        {
            if (dt[i] != deviceType)
            {
                w._domNode.hide();
                var d = Widget.widgetById(dt[i] + "-device");
                if (d)
                {
                    d.onHide();
                }
            }
            else
            {
                w._domNode.show();
                Widget.widgetById(deviceType + "-device").onShow(params);
            }
        }
    }

    var sidebar = Widget.widgetById("sidebar");
    var breadcrumb = Widget.widgetById("breadcrumb");
    var deviceName = g.getDeviceName(deviceType);
    breadcrumb.setLevels(
        [
            {"url":"#network", "name":"监测网络", "type":"network"},
            {"url":"#station" + sidebar.getCurrentStationId(), "name":sidebar.getCurrentStationName(), "type":"station"},
            {"url":"#device-" + deviceType, "name": deviceName, "type":"device"}
        ]);
};

//////////////////////////////////////////////////////////////////////////
// Devices
$class("HpicSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {
        this._stationId = 102;
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
        this._stationId = 102;
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
    }

});
