/**
* Created by Healer on 14-8-23.
*/
$class("EnvironmentDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "environment";
        this._noAlertData = false;
    },

    onAttach: function(domNode) {
        // ZM：调用基类的方法
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        // 现在设备自己的代码就少了，因为大量工作在基类了。
        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Temperature', 'name':'温度(℃)'},
            {'key':'Humidity', 'name':'湿度(%rh)'},
            // {'key':'BatteryHours', 'name':'电池时间'},
            {'key':'IfMainPowerOff', 'name':"电源"},
            {'key':'IfSmoke', 'name':'烟感'},
            {'key':'IfDoorOpen', 'name':'门禁'},
            {'key':'IfWater', 'name':'浸水'}]);

    },

    // ZM：注意函数是从基类调用的，多态。
    // 简单说，有些设备默认显示30秒的数据，有些则是5分钟的。
    // 但是基类的代码当然不知道派生类具体调用哪种，那么多态到派生类的fillListDefault即可。
    // 然后拍摄类fillListDefault的实现再决定是调用30秒的，而不是其他的。

    fillListDefault: function(page) {
        page = page || 1;
        this.fetchDataByInterval(30, page);
    },

    fixData: function(value) {
        value.IfMainPowerOff = value.IfMainPowerOff ? "主电源" : "备用电源";
        value.IfSmoke = value.IfSmoke ? "异常" : "正常";
        value.IfDoorOpen = value.IfDoorOpen ? "打开" : "关闭";
        value.IfWater = value.IfWater ? "异常" : "正常";
        return value;
    },

    fetchAlerts: function(level, page) {
        var currentStationId = g.getCurrentStationId();
        if (currentStationId)
        {
            var api = "data/doorAlerts/" + currentStationId + "/" + this._deviceType +'/' + level;
            console.log(api);
            this._alertListView.setPage(page);
            this._alertListView.refresh(api, null, kx.bind(this, 'onAlertsDataReceived'));
        }
    },

    onAlertsDataReceived: function(data) {
        var results = eval("(" + data + ")")['results'];
        // console.log(results)
        var items = results['items']

        var count = items.length;
        var array = [];
        for (var i in items)
        {
            var item = items[i];
            // console.log(item);
            item.value = item.IfDoorOpen ? "门禁打开":"门禁关闭";
            item.time = item.Time;
            item.field = 'IfDoorOpen';
            array.push(item);
        }
        // console.log(array);
        this._alertListView.fillItems(array, this.AlertPageCount);

        this.updateAlertPageBar( count, this._alertListView.getPage() );
    }
});
