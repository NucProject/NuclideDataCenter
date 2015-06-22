/**
 * Created by Healer on 14-6-8.
 */

$class("SettingPane", null,
{
    // _templateFile: "settingspane.html",

    _device: null,

    setDevice: function(device)
    {
        this._device = device;
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
        console.log('!!!!!');
        this._domNode.find('input.v1').val('');
        this._domNode.find('input.v2').val('');
        var url = "alert/get/" + g.getCurrentStationId() + "/" + this._device;
        this.ajax(url, null, function(data)
        {
            var d = eval('(' + data + ')');
            console.log(data);
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
            // console.log(latest);
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
    },

    onPaneShow: function(e)
    {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
        // TODO: Make sure if in use
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
    // var dt =  ["hpic", "weather", "labr", "environment", "hpge", "cinderella", "labrfilter"];
    var dt = [ "environment", "hpge", "cinderella" ];
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

    console.log(sidebar.getCurrentStationId());
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
        this._stationId = 128;
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
        this._stationId = 128;
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

$class("HpgeSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {
        this._stationId = 128;
    },

    onAttach: function(domNode) {
        this._deviceType = "hpge";
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

    getLatestData: function() {
        var station = g.getCurrentStationId();
        var url = "data/latest/" + station + "/" + this._deviceType;
        var self = this;

        this.ajax(url, null, function(data) {

            var r = eval("(" + data + ")");
            var latest = r['results']['status']
            if (g.getUnixTime() - latest > 7200)
            {
                self.updateRunState(false, "运行状态: 停止");
            }
            else
            {
                self.updateRunState(true, "运行状态: 运行");
            }
        });
    }

});

$class("LabrSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {
        this._stationId = 128;
    },

    onAttach: function(domNode) {
        this._deviceType = "labr";
        this.onAttached(domNode);
    },

    getLatestData: function() {
        var station = g.getCurrentStationId();
        var url = "data/latest/" + station + "/" + this._deviceType;
        var self = this;

        this.ajax(url, null, function(data) {

            // console.log(data)
            var r = eval("(" + data + ")");
            var latest = r['results']['status']
            if (g.getUnixTime() - latest > 610)
            {
                self.updateRunState(false, "运行状态: 停止");
            }
            else
            {
                self.updateRunState(true, "运行状态: 运行");
            }
        });
    }
});

$class("CinderellaSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {
        this._stationId = 128;
    },

    onAttach: function(domNode) {
        // Fix BUG for Cinderella running status shown.
        this._deviceType = "cinderella";
        this.onAttached(domNode);
    },

    getLatestData: function() {
        var station = g.getCurrentStationId();
        var url = "data/latest/" + station + "/cinderelladata";
        var self = this;

        this.ajax(url, null, function(data) {

            // console.log(data)
            var r = eval("(" + data + ")");
            var latest = r['results']['status'];
            if (g.getUnixTime() - latest > 120)
            {
                console.log("@@@@@", station, g.getUnixTime(), "!", latest);
                self.updateRunState(false, "运行状态: 停止");
            }
            else
            {
                console.log("@@@@@", station, g.getUnixTime(), "!", latest);
                self.updateRunState(true, "运行状态: 运行");
            }
        });

        this.getCinderellaStatus();
    },

    getCinderellaStatus: function() {
        var station = g.getCurrentStationId();
        // Get Cinderella Device Running step;
        var url = "command/cinderella/" + station;
        var self = this;
        this.ajax(url, null, function(data) {

            var r = eval("(" + data + ")");
            var status = r['results']['status'];
            // status = "0;0;0;6308668" //for test！
            if (status)
            {
                self.updateCinderellaStatus(status);
            }

        });
    },

    updateCinderellaStatus: function(status) {
        var statusText = "";

        var s = status.split(";");
        var i = parseInt(s[3]);
        var b = i.toString(2);

        var index = 24 - b.length;
        for (var i = 0; i < index; i += 1)
        {
            b = "0" + b;
        }

        b = b.split("").reverse().join("");

        this.searchBitStatus(b, s);
    },

    updateStatus: function(statusText) {

        // this.updateRunState(true, "运行状态: " + '运行');
    },

    searchBitStatus: function(data, p)
    {
        // 触发后玻璃门开
        if (data[22] == "0")
        {
            this.updateStatus("后侧玻璃门打开");
        }
        //触发后玻璃门关
        if (data[22] == "1")
        {
            this.updateStatus("后侧玻璃门关闭");
        }

        //触发流量低报警
        if (data[21] == "1")
        {
            this.updateStatus("流量低");
        }
        if (data[21] == "0")
        {
            this.updateStatus("流量正常");
        }

        //新滤纸夹舱空报警
        if (data[19] == "1")
        {
            this.updateStatus("新滤纸夹舱空");
        }
        if (data[19] == "0")
        {
            this.updateStatus("新滤纸夹舱正常");
        }

        //切割位置未找到滤纸夹具
        if (data[18] == "1")
        {
            this.updateStatus("切割位置未找到滤纸夹具");
        }
        if (data[18] == "0")
        {
            this.updateStatus("切割位置正常");
        }

        //旧滤纸夹舱满报警
        if (data[17] == "1")
        {
            this.updateStatus("旧滤纸夹舱满报警");
        }
        if (data[17] == "0")
        {
            this.updateStatus("旧滤纸夹舱正常");
        }

        //滤纸方向放反了
        if (data[10] == "1")
        {
            this.updateStatus("滤纸夹方向错误");
        }
        if (data[10] == "0")
        {
            this.updateStatus("滤纸夹方向正常");
        }

        //抽屉空了
        if (data[9] == "0")
        {
            this.updateStatus("抽屉被抽出");
        }
        if (data[9] == "1")
        {
            this.updateStatus("抽屉正常");
        }

        //前玻璃门打开
        if (data[8] == "0")
        {
            this.updateStatus("前侧玻璃门打开");
        }
        if (data[8] == "1")
        {
            this.updateStatus("前侧玻璃门关闭");
        }

        //新滤纸盒空了
        if (data[6] == "1")
        {
            this.updateStatus("新滤纸盒位置空");
        }
        if (data[6] == "0")
        {
            this.updateStatus("新滤纸盒位置正常");
        }

        //旧滤纸夹具舱门打开
        if (data[5] == "0")
        {
            this.updateStatus("旧滤纸夹具舱门打开");
        }
        if (data[5] == "1")
        {
            this.updateStatus("旧滤纸夹具舱门关闭");
        }

        //新滤纸夹具舱门打开
        if (data[4] == "0")
        {
            this.updateStatus("新滤纸夹具舱门打开");
        }
        if (data[4] == "1")
        {
            this.updateStatus("新滤纸夹具舱门关闭");
        }

        //应急报警
        /*
        if (data[0] == "1")
        {
            this.updateStatus("紧急开关报警");
        }
        if (data[0] == "0")
        {
            this.updateStatus("紧急开关正常");
        }*/

        // 模式, 过程
        if (p[0] == "0")
        {
            this.updateStatusLabel("span.mode", "自动模式");
        }
        else if (p[0] == "1")
        {
            this.updateStatusLabel("span.mode", "手动模式");
        }

        if (p[1] == "0")
        {
            this.updateStatusLabel("span.loop", "24小时模式");
        }
        else if (p[1] == "1")
        {
            this.updateStatusLabel("span.loop", "8小时模式");
        }
        else if (p[1] == "2")
        {
            this.updateStatusLabel("span.loop", "6小时模式");
        }
        else if (p[1] == "3")
        {
            this.updateStatusLabel("span.loop", "1小时模式");
        }

        if (p[2] == "0")
        {
            this.updateStatusLabel("span.step", "初始状态/样品测量");
        }
        else if (p[2] == "1")
        {
            this.updateStatusLabel("span.step", "机械臂开始移动");
        }
        else if (p[2] == "2")
        {
            this.updateStatusLabel("span.step", "开始拖动滤纸夹");
        }
        else if (p[2] == "3")
        {
            this.updateStatusLabel("span.step", "滤纸夹就位，开始切割");
        }
        else if (p[2] == "4")
        {
            this.updateStatusLabel("span.step", "切割完毕，铅室盖打开中");
        }
        else if (p[2] == "5")
        {
            this.updateStatusLabel("span.step", "完全打开铅室盖");
        }
        else if (p[2] == "6")
        {
            this.updateStatusLabel("span.step", "开始QA测量");
        }
        else if (p[2] == "7")
        {
            this.updateStatusLabel("span.step", "QA测量结束");
        }
        else if (p[2] == "8")
        {
            this.updateStatusLabel("span.step", "QA测量完毕，铅室盖关闭中");
        }
        else if (p[2] == "9")
        {
            this.updateStatusLabel("span.step", "QA测量完毕，铅室盖完全关闭");
        }


        //this.UpdateCinderellaStatusPanel(this.statusPane, this.statusDict);
        return true;
    },

    updateStatusLabel: function(clz, text)
    {
        this._domNode.find("div.tab-content").find(clz).text(text);
    }

});

$class("EnvSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {
        this._stationId = 128;
    },

    onAttach: function(domNode) {
        this._deviceType = "environment";
        this.onAttached(domNode);
    }

});

$class("LabrFilterSummaryDevice", DeviceSummaryBase,
    {
        __constructor: function() {
            this._stationId = 128;
        },

        onAttach: function(domNode) {
            this._deviceType = "labrfilter";
            this.onAttached(domNode);
        },

        onSettingPaneShow: function(fieldConfig)
        {
            console.log(fieldConfig);

        }

    });
