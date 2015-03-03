/**
* Created by Healer on 14-8-23.
*/
$class("EnvironmentDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "environment";
        this._noAlertData = true;
    },

    onAttach: function(domNode) {
        // ZM：调用基类的方法
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        // 现在设备自己的代码就少了，因为大量工作在基类了。
        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Temperature', 'name':'温度'},
            {'key':'Humidity', 'name':'湿度'},
            {'key':'BatteryHours', 'name':'电池时间'},
            {'key':'IfMainPowerOff', 'name':"电源"},
            {'key':'IfSmoke', 'name':'烟感'},
            {'key':'IfDoorOpen', 'name':'门禁'}]);

    },

    // ZM：注意函数是从基类调用的，多态。
    // 简单说，有些设备默认显示30秒的数据，有些则是5分钟的。
    // 但是基类的代码当然不知道派生类具体调用哪种，那么多态到派生类的fillListDefault即可。
    // 然后拍摄类fillListDefault的实现再决定是调用30秒的，而不是其他的。
    fillListDefault: function(page) {
        this.fillList(page)
    }
});
