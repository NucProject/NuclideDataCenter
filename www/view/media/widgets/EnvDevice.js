/**
* Created by Healer on 14-8-23.
*/
$class("EnvironmentDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "environment";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Temperature', 'name':'温度'},
            {'key':'Humidity', 'name':'湿度'},
            {'key':'BatteryHours', 'name':'电池时间'},
            {'key':'IfMainPowerOff', 'name':"电源"},
            {'key':'IfSmoke', 'name':'烟感'},
            {'key':'IfDoorOpen', 'name':'门禁'}]);

    }


});
